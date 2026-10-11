// ═══════════════════════════════════════════════
//  fën · Cocina — Bollería: masas que ya hay en el congelador y se descuentan de la meta (sin pantalla)  v0.12.0
//
//  La meta de la semana L se elabora la semana anterior (E = L − 7). Al empezar E, el congelador tiene
//  masas para la meta de E (se descongelan durante E). Lo que quede después de esa meta sobra, y se
//  descuenta de lo que hay que elaborar para L:
//
//    sobran = congelado al cierre de "hasta"            (Bitácora: inventario + elaboré − descongelé − merma)
//           − elaboradas desde el lunes de E            (esas ya son para la meta L)
//           − lo que falta descongelar para la meta de E (necesarias de esa meta − descongeladas para ella)
//
//  Se descongela la víspera: lo de la meta de E se descongela del domingo antes de E al sábado de E
//  (el domingo de E ya es para la meta L). Por eso "hasta" = hoy, o el sábado de E si ya pasó (entonces
//  no falta nada por descongelar). El número no cambia en la semana mientras se anote lo que pasa:
//  elaborar suma al congelado y a "elaboradas"; descongelar resta al congelado y a "lo que falta".
//  Sin inventario del congelador no se descuenta nada. Antes de que empiece E, tampoco (se pide la meta completa).
// ═══════════════════════════════════════════════
import * as M from './modelo.js?v=0.11.0';
import * as B from './bolleria.js?v=0.11.0';

// diasDocs: días de Bollería { fecha: doc }; necActual: { masaId: masas necesarias para la meta de E }
// → { estado: 'ok'|'futuro'|'sinInventario', hasta, porMasa: { masaId: { sobran, congeladas, elaboradas, faltaDescongelar } } }
export function sobrantes(diasDocs, lunesMeta, necActual, hoy = M.hoyTxt()) {
  const el = M.sumarDias(lunesMeta, -7), sabEl = M.sumarDias(el, 5), domAntes = M.sumarDias(el, -1);
  if (hoy < el) return { estado: 'futuro', desde: el, porMasa: {} };
  const hasta = hoy < sabEl ? hoy : sabEl, cerrada = hoy > sabEl;
  const st = B.stock(diasDocs, hasta);
  if (!st.conInventario) return { estado: 'sinInventario', hasta, porMasa: {} };
  const elab = {}, desc = {};
  B.anotaciones(diasDocs, hasta).forEach(a => {
    if (a.tipo === 'elaboro' && a.fecha >= el) elab[a.masa] = (elab[a.masa] || 0) + M.num(a.n);
    if (a.tipo === 'descongelo' && a.fecha >= domAntes) desc[a.masa] = (desc[a.masa] || 0) + M.num(a.n);
  });
  const porMasa = {};
  Object.keys(st.masas).forEach(id => {
    const congeladas = Math.max(0, M.num(st.masas[id])), elaboradas = elab[id] || 0;
    const faltaDescongelar = cerrada ? 0 : Math.max(0, M.num((necActual || {})[id]) - (desc[id] || 0));
    const sobran = Math.max(0, Math.floor(congeladas - elaboradas - faltaDescongelar + 1e-9));
    porMasa[id] = { sobran, congeladas, elaboradas, faltaDescongelar };
  });
  return { estado: 'ok', hasta, porMasa };
}

// Las necesidades de la meta (B.necesidades) con lo congelado descontado: cada masa queda con
// meta (lo que pide la meta), congeladas (lo que se descuenta) y masas (lo que hay que elaborar)
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
