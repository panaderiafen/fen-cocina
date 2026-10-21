// ═══════════════════════════════════════════════
//  fën · Cocina — informes para compartir (PDF o mensaje de WhatsApp)  v0.17.7
//  · Panadería → Hoy: "Masas del día" (masas terminadas y por terminar, sus tandas, hora de inicio y hora de formado).
//  · Bollería → Bitácora: "Informe del viernes" (congelado ahora, qué descongelar el domingo para el lunes, revisar
//    empastes y poolish). Se puede pedir cualquier día; parte con el lunes que viene.
//  Las funciones de arriba son puras (reciben los datos y devuelven el informe, el texto o el HTML: se prueban sin
//  navegador). Las de abajo (PDF, compartir, copiar) usan el navegador.
//  Sin costos (las jefas no ven costos): aquí no entra ningún precio.
//
//  SUPUESTO (pedido de Emmanuel, 21-oct): hora de inicio = la hora en que se marcó la tanda terminada (fin del amasado =
//  empieza la fermentación en bloque); hora de formado = inicio + la f.b. de esa receta (config/{AREA}.fermentacionBloque,
//  la que está configurada ahora en Sistema Fën: se ajusta según la temporada). Una tanda sin marcar dice "pendiente".
//
//  PDF: el mismo método de la app de logística (html2canvas + jsPDF desde cdnjs, solo la primera vez que se pide).
//  Las hojas se cortan entre bloques (una masa o una línea no queda partida entre dos hojas).
// ═══════════════════════════════════════════════
import * as M from './modelo.js?v=0.17.4';
import * as B from './bolleria.js?v=0.17.4';
import * as K from './consumo.js?v=0.17.4';
import * as CG from './congelado.js?v=0.17.4';
import * as FBQ from './fermentacion.js?v=0.17.2';

const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const n0 = M.num;
const plural = (n, s1, s2) => `${M.miles(n)} ${Math.round(n0(n)) === 1 ? s1 : s2}`;
const MES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fechaMedia = f => { const d = new Date(f + 'T12:00:00'); return `${M.DIAS_CORTOS[M.indiceDia(f)]} ${d.getDate()} ${MES_C[d.getMonth()]}`; };
const horaDe = ms => FBQ.hora(typeof ms === 'number' ? ms : Date.now());

export const SUPUESTO = 'Hora de inicio: cuando se marcó la tanda terminada (fin del amasado, empieza la fermentación en bloque). Hora de formado: inicio + la fermentación en bloque de la receta (la configurada en Sistema Fën). Una tanda sin marcar dice "pendiente".';

// "Agua 70 % (receta 75 %) · Harina base 10,5 kg (receta 10,8 kg)" (lo mismo que el chip de la tarjeta en Hoy)
export function textoAjuste(r, a) {
  if (!a || !r) return '';
  const P = M.panadero(r), partes = [];
  if (n0(a.harina) > 0 && Math.abs(n0(a.harina) - P.harina) > 0.1) { const gH = g => g >= 1000 ? M.gramos(g) : M.unidades(g) + ' g'; partes.push(`Harina base ${gH(a.harina)} (receta ${gH(P.harina)})`); }
  Object.entries(a.pct || {}).forEach(([id, p]) => {
    const i = (r.ingredientes || []).find(x => x.id === id);
    if (i && p !== null && p !== undefined) partes.push(`${i.nombre} ${M.unidades(p)} % (receta ${M.unidades(P.pct(i))} %)`);
  });
  return partes.join(' · ');
}
// El ajuste que vale ese día (modelo.js → ajusteDelDia), como etiqueta + texto
export function ajusteInfo(r, a) {
  const t = textoAjuste(r, a); if (!t) return null;
  const tipo = a.origen === 'sabado' ? 'sabado' : a.deSabado ? 'sabadoDia' : 'dia';
  return { tipo, etiqueta: tipo === 'sabado' ? 'Ajuste de sábado' : tipo === 'sabadoDia' ? 'Ajuste de sábado, solo hoy' : 'Ajuste', texto: t };
}

// ═══════════════ Panadería · Masas del día ═══════════════
// items: [{ nombre, tipo: 'masa'|'receta', unidad: 'un'|'g', un, total, receta, aj (ajusteDelDia), fbMin, para,
//           tandas: [{ cantidad, gramos, marca: { por, en } | null }] }]   (los arma app.js con lo mismo que pinta Hoy)
// Fecha guardada (texto ISO, Timestamp de Firestore o número) → milisegundos
const msDe = x => typeof x === 'number' ? x : typeof x === 'string' ? Date.parse(x) : x && typeof x.toMillis === 'function' ? x.toMillis() : x && x.seconds ? x.seconds * 1000 : NaN;
export function informePan({ fecha, quien = '', generado, items = [], notas = '' }) {
  const masas = items.map(it => {
    const enG = it.unidad === 'g', un = it.un || 'un', fb = n0(it.fbMin) > 0 ? Math.round(n0(it.fbMin)) : null;
    const tandas = (it.tandas || []).map((t, i) => {
      const m = t.marca && t.marca.por ? t.marca : null, e = m ? FBQ.estadoFB(m.en, fb) : null;
      return {
        n: i + 1, tamano: enG ? M.gramos(t.cantidad) : `${M.unidades(t.cantidad)} ${un} · ${M.gramos(t.gramos)}`,
        pendiente: !m, inicio: m ? FBQ.hora(m.en) : null, formado: e ? e.hasta : null, diaSiguiente: !!(e && e.diaSiguiente), por: m ? FBQ.nombreCorto(m.por) : '',
        // v0.17.8: para ordenar el día (inicio de la f. en bloque y formado, en milisegundos)
        tIni: m ? msDe(m.en) : null, tForm: m && fb ? msDe(m.en) + fb * 60000 : null
      };
    });
    const gramos = (it.tandas || []).reduce((s, t) => s + n0(t.gramos), 0);
    const hechas = tandas.filter(t => !t.pendiente).length;
    return {
      nombre: it.nombre, tipo: it.tipo || 'receta', para: it.para || '',
      cantidad: enG ? M.gramos(it.total) : `${M.unidades(it.total)} ${un}${gramos > 0 ? ' · ' + M.gramos(gramos) : ''}`,
      total: enG ? M.gramos(it.total) : `${M.unidades(it.total)} ${un}`, kg: !enG && gramos > 0 ? M.gramos(gramos) : '',   // v0.17.9
      fb: fb ? FBQ.aHHMM(fb) : '', ajuste: ajusteInfo(it.receta, it.aj), tandas, hechas, terminada: tandas.length > 0 && hechas === tandas.length
    };
  });
  // v0.17.8: las masas en el orden en que se forman (la que se forma primero, arriba); las sin marcar, al final
  const primero = x => { const v = x.tandas.map(t => t.tForm ?? t.tIni).filter(n => Number.isFinite(n)); return v.length ? Math.min(...v) : Infinity; };
  masas.sort((a, b) => primero(a) - primero(b));
  // Orden del día: cada tanda marcada da dos momentos (empieza la f. en bloque, se forma), de más temprano a más tarde
  const orden = [];
  masas.forEach(x => x.tandas.forEach(t => {
    if (t.pendiente) return;
    const quien = x.tandas.length > 1 ? `${x.nombre} · tanda ${t.n}` : x.nombre;
    if (Number.isFinite(t.tIni)) orden.push({ t: t.tIni, hora: t.inicio, que: 'inicio', texto: `Empieza la fermentación en bloque · ${quien}` });
    if (Number.isFinite(t.tForm)) orden.push({ t: t.tForm, hora: t.formado + (t.diaSiguiente ? ' (día sig.)' : ''), que: 'formar', texto: `Formar · ${quien}` });
  }));
  const rango = o => o.que === 'formar' ? 0 : 1;   // a la misma hora, primero lo que hay que formar
  orden.sort((a, b) => a.t - b.t || rango(a) - rango(b));
  const tandas = masas.reduce((s, x) => s + x.tandas.length, 0), hechas = masas.reduce((s, x) => s + x.hechas, 0);
  return {
    tipo: 'pan', area: 'Panadería', titulo: 'Masas del día', fecha, fechaTxt: M.fechaLarga(fecha), quien, hora: horaDe(generado),
    masas, orden, notas: String(notas || '').trim(),
    resumen: { masas: masas.length, terminadas: masas.filter(x => x.terminada).length, tandas, hechas, sabado: masas.some(x => x.ajuste && x.ajuste.tipo !== 'dia') }
  };
}
const lineaTanda = (x, t) => {
  const que = x.tandas.length > 1 ? `Tanda ${t.n}` : 'Tanda';
  if (t.pendiente) return `${que} (${t.tamano}): pendiente`;
  const formado = t.formado ? `formado ${t.formado}${t.diaSiguiente ? ' (día siguiente)' : ''}` : 'formado —';
  return `${que} (${t.tamano}): inicio ${t.inicio} · ${formado}`;
};

// ═══════════════ Bollería · Informe del viernes ═══════════════
// Todo sale de lo que ya calcula la app (bolleria.js, congelado.js, consumo.js); no hay reglas nuevas.
// e = { lunes (el lunes del informe), hoy, quien, generado, diasDocs ({ fecha: dias/BOL_fecha }), metas ({ lunes: metas/BOL_lunes }),
//       recetas, mps, config (config/BOL) }
export function informeBol(e) {
  const W = e.lunes, hoy = e.hoy || M.hoyTxt(), dom = M.sumarDias(W, -1), vie = M.sumarDias(W, -3), sab = M.sumarDias(W, 5);
  const c = { recetas: e.recetas || [], mps: e.mps || [], config: e.config || {} }, cfg = c.config, dias = e.diasDocs || {}, metas = e.metas || {};
  const rec = id => c.recetas.find(r => r.id === id), nombre = id => (rec(id) || {}).nombre || id;
  const porNombre = (a, b) => a.nombre.localeCompare(b.nombre, 'es');
  // (a) Lo que hay: el congelado al cierre de hoy (o del domingo antes del lunes, si ya pasó)
  const hasta = hoy < dom ? hoy : dom;
  const st = CG.stock(dias, hasta);
  const invs = B.anotaciones(dias, hasta).filter(a => a.tipo === 'inventario');
  const ultimoInv = invs.length ? invs[invs.length - 1].fecha : null;
  const idsMasa = [...new Set([...Object.keys(st.masas), ...Object.keys(st.empastes)])];
  const stockMasas = idsMasa.filter(id => n0(st.masas[id]) || n0(st.empastes[id])).map(id => ({ id, nombre: nombre(id), masas: n0(st.masas[id]), empastes: Math.round(n0(st.empastes[id]) * 100) / 100 })).sort(porNombre);
  const stockProd = Object.keys(st.productos).filter(id => n0(st.productos[id]) > 0).map(id => { const r = rec(id); return { id, nombre: nombre(id), n: n0(st.productos[id]), cajas: B.cajas(st.productos[id], r && r.unidadesPorCaja) }; }).sort(porNombre);
  const negativos = [...Object.entries(st.masas), ...Object.entries(st.productos)].filter(([, n]) => n0(n) < 0).map(([id]) => nombre(id))
    .concat(Object.entries(st.empastes).filter(([, n]) => n0(n) < -0.01).map(([id]) => 'empastes de ' + nombre(id)));
  // (b) La semana del lunes: lo que hay que formar (meta − stock inicial + dejar, como en Metas) y sus masas (como el PEM)
  const docs = { metas: metas[W] || null, metasAnt: metas[M.sumarDias(W, -7)] || null, metasAnt2: metas[M.sumarDias(W, -14)] || null, metasAnt3: metas[M.sumarDias(W, -21)] || null };
  const plan = CG.planSemana(W, docs, dias, hoy), aF = CG.aFormar(plan);
  const nec = B.necesidades(aF, c, cfg);
  const desc = {}, descDom = {};
  B.anotaciones(dias, hoy).forEach(a => {
    if (a.tipo !== 'descongelo' || a.fecha < dom || a.fecha > sab) return;
    desc[a.masa] = (desc[a.masa] || 0) + n0(a.n);
    if (a.fecha === dom) descDom[a.masa] = (descDom[a.masa] || 0) + n0(a.n);
  });
  const semana = nec.masas.map(x => {
    const id = x.masa.id, descongeladas = desc[id] || 0, porDescongelar = Math.max(0, x.masas - descongeladas), congeladas = Math.max(0, n0(st.masas[id]));
    return {
      id, nombre: x.masa.nombre, necesarias: x.masas, exactas: x.exactas, merma: x.merma, kg: x.kg, descongeladas, porDescongelar, congeladas,
      faltan: Math.max(0, porDescongelar - congeladas),
      productos: x.productos.map(p => { const pl = plan[p.receta.id] || {}; return { nombre: p.receta.nombre, piezas: p.piezas, masas: p.masas, rinde: p.rinde, meta: n0(pl.meta), inicial: n0(pl.inicial), dejar: n0(pl.dejar), fuente: pl.fuente }; }).sort(porNombre)
    };
  });
  const conMeta = !!(docs.metas && Object.values(docs.metas.productos || {}).some(v => n0(v) > 0));
  // Descongelar el domingo para el lunes: lo que anotaron en el cierre del viernes (Bitácora → Cierre del viernes)
  const cierre = (dias[vie] || {}).cierre || null;
  const domingo = cierre && cierre.domingo ? {
    por: cierre.por || '', en: cierre.en || '',
    masas: Object.entries(cierre.domingo.masas || {}).filter(([, n]) => n0(n) > 0).map(([id, n]) => ({ id, nombre: nombre(id), n: n0(n) })).sort(porNombre),
    productos: Object.entries(cierre.domingo.productos || {}).filter(([, n]) => n0(n) > 0).map(([id, n]) => ({ id, nombre: nombre(id), n: n0(n) })).sort(porNombre)
  } : null;
  const yaDomingo = Object.entries(descDom).filter(([, n]) => n > 0).map(([id, n]) => ({ id, nombre: nombre(id), n })).sort(porNombre);
  // (c) Revisar: empastes de la semana (congelado.js → empastesSemana) y lo que llevan las masas del lunes (PEM)
  const emp = CG.empastesSemana(dias, W, plan, c, hoy);
  const empastes = Object.entries(emp).map(([id, x]) => {
    const g = K.empGramosPorMasa(id, c), paraLunes = domingo ? n0((domingo.masas.find(m => m.id === id) || {}).n) : 0;
    return { id, nombre: nombre(id), necesarios: x.necesarios, usados: x.usados, refri: x.refri, hechos: x.hechos, faltan: x.faltan, gPor: g ? g.g : 0, paraLunes };
  }).filter(x => x.necesarios > 0 || x.refri > 0 || x.paraLunes > 0).sort(porNombre);
  const pem = (metas[M.sumarDias(W, 7)] || {}).elaboracion || {};
  const masasLunes = B.masasBase(c.recetas, 'BOL').map(rs => ({ rs, n: n0((pem[rs.id] || {}).d0) })).filter(x => x.n > 0);
  const hechosLunes = (dias[W] || {}).hechos || {};
  const subs = masasLunes.length ? M.elaboracionesDia(masasLunes.map(x => ({ receta: x.rs, unidades: x.n })), {}, c).subRecetas : [];
  const previas = subs.map(s => ({ id: s.id, nombre: s.nombre, gramos: s.gramos, poolish: /poolish/i.test(s.nombre), hecho: !!(hechosLunes['sub_' + s.id] && hechosLunes['sub_' + s.id].por) }));
  // La lista para revisar: ok (listo), falta (hay que hacer algo) o revisar (no sale de los datos: se revisa a mano)
  const revisar = [];
  empastes.forEach(x => {
    const g = x.faltan && x.gPor ? ` (${M.gramos(x.faltan * x.gPor)})` : '';
    const base = `En el refri hay ${M.unidades(Math.max(0, x.refri))}; la semana necesita ${M.miles(x.necesarios)}${x.usados ? ` (ya usados ${M.unidades(x.usados)})` : ''}.`;
    if (x.faltan > 0) revisar.push({ estado: 'falta', titulo: `Empaste ${x.nombre}: hay que hacer ${M.miles(x.faltan)}${g}`, detalle: base });
    else revisar.push({ estado: 'ok', titulo: `Empaste ${x.nombre}: alcanza`, detalle: base });
    if (x.paraLunes > Math.max(0, x.refri)) revisar.push({ estado: 'falta', titulo: `Para laminar el lunes ${plural(x.paraLunes, 'masa', 'masas')} de ${x.nombre} faltan ${M.unidades(x.paraLunes - Math.max(0, x.refri))} empastes`, detalle: 'Cada masa se lamina con su empaste (como avisa "Descongelé masas").' });
  });
  const pool = previas.filter(p => p.poolish), otras = previas.filter(p => !p.poolish);
  const paraMasas = masasLunes.map(x => `${plural(x.n, 'masa', 'masas')} de ${x.rs.nombre}`).join(', ');
  if (!masasLunes.length) revisar.push({ estado: 'ok', titulo: 'Poolish: el lunes no hay masas en el PEM', detalle: 'No hace falta poolish para el lunes.' });
  else if (!pool.length) revisar.push({ estado: 'revisar', titulo: 'Poolish: las masas del lunes no llevan poolish en su receta', detalle: `El lunes se elaboran ${paraMasas}. Revisa la receta si debería llevarlo.` });
  pool.forEach(p => revisar.push(p.hecho ? { estado: 'ok', titulo: `${p.nombre}: ya está marcado hecho el lunes`, detalle: `${M.gramos(p.gramos)} para ${paraMasas}.` }
    : { estado: 'falta', titulo: `${p.nombre}: hay que hacer ${M.gramos(p.gramos)}`, detalle: `Para ${paraMasas} del lunes (PEM).` }));
  otras.forEach(p => revisar.push(p.hecho ? { estado: 'ok', titulo: `${p.nombre}: ya está marcado hecho el lunes`, detalle: M.gramos(p.gramos) + '.' }
    : { estado: 'falta', titulo: `${p.nombre}: hay que hacer ${M.gramos(p.gramos)}`, detalle: `Para ${paraMasas} del lunes (PEM).` }));
  semana.filter(x => x.faltan > 0).forEach(x => revisar.push({ estado: 'falta', titulo: `${x.nombre}: faltan ${plural(x.faltan, 'masa', 'masas')} en el congelador para la semana`, detalle: `Hay ${M.miles(x.congeladas)} congeladas y quedan ${M.miles(x.porDescongelar)} por descongelar.` }));
  // Lo que no sale de los datos de la app: a mano
  if (!domingo) revisar.push({ estado: 'revisar', titulo: 'Cuánto descongelar el domingo para el lunes', detalle: 'La meta es de la semana: la app no sabe cuánto se forma el lunes. Decídanlo y anótenlo en Bitácora → Cierre del viernes (así sale en este informe).' });
  if (!st.conInventario) revisar.push({ estado: 'revisar', titulo: 'Sin inventario del congelador', detalle: 'Cuenten el congelador (Bitácora → Inventario del congelador): sin eso el stock no es real.' });
  if (negativos.length) revisar.push({ estado: 'revisar', titulo: 'Quedan en negativo: ' + negativos.join(', '), detalle: 'Revisen las anotaciones o hagan un inventario.' });
  if (!conMeta) revisar.push({ estado: 'revisar', titulo: `Sin meta para la semana del ${M.etiquetaSemana(W)}`, detalle: 'Pónganla en Metas para saber qué formar y qué descongelar.' });
  return {
    tipo: 'bol', area: 'Bollería', titulo: 'Informe del viernes', lunes: W, lunesTxt: M.fechaLarga(W), fecha: hoy, fechaTxt: M.fechaLarga(hoy), quien: e.quien || '', hora: horaDe(e.generado),
    stock: { hasta, hastaTxt: fechaMedia(hasta), conInventario: st.conInventario, ultimoInv, ultimoInvTxt: ultimoInv ? fechaMedia(ultimoInv) : '', masas: stockMasas, productos: stockProd },
    semana, conMeta, semanaTxt: M.etiquetaSemana(W), domingo, domingoTxt: fechaMedia(dom), yaDomingo, empastes, masasLunes: masasLunes.map(x => ({ id: x.rs.id, nombre: x.rs.nombre, n: x.n })), previas, revisar
  };
}

// ═══════════════ Texto para WhatsApp (sin emojis; *negrita*) ═══════════════
export function texto(inf) {
  const L = [];
  if (inf.tipo === 'pan') {
    L.push(`*Fën · Panadería · Masas del día*`, `${inf.fechaTxt}${inf.quien ? ` · envía ${inf.quien}` : ''}`);
    if (inf.orden && inf.orden.length) { L.push('', '*Orden del día*'); inf.orden.forEach(o => L.push(`${o.hora} · ${o.texto}`)); }
    if (!inf.masas.length) L.push('', 'Sin masas planificadas para este día.');
    inf.masas.forEach(x => {
      // v0.17.9: masa y total; cada tanda con sus horas; lo demás en cursiva al final
      L.push('', `*${x.nombre}* · total ${x.total}`);
      x.tandas.forEach(t => L.push(lineaTanda(x, t)));
      const chico = [x.kg, x.para, x.fb ? `fermentación en bloque ${x.fb}` : 'sin fermentación en bloque configurada', x.ajuste ? `${x.ajuste.etiqueta}: ${x.ajuste.texto}` : ''].filter(Boolean);
      L.push(`_${chico.join(' · ')}_`);
    });
    if (inf.masas.length) L.push('', `Resumen: ${inf.resumen.terminadas} de ${plural(inf.resumen.masas, 'masa terminada', 'masas terminadas')} · ${inf.resumen.hechas} de ${plural(inf.resumen.tandas, 'tanda', 'tandas')}`);
    if (inf.notas) L.push('', `Notas del día: ${inf.notas}`);
    return L.join('\n');
  }
  L.push(`*Fën · Bollería · Informe del viernes*`, `Para el ${inf.lunesTxt.toLowerCase()} · ${inf.fechaTxt}${inf.quien ? ` · envía ${inf.quien}` : ''}`);
  const s = inf.stock;
  L.push('', `*1. Congelado ahora* (al cierre del ${s.hastaTxt}${s.ultimoInv ? `; último inventario ${s.ultimoInvTxt}` : '; sin inventario'})`);
  if (!s.masas.length && !s.productos.length) L.push('- Nada congelado');
  s.masas.forEach(m => L.push(`- ${m.nombre}: ${plural(m.masas, 'masa', 'masas')} · ${M.unidades(m.empastes)} empastes en el refri`));
  s.productos.forEach(p => L.push(`- ${p.nombre}: ${M.miles(p.n)}${p.cajas !== null ? ` (${plural(p.cajas, 'caja', 'cajas')})` : ''}`));
  L.push('', `*2. Descongelar el domingo ${inf.domingoTxt} para el lunes*`);
  if (inf.domingo) {
    L.push(`Del cierre del viernes${inf.domingo.por ? ` (${inf.domingo.por})` : ''}:`);
    if (!inf.domingo.masas.length && !inf.domingo.productos.length) L.push('- Nada');
    inf.domingo.masas.forEach(m => L.push(`- ${m.nombre}: ${plural(m.n, 'masa', 'masas')} · el lunes laminar con ${plural(m.n, 'empaste', 'empastes')}`));
    inf.domingo.productos.forEach(p => L.push(`- ${p.nombre}: ${M.miles(p.n)}`));
  } else L.push('Falta decidirlo: anótenlo en Bitácora → Cierre del viernes.');
  if (inf.yaDomingo.length) L.push(`Ya anotado el domingo: ${inf.yaDomingo.map(x => `${x.nombre} ${plural(x.n, 'masa', 'masas')}`).join(', ')}`);
  L.push('', `Semana del ${inf.semanaTxt} (meta):`);
  if (!inf.semana.length) L.push('- Sin piezas para formar');
  inf.semana.forEach(x => {
    L.push(`- ${x.nombre}: ${plural(x.necesarias, 'masa', 'masas')} para formar · descongeladas ${M.miles(x.descongeladas)} · por descongelar ${M.miles(x.porDescongelar)} · congeladas ${M.miles(x.congeladas)}${x.faltan ? ` · faltan ${M.miles(x.faltan)}` : ''}`);
    x.productos.forEach(p => L.push(`  ${p.nombre}: ${M.miles(p.piezas)} piezas (1 masa rinde ${M.unidades(p.rinde)})`));
  });
  L.push('', '*3. Revisar*');
  inf.revisar.forEach(r => L.push(`- ${r.estado === 'ok' ? 'Listo' : r.estado === 'falta' ? 'Falta' : 'Revisar'}: ${r.titulo}. ${r.detalle}`));
  return L.join('\n');
}
// El mensaje corto que acompaña al PDF
export function textoCorto(inf) {
  return inf.tipo === 'pan'
    ? `Fën · Panadería · Masas del día · ${inf.fechaTxt}${inf.quien ? ' · envía ' + inf.quien : ''}. ${inf.resumen.terminadas} de ${plural(inf.resumen.masas, 'masa terminada', 'masas terminadas')}.`
    : `Fën · Bollería · Informe del viernes para el ${inf.lunesTxt.toLowerCase()}${inf.quien ? ' · envía ' + inf.quien : ''}.`;
}
export const nombreArchivo = inf => inf.tipo === 'pan' ? `Fen_Panaderia_Masas_${inf.fecha}.pdf` : `Fen_Bolleria_Informe_viernes_${inf.lunes}.pdf`;

// ═══════════════ HTML (vista previa en la pantalla y el PDF) ═══════════════
const SVG = {
  check: '<path d="M6 12.5l4 4 8-9"/>', alerta: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5M12 16h.01"/>', caja: '<rect x="5" y="5" width="14" height="14" rx="3"/>',
  reloj: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>', repetir: '<path d="M17 3l3 3-3 3"/><path d="M4 12V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 12v3a3 3 0 0 1-3 3H4"/>',
  copo: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>', ajuste: '<path d="M5 7h9M18 7h1M5 17h3M12 17h7"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'
};
// Íconos lineales con el color escrito (html2canvas no siempre toma currentColor)
const icono = (n, color) => `<svg class="inf-ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${SVG[n] || ''}</svg>`;
const COL = { texto: '#2B2622', suave: '#6B625A', ok: '#3F5E44', ojo: '#7A5718', sab: '#2F5A7A', linea: '#ECE6DE', fondoSuave: '#F7F3EE' };
const fila = (nombre, valor, clase = '') => `<div class="inf-fila inf-bloque ${clase}"><span class="inf-n">${nombre}</span><span class="inf-v">${valor}</span></div>`;
const cab = inf => `<div class="inf-cab inf-bloque"><img class="inf-logo" src="logo-fen.png" alt="Fën"><div class="inf-cab-t">
    <div class="inf-area">Fën · ${esc(inf.area)}</div><div class="inf-t1">${esc(inf.titulo)}</div>
    <div class="inf-t2">${inf.tipo === 'bol' ? `Para el ${esc(inf.lunesTxt.toLowerCase())} · ` : ''}${esc(inf.fechaTxt)}${inf.quien ? ` · envía ${esc(inf.quien)}` : ''} · ${esc(inf.hora)}</div></div></div>`;

export function html(inf) {
  if (inf.tipo === 'pan') {
    const r = inf.resumen;
    // v0.17.9: primero la masa y su total, después cada tanda con sus horas; lo demás, en letra chica al final
    const masas = inf.masas.map(x => {
      const chico = [x.kg, x.para, x.fb ? `fermentación en bloque ${x.fb}` : 'sin fermentación en bloque configurada', x.ajuste ? `${x.ajuste.etiqueta}: ${x.ajuste.texto}` : ''].filter(Boolean);
      return `<section class="inf-masa${x.terminada ? ' inf-terminada' : ''}">
        <div class="inf-masa-cab inf-bloque"><b class="inf-masa-t">${esc(x.nombre)}</b><span class="inf-masa-tot">total ${esc(x.total)}</span></div>
        ${x.tandas.map(t => `<div class="inf-tanda inf-bloque${t.pendiente ? ' inf-pend' : ''}">
          <span class="inf-tanda-n">${icono(t.pendiente ? 'caja' : 'check', t.pendiente ? COL.suave : COL.ok)}<b>${x.tandas.length > 1 ? `Tanda ${t.n}` : 'Tanda'}</b><span class="inf-tam">${esc(t.tamano)}</span></span>
          <span class="inf-horas">${t.pendiente ? '<span class="inf-pend-t">pendiente</span>' : `<span>inicio <b>${esc(t.inicio)}</b></span><span>formado <b>${t.formado ? esc(t.formado) + (t.diaSiguiente ? ' (día sig.)' : '') : '—'}</b></span>`}</span>
        </div>`).join('')}
        <div class="inf-chico inf-bloque">${chico.map(esc).join(' · ')}</div>
      </section>`;
    }).join('');
    return `<div class="inf">${cab(inf)}
      <div class="inf-banda inf-bloque"><div><div class="inf-banda-v">${r.terminadas} de ${r.masas}</div><div class="inf-banda-e">${r.masas === 1 ? 'masa terminada' : 'masas terminadas'}</div></div><div><div class="inf-banda-v">${r.hechas} de ${r.tandas}</div><div class="inf-banda-e">tandas</div></div></div>
      ${inf.orden && inf.orden.length ? `<div class="inf-sec inf-bloque">Orden del día</div><div class="inf-orden">${inf.orden.map(o => `<div class="inf-orden-f inf-bloque${o.que === 'formar' ? ' inf-orden-formar' : ''}"><b>${esc(o.hora)}</b><span>${esc(o.texto)}</span></div>`).join('')}</div><div class="inf-sec inf-bloque">Masas, en el orden en que se forman</div>` : ''}
      ${masas || '<p class="inf-nota inf-bloque">Sin masas planificadas para este día.</p>'}
      ${inf.notas ? `<div class="inf-sec inf-bloque">Notas del día</div><p class="inf-texto inf-bloque">${esc(inf.notas)}</p>` : ''}
      <div class="inf-pie inf-bloque">Fën · Cocina · Panadería · informe interno (sin costos)</div></div>`;
  }
  const s = inf.stock;
  const stock = [...s.masas.map(m => fila(esc(m.nombre), `${plural(m.masas, 'masa', 'masas')} · ${M.unidades(m.empastes)} empastes en el refri`)),
    ...s.productos.map(p => fila(esc(p.nombre), `${M.miles(p.n)}${p.cajas !== null ? ` · ${plural(p.cajas, 'caja', 'cajas')}` : ''}`))].join('') || fila('Nada congelado', '');
  const dom = inf.domingo
    ? ([...inf.domingo.masas.map(m => fila(esc(m.nombre), `${plural(m.n, 'masa', 'masas')} · laminar con ${plural(m.n, 'empaste', 'empastes')}`)), ...inf.domingo.productos.map(p => fila(esc(p.nombre), M.miles(p.n)))].join('') || fila('Nada', ''))
    : `<p class="inf-nota inf-bloque">${icono('caja', COL.ojo)}<span>Falta decidirlo: anótenlo en Bitácora → Cierre del viernes (así sale aquí).</span></p>`;
  const semana = inf.semana.map(x => `<div class="inf-grupo inf-bloque">
      <div class="inf-fila"><span class="inf-n"><b>${esc(x.nombre)}</b></span><span class="inf-v"><b>${plural(x.necesarias, 'masa', 'masas')}</b> para formar</span></div>
      <div class="inf-sub">Descongeladas ${M.miles(x.descongeladas)} · por descongelar ${M.miles(x.porDescongelar)} · congeladas ${M.miles(x.congeladas)}${x.faltan ? ` · <b class="inf-ojo">faltan ${M.miles(x.faltan)}</b>` : ''}</div>
      ${x.productos.map(p => `<div class="inf-fila inf-fila-s"><span class="inf-n">${esc(p.nombre)}</span><span class="inf-v">${M.miles(p.piezas)} piezas · 1 masa rinde ${M.unidades(p.rinde)}</span></div>`).join('')}
    </div>`).join('') || fila('Sin piezas para formar', '');
  const rev = inf.revisar.map(r => `<div class="inf-rev inf-bloque inf-rev-${r.estado}">${icono(r.estado === 'ok' ? 'check' : r.estado === 'falta' ? 'alerta' : 'caja', r.estado === 'ok' ? COL.ok : r.estado === 'falta' ? COL.ojo : COL.suave)}<div><b>${esc(r.titulo)}</b><span>${esc(r.detalle)}</span></div><span class="inf-rev-e">${r.estado === 'ok' ? 'Listo' : r.estado === 'falta' ? 'Falta' : 'Revisar'}</span></div>`).join('');
  return `<div class="inf">${cab(inf)}
    <div class="inf-sec inf-bloque">${icono('copo', COL.texto)}1 · Congelado ahora</div>
    <div class="inf-sub inf-bloque">Al cierre del ${esc(s.hastaTxt)} · ${s.ultimoInv ? `último inventario ${esc(s.ultimoInvTxt)}` : 'sin inventario del congelador'}</div>
    <div class="inf-caja">${stock}</div>
    <div class="inf-sec inf-bloque">${icono('reloj', COL.texto)}2 · Descongelar el domingo ${esc(inf.domingoTxt)} para el lunes</div>
    ${inf.domingo ? `<div class="inf-sub inf-bloque">Del cierre del viernes${inf.domingo.por ? ` · ${esc(inf.domingo.por)}` : ''}</div>` : ''}
    <div class="inf-caja">${dom}</div>
    ${inf.yaDomingo.length ? `<div class="inf-sub inf-bloque">Ya anotado el domingo: ${esc(inf.yaDomingo.map(x => `${x.nombre} ${plural(x.n, 'masa', 'masas')}`).join(', '))}</div>` : ''}
    <div class="inf-sub inf-bloque"><b>Semana del ${esc(inf.semanaTxt)}</b> · lo que hay que formar (meta − stock inicial + dejar) y sus masas</div>
    <div class="inf-caja">${semana}</div>
    <div class="inf-sec inf-bloque">${icono('check', COL.texto)}3 · Revisar</div>
    <div class="inf-revs">${rev}</div>
    <div class="inf-pie inf-bloque">Fën · Cocina · Bollería · informe interno (sin costos)</div></div>`;
}
// Estilos del informe (los mismos en la vista previa y en el PDF; ancho fluido: cabe en el celular)
export const CSS = `.inf-masa-t{font-size:18px}.inf-masa-tot{font-size:16px;font-weight:700}.inf .inf-tanda{font-size:15.5px;align-items:baseline}.inf-tam{font-size:12px;color:${COL.suave};margin-left:6px;font-weight:400}.inf-horas b{font-size:16px}.inf-chico{font-size:11.5px;color:${COL.suave};line-height:1.4}
.inf-orden{display:flex;flex-direction:column;border:1px solid ${COL.linea};border-radius:10px;overflow:hidden}.inf-orden-f{display:grid;grid-template-columns:minmax(3.2em,max-content) minmax(0,1fr);gap:12px;padding:6px 10px;border-top:1px solid ${COL.linea}}.inf-orden-f:first-child{border-top:0}.inf-orden-formar{background:${COL.fondoSuave}}
.inf{background:#fff;color:${COL.texto};font-family:Figtree,system-ui,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.45;font-variant-numeric:tabular-nums;padding:18px;display:flex;flex-direction:column;gap:8px;min-width:0;overflow-wrap:anywhere}
.inf *{box-sizing:border-box}.inf b{font-weight:700}
.inf-ic{flex:none;vertical-align:-3px}
.inf-cab{display:flex;align-items:center;gap:14px}.inf-logo{width:56px;height:auto;flex:none}.inf-cab-t{min-width:0}
.inf-area{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:${COL.suave}}
.inf-t1{font-size:20px;font-weight:700;line-height:1.2}.inf-t2{font-size:13px;color:${COL.suave};margin-top:2px}
.inf-banda{display:flex;flex-wrap:wrap;gap:10px 28px;padding:12px 14px;border-radius:12px;background:#FBF3EC;margin-top:6px}
.inf-banda-v{font-size:22px;font-weight:700;line-height:1.1}.inf-banda-e{font-size:12px;color:${COL.suave}}
.inf-nota{display:flex;gap:8px;align-items:flex-start;margin:0;font-size:12.5px;color:${COL.suave}}
.inf-masa{border:1px solid ${COL.linea};border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
.inf-terminada{border-color:#CFE0D1}
.inf-masa-cab{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 12px;align-items:baseline}
.inf-masa-n{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-size:15.5px;min-width:0}.inf-masa-c{font-weight:600;white-space:nowrap}
.inf-sub{font-size:12.5px;color:${COL.suave}}
.inf-chip{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;padding:3px 9px;border-radius:999px;border:1px solid ${COL.linea};background:#FCFAF7;color:${COL.suave};max-width:100%}
.inf-chip-ok{background:#EEF3EE;border-color:#CFE0D1;color:${COL.ok};font-weight:600}
.inf-chip-sab{background:#EAF1F7;border-color:#C9DBEA;color:${COL.sab};font-weight:600}
.inf-tanda{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 14px;padding:7px 0;border-top:1px solid #F1ECE5}
.inf-tanda-n{display:flex;gap:6px;align-items:flex-start;min-width:0}
.inf-horas{display:flex;flex-wrap:wrap;gap:4px 14px;margin-left:auto;justify-content:flex-end}.inf-por{color:${COL.suave}}
.inf-pend .inf-tanda-n{color:${COL.suave}}.inf-pend-t{font-weight:600;color:${COL.ojo}}
.inf-sec{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:700;margin-top:10px}
.inf-caja{border:1px solid ${COL.linea};border-radius:12px;padding:2px 12px}
.inf-fila{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 14px;padding:7px 0;border-bottom:1px solid #F1ECE5}
.inf-caja>.inf-fila:last-child,.inf-caja>.inf-grupo:last-child{border-bottom:0}
.inf-n{min-width:0}.inf-v{margin-left:auto;text-align:right}
.inf-grupo{padding:6px 0;border-bottom:1px solid #F1ECE5}.inf-grupo .inf-fila{border-bottom:0;padding:3px 0}
.inf-fila-s{font-size:13px;color:${COL.suave};padding-left:10px !important}
.inf-ojo{color:${COL.ojo}}
.inf-revs{display:flex;flex-direction:column;gap:6px}
.inf-rev{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:10px;border:1px solid ${COL.linea}}
.inf-rev>div{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}.inf-rev span{font-size:12.5px;color:${COL.suave}}
.inf-rev-e{font-weight:700;white-space:nowrap}.inf-rev-ok{background:#F4F8F4}.inf-rev-ok .inf-rev-e{color:${COL.ok}}
.inf-rev-falta{background:#FBF3E0;border-color:#F2D7B0}.inf-rev-falta .inf-rev-e{color:${COL.ojo}}
.inf-texto{margin:0;white-space:pre-wrap}
.inf-pie{font-size:11px;color:${COL.suave};border-top:1px solid ${COL.linea};padding-top:8px;margin-top:8px}`;

// ═══════════════ Navegador: PDF, compartir, copiar ═══════════════
const CDN = { h2c: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js' };
const cargados = {};
function script(url) {
  if (!cargados[url]) cargados[url] = new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = url; s.onload = ok;
    s.onerror = () => { delete cargados[url]; s.remove(); no(new Error('No se pudo cargar el generador de PDF (revisa internet).')); };
    document.head.appendChild(s);
  });
  return cargados[url];
}
export function ponerEstilos() {
  if (document.getElementById('inf-css')) return;
  const s = document.createElement('style'); s.id = 'inf-css'; s.textContent = CSS; document.head.appendChild(s);
}
// Dónde cortar las hojas: entre bloques (alto de cada hoja en píxeles del dibujo). Puro: se prueba sin navegador.
export function cortes(altoTotal, altoHoja, bordes) {
  const b = [...new Set((bordes || []).map(Math.round))].filter(x => x > 0 && x < altoTotal).sort((x, y) => x - y), out = [];
  let y = 0;
  while (y < altoTotal - 1) {
    let fin = Math.min(altoTotal, y + altoHoja);
    if (fin < altoTotal) { const corte = b.filter(x => x > y + altoHoja * 0.25 && x <= fin).pop(); if (corte) fin = corte; }
    out.push([y, fin]); y = fin;
  }
  return out;
}
// El PDF (tamaño carta, vertical) → { blob, nombre }
export async function pdf(inf) {
  await Promise.all([script(CDN.h2c), script(CDN.jspdf), document.fonts ? document.fonts.ready : null]);
  ponerEstilos();
  const caja = document.createElement('div');
  caja.style.cssText = 'position:absolute;top:0;left:-99999px;width:720px;z-index:-1';
  caja.innerHTML = html(inf);
  document.body.appendChild(caja);
  try {
    const raiz = caja.querySelector('.inf'); raiz.style.padding = '36px 40px'; raiz.style.fontSize = '15px';
    const img = caja.querySelector('.inf-logo');
    if (img && !img.complete) await new Promise(r => { img.onload = img.onerror = r; setTimeout(r, 4000); });
    const escalaC = 2, top0 = raiz.getBoundingClientRect().top;
    const bordes = [...raiz.querySelectorAll('.inf-bloque')].map(el => (el.getBoundingClientRect().top - top0) * escalaC);
    const canvas = await window.html2canvas(raiz, { scale: escalaC, backgroundColor: '#ffffff', width: 720, windowWidth: 720 });
    const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
    const margen = 36, anchoUtil = 612 - margen * 2, altoUtil = 792 - margen * 2, escala = anchoUtil / canvas.width;
    cortes(canvas.height, Math.floor(altoUtil / escala), bordes).forEach(([y0, y1], pag) => {
      const c = document.createElement('canvas'); c.width = canvas.width; c.height = y1 - y0;
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(canvas, 0, y0, canvas.width, y1 - y0, 0, 0, canvas.width, y1 - y0);
      if (pag) doc.addPage();
      doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', margen, margen, canvas.width * escala, (y1 - y0) * escala);
    });
    return { blob: doc.output('blob'), nombre: nombreArchivo(inf) };
  } finally { caja.remove(); }
}
const esTactil = () => { try { return matchMedia('(pointer: coarse)').matches; } catch (e) { return false; } };
const abrirWsp = t => window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank', 'noopener');
function bajar(archivo) {
  const url = URL.createObjectURL(archivo), a = document.createElement('a');
  a.href = url; a.download = archivo.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
// "Enviar PDF": en el celular o la tablet, Compartir con el PDF y el mensaje corto (se elige el chat o el grupo).
// Si el equipo no comparte archivos (PC), baja el PDF y abre WhatsApp con el mensaje (el PDF se adjunta a mano).
// archivo: un File ya hecho (si se preparó antes, así el celular no pide otro toque). Devuelve 'compartido' | 'cancelado' |
// 'otra' (el celular pide un toque nuevo) | 'descargado'.
export async function enviarPdf(inf, archivo) {
  const corto = textoCorto(inf);
  if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
    try { await navigator.share({ files: [archivo], text: corto }); return 'compartido'; }
    catch (e) {
      if (e && e.name === 'AbortError') return 'cancelado';
      if (e && e.name === 'NotAllowedError') return 'otra';
      throw e;
    }
  }
  bajar(archivo); abrirWsp(corto);
  return 'descargado';
}
// "Enviar como mensaje": el texto completo (WhatsApp no deja adjuntar archivos con un enlace)
export async function enviarMensaje(inf) {
  const t = texto(inf);
  if (navigator.share && esTactil()) {
    try { await navigator.share({ text: t }); return 'compartido'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelado'; }
  }
  abrirWsp(t);
  return 'whatsapp';
}
export async function copiar(t) {
  try { await navigator.clipboard.writeText(t); return true; }
  catch (e) {
    const a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;top:0;left:-9999px';
    document.body.appendChild(a); a.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
    a.remove(); return ok;
  }
}
