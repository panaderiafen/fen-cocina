// ═══════════════════════════════════════════════
//  fën · Cocina — Cafetería: piezas sin pantalla de la Bitácora de turno y la Merma  v0.15.0
//  (solo Cocina; el cálculo del consumo está en consumo.js, que también usa Sistema Fën)
//  · Calibración diaria editada: dias/CAF_{fecha}.calibracionDiaria = { shots, gPorShot, por, en, historial }
//    (historial: lo que valía antes, hasta 10; la automática queda como { shots, auto: true }).
//  · Derramado: una merma de receta por preparación (motivo "derrame_error", derramado: true, origen 'turno',
//    grupo = la anotación), para que Sistema Fën la valorice como cualquier merma y la bodega la descuente entera.
//  · Merma de Cafetería en otro día: hoy o hasta 7 días atrás, nunca en el futuro.
// ═══════════════════════════════════════════════
import * as M from './modelo.js?v=0.11.0';
import * as R from './registros.js?v=0.11.0';

export const DIAS_ATRAS_MERMA = 7;
const esFecha = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

// '' si la fecha sirve; si no, el mensaje para la jefa
export function validarFechaMerma(fecha, hoy, atras = DIAS_ATRAS_MERMA) {
  if (!esFecha(fecha)) return 'Elige la fecha.';
  if (fecha > hoy) return 'La fecha no puede ser después de hoy.';
  const min = M.sumarDias(hoy, -atras);
  if (fecha < min) return `Solo hasta ${atras} días atrás (desde el ${M.fechaCorta(min)}).`;
  return '';
}

// Lo que se guarda al editar la calibración diaria. antes: lo editado antes (o null); auto: los shots automáticos
export function nuevaCalibracion(antes, auto, shots, gPorShot, por, en) {
  const previo = antes ? { shots: antes.shots, por: antes.por || '', en: antes.en || '' } : { shots: auto, auto: true, por: '', en: '' };
  return { shots: Math.max(0, Math.round(M.num(shots))), gPorShot: M.num(gPorShot), por, en, historial: [...((antes && antes.historial) || []), previo].slice(-10) };
}

// Derramado: [{ receta, cantidad }] → { id: merma } (una anotación por preparación)
export function entradasDerramado(elegidos, { barista, nota = '', por, en, grupo }) {
  const out = {};
  (elegidos || []).forEach((x, k) => {
    const r = x.receta, notaU = String(nota || '').trim().slice(0, 180);
    out[grupo + k] = {
      tipo: 'receta', item: r.id, nombre: r.nombre, sub: r.tipo === 'sub_receta', cantidad: M.num(x.cantidad), unidad: R.unidadDe('receta', r),
      motivo: 'derrame_error', derramado: true, origen: 'turno', grupo,
      nota: ['Derramado', notaU].filter(Boolean).join(' · '), notaTurno: notaU,
      barista: { email: (barista && barista.email) || '', nombre: (barista && barista.nombre) || '' }, por, en
    };
  });
  return out;
}
