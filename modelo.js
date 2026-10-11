// ═══════════════════════════════════════════════
//  fën · Cocina — cálculos (sin pantalla)  v0.1.0
//  Semanas por fechas, escalado de recetas, ajuste de harina/agua del día,
//  tandas, elaboraciones previas (sub recetas), insumos y pie de masa madre.
//  Todo es función pura: recibe los datos y devuelve el resultado.
//
//  Datos (como quedan en la base fen-produccion):
//   receta: { id, area, nombre, estado, tipo: 'receta'|'sub_receta', porciones, unidad: 'un'|'g',
//             harinaTotal, ingredientes: [{ id, nombre, gramos, unidades|null, pct|null }],
//             pasos: [texto], procedimiento, mpId (si es sub receta: su ID en materias primas) }
//   mp:     { id, nombre, tipo, areas: [] }
//   plan:   { area, lunes: 'AAAA-MM-DD', filas: { recetaId: { d0..d6: unidades } } }
//   ajuste: { harina (g, base 100 %), pct: { ingId: % } }   (por receta y día)
// ═══════════════════════════════════════════════

export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// ── Fechas (siempre texto AAAA-MM-DD, al mediodía para no correrse por el horario de verano) ──
const aFecha = t => new Date(t + 'T12:00:00');
export const texto = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const hoyTxt = (ahora = new Date()) => texto(ahora);
export function sumarDias(t, n) { const d = aFecha(t); d.setDate(d.getDate() + n); return texto(d); }
export const indiceDia = t => (aFecha(t).getDay() + 6) % 7;          // 0 = lunes
export const lunesDe = t => sumarDias(t, -indiceDia(t));
export function etiquetaSemana(lunes) {
  const a = aFecha(lunes), b = aFecha(sumarDias(lunes, 6));
  return a.getMonth() === b.getMonth()
    ? `lun ${a.getDate()} al dom ${b.getDate()} ${MESES[b.getMonth()]}`
    : `lun ${a.getDate()} ${MESES[a.getMonth()]} al dom ${b.getDate()} ${MESES[b.getMonth()]}`;
}
export function fechaLarga(t) { const d = aFecha(t); return `${DIAS[indiceDia(t)]} ${d.getDate()} de ${MESES_LARGOS[d.getMonth()]}`; }
export function fechaCorta(t) { const d = aFecha(t); return `${DIAS_CORTOS[indiceDia(t)]} ${d.getDate()}`; }
// Semana ISO de la planilla ("2026-W42") → su lunes
export function lunesDeSemanaIso(id) {
  const m = /^(\d{4})-W(\d{1,2})$/.exec(String(id || '').trim());
  if (!m) return '';
  const ene4 = new Date(Number(m[1]), 0, 4, 12);
  const lunes1 = new Date(ene4); lunes1.setDate(ene4.getDate() - ((ene4.getDay() + 6) % 7));
  lunes1.setDate(lunes1.getDate() + (Number(m[2]) - 1) * 7);
  return texto(lunes1);
}

// ── Números ──
export const num = v => { if (typeof v === 'number') return isFinite(v) ? v : 0; const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; };
export function gramos(g) {
  const v = Math.round(num(g));
  if (Math.abs(v) >= 1000) return (v / 1000).toLocaleString('es-CL', { maximumFractionDigits: 2 }) + ' kg';
  return v.toLocaleString('es-CL') + ' g';
}
export const miles = n => Math.round(num(n)).toLocaleString('es-CL');
export const unidades = n => { const v = Math.round(num(n) * 10) / 10; return v.toLocaleString('es-CL'); };
// Harina en sacos de 25 kg: "2 sacos + 8,4 kg"
export function enSacos(g, kgSaco = 25) {
  const kg = num(g) / 1000, sacos = Math.floor(kg / kgSaco), resto = Math.round((kg - sacos * kgSaco) * 10) / 10;
  if (!sacos) return resto.toLocaleString('es-CL') + ' kg';
  return `${sacos} ${sacos === 1 ? 'saco' : 'sacos'}${resto ? ' + ' + resto.toLocaleString('es-CL') + ' kg' : ''}`;
}

// ── Recetas ──
export const porciones = r => num(r && r.porciones) > 0 ? num(r.porciones) : 1;   // con decimales (antes se cortaba 1,5 → 1)
export const pesoBase = ings => (ings || []).reduce((s, i) => s + num(i.gramos), 0);
// La receta detrás de un ingrediente que es sub receta (por su ID en materias primas, o por nombre)
export function recetaDeSub(ingId, nombre, ctx) {
  const rs = ctx.recetas || [];
  return rs.find(r => r.mpId && r.mpId === ingId) || rs.find(r => r.id === ingId)
    || rs.find(r => r.tipo === 'sub_receta' && norm(r.nombre) === norm(nombre)) || null;
}
export const esPieMM = n => /pie de mm|pie de masa madre/.test(norm(n));
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export function esSub(ing, ctx) {
  const mp = (ctx.mps || []).find(m => m.id === ing.id);
  if (mp) return mp.tipo === 'sub_receta' || /^SR/.test(mp.id);
  return /^SR/.test(String(ing.id || '')) || !!recetaDeSub(ing.id, null, { recetas: (ctx.recetas || []).filter(r => r.tipo === 'sub_receta') });
}

// Ajuste del día (harina base y % panadero). Devuelve los ingredientes del lote base ya ajustados.
// Solo cambian los ingredientes con % panadero; los demás quedan como en la receta.
export function ingredientesAjustados(r, ajuste) {
  const ings = (r && r.ingredientes) || [];
  if (!ajuste || (!ajuste.harina && !Object.keys(ajuste.pct || {}).length)) return ings.map(i => ({ ...i }));
  const harinaOrig = num(r.harinaTotal);
  const harina = num(ajuste.harina) > 0 ? num(ajuste.harina) : harinaOrig;
  const cambioHarina = harinaOrig > 0 && Math.abs(harina - harinaOrig) > 0.1;
  return ings.map(i => {
    const nuevo = ajuste.pct && ajuste.pct[i.id] !== undefined ? num(ajuste.pct[i.id]) : null;
    if (nuevo !== null && harina > 0) return { ...i, gramos: harina * nuevo / 100, pctEfectivo: nuevo, ajustado: true };
    if (cambioHarina && num(i.pct) > 0) return { ...i, gramos: harina * num(i.pct), pctEfectivo: num(i.pct) * 100, ajustado: true };
    return { ...i, pctEfectivo: num(i.pct) > 0 ? num(i.pct) * 100 : null };
  });
}
export const tieneAjuste = a => !!(a && (num(a.harina) > 0 || Object.keys(a.pct || {}).length));

// Una receta escalada a N unidades (con el ajuste del día si lo hay)
export function escalar(r, cantidad, ajuste, ctx = {}) {
  const f = num(cantidad) / porciones(r);
  const filas = ingredientesAjustados(r, ajuste).map(i => {
    const tieneUn = i.unidades !== undefined && i.unidades !== null && i.unidades !== '';
    return { id: i.id, nombre: i.nombre, gramos: num(i.gramos) * f, unidades: tieneUn ? num(i.unidades) * f : null,
      pct: i.pctEfectivo ?? (num(i.pct) > 0 ? num(i.pct) * 100 : null), ajustado: !!i.ajustado, esSub: ctx.mps ? esSub(i, ctx) : false };
  });
  return { filas, total: filas.reduce((s, x) => s + x.gramos, 0), factor: f };
}

// Tandas: lista de unidades que suma lo planificado. Si no hay, una sola.
export function tandasDe(guardadas, total) {
  const t = (guardadas || []).map(num).filter(x => x > 0);
  return t.length ? t : [num(total)];
}
export const sumaTandas = t => (t || []).reduce((s, x) => s + num(x), 0);
// Divide en n tandas parejas (enteras, la diferencia va a las primeras)
export function dividir(total, n) {
  const T = Math.round(num(total)), k = Math.max(1, Math.min(Math.round(n), T || 1));
  const base = Math.floor(T / k), resto = T - base * k;
  return Array.from({ length: k }, (_, i) => base + (i < resto ? 1 : 0));
}

// ── Lo planificado de un día ──
export function planDelDia(plan, fecha, recetas) {
  if (!plan || !plan.filas) return [];
  const d = 'd' + indiceDia(fecha);
  return Object.entries(plan.filas).map(([id, dias]) => ({ receta: (recetas || []).find(r => r.id === id), unidades: num((dias || {})[d]) }))
    .filter(x => x.receta && x.unidades > 0)
    .sort((a, b) => a.receta.nombre.localeCompare(b.receta.nombre, 'es'));
}

// ── Elaboraciones previas e insumos del día ──
// planDia: [{ receta, unidades }]; ajustes: { recetaId: ajuste }
// Recorre los ingredientes; cada sub receta (también las anidadas) suma sus gramos y quién la usa.
// Los insumos directos se suman solo en el primer nivel; los de las sub recetas salen de su desglose.
export function elaboracionesDia(planDia, ajustes, ctx) {
  const subs = {}, insumos = {};
  const bajar = (ings, f, origen, prof) => {
    ings.forEach(i => {
      const g = num(i.gramos) * f;
      if (esPieMM(i.nombre)) return;                 // el pie sale de la masa madre anterior (bloque aparte)
      if (esSub(i, ctx)) {
        const s = subs[i.id] || (subs[i.id] = { id: i.id, nombre: i.nombre, gramos: 0, usan: [] });
        s.gramos += g; s.usan.push({ nombre: origen, gramos: g });
        const rs = recetaDeSub(i.id, i.nombre, ctx);
        const pb = rs ? pesoBase(rs.ingredientes) : 0;
        if (rs && pb > 0 && prof < 6) bajar(rs.ingredientes, g / pb, origen, prof + 1);
      } else if (prof === 0) {
        insumos[i.nombre] = (insumos[i.nombre] || 0) + g;
      }
    });
  };
  planDia.forEach(({ receta, unidades }) => bajar(ingredientesAjustados(receta, (ajustes || {})[receta.id]), num(unidades) / porciones(receta), receta.nombre, 0));
  // Ingredientes de las sub recetas (masa madre, poolish…) a los insumos. Una sub receta dentro de otra no se
  // cuenta dos veces: el desglose de la de afuera la salta (es sub receta) y la de adentro suma lo suyo.
  // El pie no entra: sale de la masa madre anterior.
  Object.values(subs).forEach(s => {
    desglose(s.id, s.nombre, s.gramos, ctx).forEach(c => {
      if (c.esPie || c.esSub) return;
      insumos[c.nombre] = (insumos[c.nombre] || 0) + c.gramos;
    });
  });
  return { subRecetas: Object.values(subs).sort((a, b) => b.gramos - a.gramos), insumos };
}

// Componentes de una sub receta para T gramos: con su receta si la tiene; si no, con la configuración de Panadería
export function desglose(subId, nombre, total, ctx) {
  const rs = recetaDeSub(subId, nombre, ctx);
  const ings = rs ? rs.ingredientes || [] : [];
  const pb = pesoBase(ings);
  if (pb > 0) return ings.map(i => ({ id: i.id, nombre: i.nombre, gramos: num(i.gramos) * total / pb, esPie: esPieMM(i.nombre), esSub: esSub(i, ctx) }));
  const cfg = (ctx.config || {}), n = norm(nombre);
  if (/masa madre/.test(n)) {
    const c = /integral/.test(n) ? (cfg.mm_integral || { pie_pct: 20, agua_pct: 90 }) : (cfg.mm_blanca || { pie_pct: 20, agua_pct: 90 });
    const h = total / (1 + num(c.pie_pct) / 100 + num(c.agua_pct) / 100);
    return [{ nombre: 'Pie de masa madre', gramos: h * num(c.pie_pct) / 100, esPie: true }, { nombre: 'Harina', gramos: h }, { nombre: 'Agua', gramos: h * num(c.agua_pct) / 100 }];
  }
  if (/poolish/.test(n)) {
    const c = cfg.poolish || { agua_pct: 100, levadura_pct: 0.36 };
    const h = total / (1 + num(c.agua_pct) / 100 + num(c.levadura_pct) / 100);
    return [{ nombre: 'Harina T000', gramos: h }, { nombre: 'Agua', gramos: h * num(c.agua_pct) / 100 }, { nombre: 'Levadura seca', gramos: h * num(c.levadura_pct) / 100 }];
  }
  return [{ nombre: nombre || 'Total', gramos: total }];
}

// Harina del día (para mostrarla en sacos): todo insumo cuyo nombre empieza con "harina"
export const harinaDe = insumos => Object.entries(insumos || {}).filter(([n]) => /^harina/i.test(norm(n))).reduce((s, [, g]) => s + g, 0);

// ── Pie de masa madre ──
// Se hace los días configurados (0 = lunes; por defecto martes y viernes) al terminar la jornada y
// cubre desde mañana hasta el próximo día de elaboración (incluido), más una reserva del período
// siguiente. Usa las FECHAS reales: si cruza a la semana siguiente, toma el plan de esa semana
// (antes tomaba el lunes de la semana en curso).
// planes: { 'AAAA-MM-DD' (lunes): plan }; ajustesDe(fecha) → { recetaId: ajuste }
export function pieMasaMadre(fecha, planes, ajustesDe, ctx) {
  const pc = (ctx.config || {}).pie_mm || { dias_elaboracion: [1, 4], reserva_pct: 20, mm_madura_pct: 20, agua_pct: 90 };
  const diasElab = (pc.dias_elaboracion || [1, 4]).map(Number).sort((a, b) => a - b);
  if (!diasElab.length || !diasElab.includes(indiceDia(fecha))) return null;
  const siguienteElab = desde => { let t = sumarDias(desde, 1); for (let i = 0; i < 8 && !diasElab.includes(indiceDia(t)); i++) t = sumarDias(t, 1); return t; };
  const prox = siguienteElab(fecha), despues = siguienteElab(prox);
  const rango = (a, b) => { const r = []; for (let t = sumarDias(a, 1); t <= b; t = sumarDias(t, 1)) r.push(t); return r; };
  const cubiertos = rango(fecha, prox);                       // mañana … próximo día de elaboración
  const siguiente = rango(prox, sumarDias(despues, -1));       // después del próximo … antes del siguiente
  const mms = (ctx.mps || []).filter(m => (m.tipo === 'sub_receta' || /^SR/.test(m.id)) && /masa madre/.test(norm(m.nombre)));
  const ids = { blanca: mms.filter(m => !/integral/.test(norm(m.nombre))).map(m => m.id), integral: mms.filter(m => /integral/.test(norm(m.nombre))).map(m => m.id) };
  const idsPie = (ctx.mps || []).filter(m => /pie de mm|pie de masa madre/.test(norm(m.nombre))).map(m => m.id);
  const buscar = (ings, f, buscados, prof) => ings.reduce((s, i) => {
    if (buscados.includes(i.id)) return s + num(i.gramos) * f;
    if (prof > 6 || !esSub(i, ctx)) return s;
    const rs = recetaDeSub(i.id, i.nombre, ctx), pb = rs ? pesoBase(rs.ingredientes) : 0;
    return pb > 0 ? s + buscar(rs.ingredientes, num(i.gramos) * f / pb, buscados, prof + 1) : s;
  }, 0);
  const mmDelDia = (t, buscados) => {
    if (!buscados.length) return 0;
    const plan = planes[lunesDe(t)], aj = (ajustesDe && ajustesDe(t)) || {};
    return planDelDia(plan, t, ctx.recetas).reduce((s, { receta, unidades }) => s + buscar(ingredientesAjustados(receta, aj[receta.id]), unidades / porciones(receta), buscados, 0), 0);
  };
  // Con una sub receta "Pie de MM" dentro de la masa madre, cuenta solo esa parte; si no, toda la masa madre
  const proporcionPie = buscados => {
    if (!idsPie.length) return 1;
    const mp = (ctx.mps || []).find(m => buscados.includes(m.id)), rs = mp ? recetaDeSub(mp.id, mp.nombre, ctx) : null;
    const pb = rs ? pesoBase(rs.ingredientes) : 0;
    if (!pb) return num(pc.mm_madura_pct || 20) / (100 + num(pc.mm_madura_pct || 20) + num(pc.agua_pct || 90));
    return rs.ingredientes.filter(i => idsPie.includes(i.id) || /pie de mm/i.test(i.nombre)).reduce((s, i) => s + num(i.gramos), 0) / pb;
  };
  const tipo = clave => {
    const b = ids[clave], prop = proporcionPie(b);
    const cubre = cubiertos.reduce((s, t) => s + mmDelDia(t, b), 0) * prop;
    const reserva = siguiente.reduce((s, t) => s + mmDelDia(t, b), 0) * prop * num(pc.reserva_pct) / 100;
    const total = cubre + reserva;
    const h = total / (1 + num(pc.mm_madura_pct) / 100 + num(pc.agua_pct) / 100);
    return { total, cubre, reserva, desglose: total ? [{ nombre: 'Masa madre madura anterior', gramos: h * num(pc.mm_madura_pct) / 100, especial: true }, { nombre: 'Harina T000', gramos: h }, { nombre: 'Agua', gramos: h * num(pc.agua_pct) / 100 }] : [] };
  };
  const blanca = tipo('blanca'), integral = tipo('integral');
  if (!blanca.total && !integral.total) return null;
  return { cubiertos, siguiente, reservaPct: num(pc.reserva_pct), blanca, integral };
}
