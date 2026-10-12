// ═══════════════════════════════════════════════
//  fën · Cocina — Bollería: stock inicial, sobre stock y masas que ya hay en el congelador (sin pantalla)  v0.14.0
//
//  Semana de una meta (lunes W): la meta es lo que sale en la semana. Se parte con un STOCK INICIAL de
//  productos formados y congelados, y se quiere DEJAR un sobre stock para la semana siguiente:
//
//    a formar = meta − stock inicial + dejar para la próxima semana        (por producto, nunca menos de 0)
//
//  · Stock inicial: desde el domingo antes de W, el real (productos congelados al cierre de ese domingo,
//    Bitácora). Antes, el previsto: lo que planearon dejar la semana anterior.
//  · Dejar: se planifica en Metas (metas/BOL_{W}.dejar = { producto: piezas }). Si no lo cambian, vale lo
//    de la semana anterior.
//
//  Las masas de la meta L se elaboran la semana anterior (E = L − 7). Al empezar E, el congelador tiene
//  masas para lo que falta formar en E. Las que sobren se descuentan de lo que hay que elaborar para L:
//
//    sobran = masas congeladas al cierre de "hasta"   (inventario + elaboré − descongelé − merma congelada)
//           − elaboradas desde el lunes de E          (esas ya son para L)
//           − lo que falta descongelar para E        = masas para todo lo que hay que formar en E (con la merma
//                                                       de laminado, en masas enteras) − masas descongeladas para E
//
//  Se descongela la víspera: lo descongelado del domingo antes de E al sábado de E es para E. Por eso
//  "hasta" = hoy, o el sábado de E si ya pasó (entonces no falta nada). Sin inventario no se descuenta nada.
//  v0.13.1: se calcula desde el domingo antes de E (ese día se hace el inventario y se descongela).
//
//  Empastes (v0.13.0): no se descongelan; viven en el refri y se gastan AL LAMINAR, que se anota con lo
//  formado ("Formé": empastes = piezas × masas por pieza, de los productos que llevan empaste).
//  Empastes (v0.14.0, corrección de Emmanuel): se hacen la MISMA semana en que se laminan, según lo que hay que
//  formar esa semana (las masas base se siguen elaborando la semana anterior). Por eso:
//    · "Elaboré masas" nuevas llevan conEmpaste: false → no suman empastes (las antiguas sin marca sí: historia).
//    · Anotación nueva "Hice empastes": { tipo: 'empaste', masa (id de la masa base), n } → +n empastes en el refri
//      (aquí, en stock) y descuenta la bodega con la receta del empaste (consumo.js).
//    · Semana de los empastes (semanaEmpastes): lunes a sábado; el domingo ya cuenta para la semana siguiente
//      (como metaProx y el descongelado de la víspera), porque ese día se prepara el lunes.
//    · empastesSemana: por masa, necesarios (lo que hay que formar en la semana, planSemana → empastesDe),
//      usados al laminar (Formé desde el lunes), en el refri, hechos (desde el domingo antes) y
//      faltan = máx(0, necesarios − usados − en el refri).
// ═══════════════════════════════════════════════
import * as M from './modelo.js?v=0.11.0';
import * as B from './bolleria.js?v=0.11.0';

const sumar = (o, k, n) => { if (k) o[k] = (o[k] || 0) + M.num(n); };
const r2 = n => Math.round(M.num(n) * 100) / 100;

// Stock congelado (B.stock) + los empastes hechos ("Hice empastes") − los que se gastaron al laminar lo formado,
// después del último inventario
export function stock(diasDocs, hasta) {
  const s = B.stock(diasDocs, hasta), lista = B.anotaciones(diasDocs, hasta);
  let ini = -1; lista.forEach((a, i) => { if (a.tipo === 'inventario') ini = i; });
  lista.slice(ini + 1).forEach(a => {
    if (a.tipo === 'formo' && a.masa && M.num(a.empastes)) s.empastes[a.masa] = r2((s.empastes[a.masa] || 0) - M.num(a.empastes));
    if (a.tipo === 'empaste' && a.masa && M.num(a.n) > 0) s.empastes[a.masa] = r2((s.empastes[a.masa] || 0) + M.num(a.n));
  });
  return s;
}

// Semana de los empastes de un día (lunes): la de ese día; el domingo, la siguiente
export const semanaEmpastes = f => M.indiceDia(f) === 6 ? M.sumarDias(f, 1) : M.lunesDe(f);

// Empastes de la semana W (lunes), al cierre de "hasta" (por defecto hoy):
// { masaId: { necesarios, usados, refri, hechos, faltan, porDia: { fecha: n } } }  (solo masas con empaste)
// plan: planSemana(W) (o null: sin plan, necesarios = 0)
export function empastesSemana(diasDocs, W, plan, ctx, hasta = M.hoyTxt()) {
  const r = {}, x = id => r[id] || (r[id] = { necesarios: 0, usados: 0, refri: 0, hechos: 0, faltan: 0, porDia: {} });
  const conEmp = B.productos(ctx.recetas, ctx).filter(p => p.empasteG > 0);
  new Set(conEmp.map(p => p.masa.id)).forEach(id => x(id));
  const nec = {};
  Object.entries(plan ? aFormar(plan) : {}).forEach(([pid, n]) => { const e = empastesDe(pid, n, ctx); if (e) nec[e.masa] = (nec[e.masa] || 0) + e.empastes; });
  Object.entries(nec).forEach(([id, n]) => { x(id).necesarios = Math.ceil(n - 1e-9); });
  const domAntes = M.sumarDias(W, -1), fin = M.sumarDias(W, 5);
  B.anotaciones(diasDocs, hasta).forEach(a => {
    if (a.tipo === 'formo' && a.masa && a.fecha >= W && a.fecha <= M.sumarDias(W, 6) && M.num(a.empastes)) x(a.masa).usados = r2(x(a.masa).usados + M.num(a.empastes));
    if (a.tipo === 'empaste' && a.masa && a.fecha >= domAntes && a.fecha <= fin && M.num(a.n) > 0) {
      const y = x(a.masa); y.hechos += M.num(a.n); y.porDia[a.fecha] = (y.porDia[a.fecha] || 0) + M.num(a.n);
    }
  });
  const st = stock(diasDocs, hasta);
  Object.entries(r).forEach(([id, y]) => {
    y.refri = r2(st.empastes[id] || 0);
    y.faltan = Math.max(0, Math.ceil(y.necesarios - y.usados - Math.max(0, y.refri) - 1e-9));
  });
  return r;
}

// Empastes que gasta lo formado (al laminar): { masa, empastes } o null si el producto no lleva empaste
export function empastesDe(productoId, piezas, ctx) {
  const p = B.productos(ctx.recetas, ctx).find(x => x.receta.id === productoId);
  return p && p.empasteG > 0 ? { masa: p.masa.id, empastes: r2(M.num(piezas) * p.masas) } : null;
}

// Rendimiento real de una semana: masas descongeladas (domingo antes al sábado) vs piezas formadas (lunes a domingo)
export function rendimiento(diasDocs, lunes, ctx) {
  const prods = B.productos(ctx.recetas, ctx), r = {}, x = id => r[id] || (r[id] = { masas: 0, esperadas: 0 });
  B.anotaciones(diasDocs, M.sumarDias(lunes, 6)).forEach(a => {
    if (a.tipo === 'descongelo' && a.fecha >= M.sumarDias(lunes, -1) && a.fecha <= M.sumarDias(lunes, 5)) x(a.masa).masas += M.num(a.n);
    if (a.tipo === 'formo' && a.fecha >= lunes) { const p = prods.find(y => y.receta.id === a.producto); if (p) x(p.masa.id).esperadas += M.num(a.n) * p.masas; }
  });
  return r;
}

// Lo que quieren dejar para la semana siguiente: lo de esta meta o, si no lo pusieron, lo de la anterior
// (y así hacia atrás con las metas que se pasen, de la más nueva a la más vieja)
export function dejarDe(metas, ...anteriores) {
  const d = {}, propio = (metas && metas.dejar) || {};
  [...anteriores].reverse().forEach(x => Object.entries((x && x.dejar) || {}).forEach(([id, n]) => { d[id] = M.num(n); }));
  Object.entries(propio).forEach(([id, n]) => { d[id] = M.num(n); });
  return { dejar: d, propio };
}

// Plan de la semana de una meta, por producto: { id: { meta, inicial, fuente: 'real'|'previsto', dejar, heredado, aFormar } }
// docs: { metas (W), metasAnt (W−7), metasAnt2 (W−14), metasAnt3 (W−21) }
export function planSemana(lunes, docs, diasDocs, hoy = M.hoyTxt()) {
  const dom = M.sumarDias(lunes, -1);
  const { dejar, propio } = dejarDe(docs.metas, docs.metasAnt, docs.metasAnt2);
  const previsto = dejarDe(docs.metasAnt, docs.metasAnt2, docs.metasAnt3).dejar;
  const st = hoy >= dom ? stock(diasDocs, dom) : null, real = !!(st && st.conInventario);
  const metas = (docs.metas && docs.metas.productos) || {};
  const ids = new Set([...Object.keys(metas), ...Object.keys(dejar), ...(real ? Object.keys(st.productos) : Object.keys(previsto))]);
  const plan = {};
  ids.forEach(id => {
    const meta = M.num(metas[id]), inicial = Math.max(0, real ? M.num(st.productos[id]) : M.num(previsto[id])), dj = M.num(dejar[id]);
    plan[id] = { meta, inicial, fuente: real ? 'real' : 'previsto', dejar: dj, heredado: !(id in propio) && dj > 0, aFormar: Math.max(0, meta - inicial + dj) };
  });
  return plan;
}
export const aFormar = plan => Object.fromEntries(Object.entries(plan).map(([id, p]) => [id, p.aFormar]));

// Masas que sobran en el congelador para la meta L.
// o = { planE: planSemana de E (la semana en curso de elaboración), ctx, cfg }
// → { estado: 'ok'|'futuro'|'sinInventario', hasta, porMasa: { masaId: { sobran, congeladas, elaboradas, faltaDescongelar } } }
export function sobrantes(diasDocs, lunesMeta, o, hoy = M.hoyTxt()) {
  const el = M.sumarDias(lunesMeta, -7), sabEl = M.sumarDias(el, 5), domAntes = M.sumarDias(el, -1);
  // Desde el domingo antes de E ya se puede calcular (inventario y descongelado del domingo)
  if (hoy < domAntes) return { estado: 'futuro', desde: el, porMasa: {} };
  const hasta = hoy < sabEl ? hoy : sabEl, cerrada = hoy > sabEl;
  const st = stock(diasDocs, hasta);
  // Sin inventario no se descuenta. Si la semana de elaboración ya pasó, no hay nada que avisar ('pasado').
  if (!st.conInventario) return { estado: cerrada ? 'pasado' : 'sinInventario', hasta, porMasa: {} };
  const elab = {}, desc = {};
  B.anotaciones(diasDocs, hasta).forEach(a => {
    if (a.tipo === 'elaboro' && a.fecha >= el) sumar(elab, a.masa, a.n);
    if (a.tipo === 'descongelo' && a.fecha >= domAntes) sumar(desc, a.masa, a.n);
  });
  // Masas para todo lo que hay que formar en E (en masas enteras, con la merma de laminado, como el PEM):
  // lo descongelado para E (del domingo antes en adelante) ya está fuera del congelador; falta el resto
  const masasE = {}; B.necesidades(aFormar(o.planE || {}), o.ctx, o.cfg).masas.forEach(x => { masasE[x.masa.id] = x.masas; });
  const porMasa = {};
  Object.keys(st.masas).forEach(id => {
    const congeladas = Math.max(0, M.num(st.masas[id])), elaboradas = elab[id] || 0;
    const faltaDescongelar = cerrada ? 0 : Math.max(0, (masasE[id] || 0) - (desc[id] || 0));
    const sobran = Math.max(0, Math.floor(congeladas - elaboradas - faltaDescongelar + 1e-9));
    porMasa[id] = { sobran, congeladas, elaboradas, faltaDescongelar };
  });
  return { estado: 'ok', hasta, porMasa };
}

// Las necesidades de lo que hay que formar (B.necesidades) con lo congelado descontado: cada masa queda con
// meta (lo que pide lo que hay que formar), congeladas (lo que se descuenta) y masas (lo que hay que elaborar)
export function descontar(nec, sob) {
  const pm = (sob && sob.porMasa) || {};
  return {
    ...nec,
    masas: nec.masas.map(x => {
      const usa = Math.min(x.masas, (pm[x.masa.id] || {}).sobran || 0), masas = x.masas - usa;
      return { ...x, meta: x.masas, congeladas: usa, masas, kg: masas * B.pesoMasa(x.masa) / 1000, empastes: x.empastes ? masas : 0 };
    })
  };
}
