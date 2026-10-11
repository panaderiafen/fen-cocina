// ═══════════════════════════════════════════════
//  fën · Cocina — formulario de recetas y propuestas (P3)  v0.12.2
//  v0.5.0: Pastelería también crea y edita recetas aquí.
//  Las jefas de Panadería y Bollería crean y editan recetas aquí. Una receta vigente NUNCA
//  se cambia directo: cada cambio es una PROPUESTA (propuestas/{AREA}_{id}) que pasa por
//  borrador → en prueba → en revisión. La aprueba (o la devuelve con un comentario)
//  Administración en Sistema Fën, después de revisar costos; recién ahí reemplaza a la vigente.
//  Mientras tanto, la vigente sigue en la planificación (y el ajuste del día sigue valiendo).
//  · Sin costos: la jefa no ve precios.
//  · Lo que se escribe se guarda solo (cada ~1 s) y la dupla lo ve.
//  · Materia prima que falta: se pide desde aquí (solicitudes/{AREA}_{id}); la crea o habilita
//    Administración en Sistema Fën.
// ═══════════════════════════════════════════════
import * as M from './modelo.js?v=0.11.0';

let A = null;   // { E, db, doc, setDoc, esc, ic, avisar, quien, ahoraIso, serverTimestamp, $, pintar, guardarSinEsperar, ctx }
export function configurar(api) { A = api; }

export const AREAS_EDITAN = ['PAN', 'BOL', 'PAS', 'CAF'];   // v0.8.0: Cafetería también
export const ESTADOS_P = { borrador: 'Borrador', en_prueba: 'En prueba', en_revision: 'En revisión', aprobando: 'Aprobándose', devuelta: 'Devuelta', aprobada: 'Aprobada', anulada: 'Anulada' };
const ABIERTA = p => p && !['aprobada', 'anulada'].includes(p.estado);
const EDITABLE = p => p && ['borrador', 'en_prueba', 'devuelta'].includes(p.estado);
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const esHarina = n => /^harina/.test(norm(n));
const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const r1 = n => Math.round(M.num(n) * 10) / 10;
// Para comparar datos: Firebase no devuelve los campos en el orden en que se escribieron
const estable = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(c => [c, x[c]])) : x);

// ── Datos de una receta (lo que guarda la propuesta) ──
export function datosDe(r) {
  return {
    nombre: r.nombre || '', tipo: r.tipo || 'receta', porciones: M.num(r.porciones) || 1, unidad: r.unidad === 'g' ? 'g' : 'un',
    harinaTotal: M.num(r.harinaTotal) || 0,
    ingredientes: (r.ingredientes || []).map(i => ({ id: i.id || '', nombre: i.nombre || '', gramos: r1(i.gramos), unidades: i.unidades === null || i.unidades === undefined || i.unidades === '' ? null : M.num(i.unidades), pct: i.pct === null || i.pct === undefined ? null : M.num(i.pct) })),
    insumos: (r.insumos || []).map(i => ({ id: i.id || '', nombre: i.nombre || '', cantidad: M.num(i.cantidad ?? i.unidades ?? i.gramos) })),
    pasos: (r.pasos || []).filter(Boolean),
    notas: r.notas || '', clasificacion: r.clasificacion || '', pesoUnidad: M.num(r.pesoUnidad) || 0,
    planificable: r.planificable !== false, seCongela: !!r.seCongela, unidadesPorCaja: M.num(r.unidadesPorCaja) || 0
  };
}
// El ajuste de harina/agua llevado a la receta: los gramos del lote con la harina y los % del ajuste
export function desdeAjuste(r, harina, pcts) {
  const d = datosDe(r), aj = { harina, pct: pcts };
  const ings = M.ingredientesAjustados(r, aj), P = M.panadero(r);
  const orig = r.ingredientes || [];
  d.ingredientes = ings.map((i, k) => {
    const o = orig[k] || {}, u = i.unidades === null || i.unidades === undefined || i.unidades === '' ? null : M.num(i.unidades);
    // Una sub receta en unidades sube o baja en la misma proporción que sus gramos
    const unidades = u !== null && M.num(o.gramos) > 0 ? Math.round(u * M.num(i.gramos) / M.num(o.gramos) * 10000) / 10000 : u;
    return { id: i.id || '', nombre: i.nombre || '', gramos: r1(i.gramos), unidades, pct: i.pctEfectivo ? Math.round(i.pctEfectivo * 100) / 10000 : (i.pct ?? null) };
  });
  d.harinaTotal = M.num(harina) > 0 ? M.num(harina) : P.harina;
  return d;
}

// ── Guardar ──
const ref = pid => A.doc(A.db, 'propuestas', `${A.E.area}_${pid}`);
export function propuestaAbierta(recetaId) {
  return Object.values(A.E.propuestas || {}).find(p => p.recetaId === recetaId && ABIERTA(p)) || null;
}
// Crea una propuesta y abre el formulario (o la deja en revisión, si viene del ajuste)
export function crear(datos, { recetaId = null, origen = 'nueva', estado = 'borrador', comentario = '', abrir = true } = {}) {
  const E = A.E, pid = nuevoId(), r = recetaId ? E.recetas.find(x => x.id === recetaId) : null;
  const p = { area: E.area, pid, recetaId, versionBase: r ? (M.num(r.version) || 1) : 0, origen, estado, datos,
    historial: [{ estado, por: A.quien(), en: A.ahoraIso(), comentario }], creadaPor: A.quien(), actualizado: { por: A.quien(), en: A.serverTimestamp() } };
  E.propuestas[pid] = { ...p, id: pid };
  A.guardarSinEsperar(A.setDoc(ref(pid), p), estado === 'en_revision' ? 'Enviada a revisión.' : '');
  if (abrir) abrirEditor(pid);
  return pid;
}
// Llegó un cambio de la base (la dupla en otra tablet): si aquí no hay nada por guardar, se toma el de la base
export function alCambiarPropuestas() {
  const E = A.E, ed = E.editor; if (!ed) return;
  const p = E.propuestas[ed.pid]; if (!p) return;
  // Solo si de verdad cambió algo en otra tablet (lo de aquí, sin filas vacías, es distinto de lo que llegó)
  const k = estable(p.datos || {});
  if (ed.estado === 'guardado' && k !== ed.base && k !== estable(limpio(ed.datos))) { ed.datos = JSON.parse(JSON.stringify(p.datos || {})); ed.base = k; }
}
export function anular(pid, comentario) { cambiarEstado(pid, 'anulada', comentario); }
export function abrirEditor(pid) {
  const p = A.E.propuestas[pid]; if (!p) return;
  A.E.editor = { pid, datos: JSON.parse(JSON.stringify(p.datos || {})), base: estable(p.datos || {}), t: 0, estado: 'guardado' };
  A.E.recetaVista = null;
  if (location.hash !== '#recetas') location.hash = '#recetas';
  A.pintar();
}
export function cerrarEditor() { guardarYa(); A.E.editor = null; A.pintar(); }
function limpio(d) {
  const P = A.E.area === 'PAN';
  const ings = (d.ingredientes || []).filter(i => i.id || i.nombre);
  const harina = harinaBase(d);
  return {
    ...d, nombre: String(d.nombre || '').trim().slice(0, 80), porciones: M.num(d.porciones) || 0,
    harinaTotal: P ? r1(harina) : M.num(d.harinaTotal) || 0,
    ingredientes: ings.map(i => ({ id: i.id || '', nombre: i.nombre || '', gramos: r1(i.gramos), unidades: i.unidades === null || i.unidades === '' || i.unidades === undefined ? null : M.num(i.unidades), pct: P && harina > 0 ? Math.round(M.num(i.gramos) / harina * 10000) / 10000 : null })),
    insumos: (d.insumos || []).filter(i => i.id || i.nombre).map(i => ({ id: i.id || '', nombre: i.nombre || '', cantidad: M.num(i.cantidad) })),
    pasos: (d.pasos || []).map(x => String(x || '').trim()).filter(Boolean)
  };
}
// Harina base (100 %): la de la receta; si cambian los gramos de las harinas, la suma de ellas
const sumaHarinas = d => (d.ingredientes || []).filter(i => esHarina(i.nombre)).reduce((s, i) => s + M.num(i.gramos), 0);
const harinaBase = d => M.num(d.harinaTotal) > 0 ? M.num(d.harinaTotal) : sumaHarinas(d);
function programar() {
  const ed = A.E.editor; if (!ed) return;
  ed.estado = 'pendiente'; marcarEstado();
  clearTimeout(ed.t); ed.t = setTimeout(guardarYa, 900);
}
function guardarYa() {
  const ed = A.E.editor; if (!ed || ed.estado !== 'pendiente') return;
  clearTimeout(ed.t);
  const p = A.E.propuestas[ed.pid]; if (!EDITABLE(p)) return;
  const datos = limpio(ed.datos);
  ed.base = estable(datos);
  ed.estado = 'guardando'; marcarEstado();
  A.setDoc(ref(ed.pid), { area: A.E.area, pid: ed.pid, datos, actualizado: { por: A.quien(), en: A.serverTimestamp() } }, { merge: true })
    .then(() => { if (A.E.editor && A.E.editor.pid === ed.pid && ed.estado === 'guardando') { ed.estado = 'guardado'; marcarEstado(); } })
    .catch(e => { ed.estado = 'error'; marcarEstado(); A.avisar('No se guardó: ' + (e.message || e), true); });
}
function marcarEstado() {
  const el = A.$('ed-guardado'); if (!el || !A.E.editor) return;
  const s = A.E.editor.estado;
  el.textContent = s === 'guardado' ? 'Guardado' : s === 'guardando' || s === 'pendiente' ? 'Guardando…' : 'No se pudo guardar';
  el.classList.toggle('mal', s === 'error');
}
function cambiarEstado(pid, nuevo, comentario = '') {
  const p = A.E.propuestas[pid]; if (!p) return;
  const ed = A.E.editor && A.E.editor.pid === pid ? A.E.editor : null;
  // Solo se mandan los datos editados si la propuesta se podía editar (en revisión no cambian: reglas)
  const datos = ed && EDITABLE(p) ? limpio(ed.datos) : p.datos;
  if (ed) { clearTimeout(ed.t); ed.estado = 'guardado'; }
  const historial = [...(p.historial || []), { estado: nuevo, por: A.quien(), en: A.ahoraIso(), comentario }].slice(-40);
  A.E.propuestas[pid] = { ...p, estado: nuevo, datos, historial };
  A.guardarSinEsperar(A.setDoc(ref(pid), { area: A.E.area, pid, estado: nuevo, datos, historial, actualizado: { por: A.quien(), en: A.serverTimestamp() } }, { merge: true }),
    { en_prueba: 'Marcada en prueba.', en_revision: 'Enviada a revisión: Administración la revisa en Sistema Fën.', borrador: 'Volvió a borrador.', anulada: 'Propuesta anulada.' }[nuevo] || '');
  A.pintar();
}

// ── Lo que se puede elegir como ingrediente o insumo (habilitado para el área) ──
// Habilitada para el área: como en la app actual, "áreas habilitadas" vacío = sirve para todas
export const habilitada = (m, area) => !(m.areas || []).length || (m.areas || []).map(a => String(a).trim().toUpperCase()).includes(area);
function opciones(insumo) {
  const E = A.E;
  return (E.mps || []).filter(m => (m.estado || 'activa') === 'activa' && habilitada(m, E.area) && (insumo ? m.tipo === 'insumo' : m.tipo !== 'insumo'))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
// Sugerencias mientras se escribe (por parte del nombre, sin importar tildes)
function sugerencias(texto, insumo) {
  const q = norm(texto); if (!q) return [];
  const todas = opciones(insumo), empieza = todas.filter(m => norm(m.nombre).startsWith(q));
  return [...empieza, ...todas.filter(m => !empieza.includes(m) && norm(m.nombre).includes(q))].slice(0, 8);
}
function pintarSugerencias(t, insumo) {
  const caja = A.$(t.id + '-sug'); if (!caja) return;
  const i = Number(insumo ? t.dataset.ins : t.dataset.ing), d = A.E.editor.datos, fila = (insumo ? d.insumos : d.ingredientes)[i];
  const l = fila && fila.id && norm(fila.nombre) === norm(t.value) ? [] : sugerencias(t.value, insumo);
  caja.innerHTML = l.map(m => `<button type="button" class="sug" data-elegir="${insumo ? 'ins' : 'ing'}" data-fila="${i}" data-mp="${A.esc(m.id)}">${A.esc(m.nombre)}${m.tipo === 'sub_receta' || /^SR/.test(m.id) ? ' <small>sub receta</small>' : ''}</button>`).join('')
    || (t.value.trim() && !(fila && fila.id) ? '<span class="ayuda">No hay ninguna con ese nombre para esta área: pídela con "Falta una materia prima".</span>' : '');
}
const buscarOpcion = (nombre, insumo) => { const n = norm(nombre); return n ? opciones(insumo).find(m => norm(m.nombre) === n) || null : null; };
// Una sub receta que rinde unidades se puede poner en unidades (1 masa, 0,1 masa…)
function subEnUnidades(id) {
  const E = A.E, m = (E.mps || []).find(x => x.id === id);
  if (!m || !(m.tipo === 'sub_receta' || /^SR/.test(m.id))) return null;
  const r = M.recetaDeSub(id, m.nombre, A.ctx());
  if (!r || r.unidad === 'g') return null;
  const peso = M.num(r.pesoUnidad) > 1 ? M.num(r.pesoUnidad) : M.pesoBase(r.ingredientes) / M.porciones(r);
  return peso > 0 ? { receta: r, peso } : null;
}

// ── Pantalla: lista de propuestas y pedidos (arriba de Recetas) ──
export function vistaPropuestas() {
  const E = A.E, esc = A.esc;
  if (!AREAS_EDITAN.includes(E.area)) return '';
  const abiertas = Object.values(E.propuestas || {}).filter(ABIERTA).sort((a, b) => String(b.pid).localeCompare(String(a.pid)));
  const pedidos = Object.values(E.solicitudes || {}).filter(s => s.estado === 'pendiente' || (s.resueltaEn && Date.now() - new Date(s.resueltaEn).getTime() < 7 * 864e5))
    .sort((a, b) => String(b.en || '').localeCompare(String(a.en || '')));
  const nombreP = p => (p.datos && p.datos.nombre) || 'Receta nueva sin nombre';
  return `<div class="botones" style="justify-content:flex-start;margin-bottom:12px"><button type="button" class="btn" data-ed-nueva="1">${A.ic('libro')}Nueva receta</button></div>
    ${abiertas.length ? `<h2 class="titulo">Propuestas · ${abiertas.length}</h2><div class="lista-recetas">${abiertas.map(p => `<button type="button" class="item-receta" data-ed-abrir="${esc(p.pid)}">
        <b>${esc(nombreP(p))}</b>
        <small>${p.recetaId ? 'Cambio a una receta vigente' : 'Receta nueva'}${p.origen === 'ajuste' ? ' · desde el ajuste de harina/agua' : ''} · ${esc((p.historial || []).slice(-1)[0]?.por || p.creadaPor || '')}</small>
        <span class="estado est-${esc(p.estado)}">${esc(ESTADOS_P[p.estado] || p.estado)}</span>
      </button>`).join('')}</div>` : ''}
    ${pedidos.length ? `<h2 class="titulo">Materias primas pedidas</h2><div class="lista-bit">${pedidos.map(s => `<div class="anot"><div><b>${esc(s.tipo === 'habilitar' ? 'Habilitar ' : 'Nueva: ')}${esc(s.nombre)}</b><span class="ayuda">${esc(s.por || '')}${s.receta ? ' · para ' + esc(s.receta) : ''}</span></div><span class="estado">${s.estado === 'pendiente' ? 'Pedida' : s.estado === 'resuelta' ? 'Lista' : 'No se creó'}</span></div>`).join('')}</div>` : ''}`;
}

// ── Pantalla: el formulario ──
export function vistaEditor() {
  const E = A.E, esc = A.esc, ic = A.ic, ed = E.editor, p = E.propuestas[ed.pid];
  if (!p) return '<div class="vacio">Cargando la propuesta…</div>';
  const d = ed.datos, puede = EDITABLE(p), dis = puede ? '' : 'disabled', pan = E.area === 'PAN', bol = E.area === 'BOL';
  const vigente = p.recetaId ? E.recetas.find(r => r.id === p.recetaId) : null;
  const ult = (p.historial || []).slice(-1)[0] || {};
  const devuelta = [...(p.historial || [])].reverse().find(h => h.estado === 'devuelta');
  const ings = d.ingredientes || (d.ingredientes = []), ins = d.insumos || (d.insumos = []), pasos = d.pasos || (d.pasos = []);
  // Fila de ingrediente: el nombre arriba (con la × al lado) y debajo, en casillas iguales, Unidades · Gramos · %.
  // En pantallas anchas va todo en una línea. Las casillas siempre están (vacías si no aplican) para que las filas calcen.
  const filaIng = (i, k) => {
    const su = subEnUnidades(i.id), harina = esHarina(i.nombre), noExiste = i.nombre && !i.id;
    return `<div class="ing-fila" data-fila="${k}">
      <div class="c-nombre"><label for="ed-ing-${k}-n" class="sr">Ingrediente ${k + 1}</label><input id="ed-ing-${k}-n" data-ing="${k}" data-k="nombre" value="${esc(i.nombre)}" placeholder="Escribe para buscar…" autocomplete="off" ${dis}><div class="sugs" id="ed-ing-${k}-n-sug"></div>
        ${noExiste ? `<small class="error">No está habilitada para ${esc(A.AREAS[E.area].nombre)}: pídela con "Falta una materia prima".</small>` : ''}</div>
      <div class="c-nums ${pan ? 'tres' : 'dos'}">
        <div class="c-num"><label for="ed-ing-${k}-u">Unidades</label>${su ? `<input id="ed-ing-${k}-u" data-ing="${k}" data-k="unidades" inputmode="decimal" value="${i.unidades === null || i.unidades === undefined ? '' : esc(String(i.unidades).replace('.', ','))}" ${dis}>` : '<span class="no-aplica" title="Solo para sub recetas que rinden unidades">—</span>'}</div>
        <div class="c-num"><label for="ed-ing-${k}-g">Gramos</label><input id="ed-ing-${k}-g" data-ing="${k}" data-k="gramos" inputmode="decimal" value="${M.num(i.gramos) ? esc(String(r1(i.gramos)).replace('.', ',')) : ''}" ${dis}></div>
        ${pan ? `<div class="c-num"><label for="ed-ing-${k}-p">%</label>${harina ? `<span class="calc" id="ed-ing-${k}-pc"></span>` : `<input id="ed-ing-${k}-p" data-ing="${k}" data-k="pct" inputmode="decimal" ${dis}>`}</div>` : ''}
      </div>
      <div class="c-x">${puede ? `<button type="button" class="btn-x" data-quitar-ing="${k}" aria-label="Quitar ${esc(i.nombre || 'ingrediente')}">×</button>` : ''}</div>
    </div>`;
  };
  const filaIns = (i, k) => `<div class="ing-fila" data-fila-ins="${k}">
      <div class="c-nombre"><label for="ed-ins-${k}-n" class="sr">Insumo ${k + 1}</label><input id="ed-ins-${k}-n" data-ins="${k}" data-k="nombre" value="${esc(i.nombre)}" placeholder="Escribe para buscar: envase, etiqueta…" autocomplete="off" ${dis}><div class="sugs" id="ed-ins-${k}-n-sug"></div>
        ${i.nombre && !i.id ? `<small class="error">No está habilitado: pídelo con "Falta una materia prima".</small>` : ''}</div>
      <div class="c-nums uno"><div class="c-num"><label for="ed-ins-${k}-c">Cantidad</label><input id="ed-ins-${k}-c" data-ins="${k}" data-k="cantidad" inputmode="decimal" value="${M.num(i.cantidad) ? esc(String(i.cantidad).replace('.', ',')) : ''}" ${dis}></div></div>
      <div class="c-x">${puede ? `<button type="button" class="btn-x" data-quitar-ins="${k}" aria-label="Quitar insumo">×</button>` : ''}</div>
    </div>`;
  const clasBol = [['producto_simple', 'Producto'], ['masa_base', 'Masa base, empaste o poolish'], ['relleno', 'Relleno o preparación']];
  // Botones: el principal primero (en el celular quedan uno bajo otro); "Anular" aparte, como enlace
  const acciones = [];
  if (EDITABLE(p)) acciones.push(`<button type="button" class="btn btn-fuerte" data-ed-estado="en_revision">Enviar a revisión</button>`);
  if (p.estado === 'borrador' || p.estado === 'devuelta') acciones.push(`<button type="button" class="btn-sec" data-ed-estado="en_prueba">Marcar en prueba</button>`);
  if (p.estado === 'en_prueba') acciones.push(`<button type="button" class="btn-sec" data-ed-estado="borrador">Volver a borrador</button>`);
  if (p.estado === 'en_revision') acciones.push(`<button type="button" class="btn-sec" data-ed-estado="borrador">Retirar de revisión</button>`);
  return `<div class="nav-fecha"><button type="button" class="btn-flecha" data-ed-cerrar="1" aria-label="Volver a Recetas">${ic('izq')}</button>
      <h2>${esc(d.nombre || 'Receta nueva')}</h2><span class="estado est-${esc(p.estado)}">${esc(ESTADOS_P[p.estado] || p.estado)}</span>
      ${puede ? '<span class="ayuda" id="ed-guardado" aria-live="polite">Guardado</span>' : ''}</div>
    ${vigente ? `<p class="ayuda">Cambio a la versión vigente de <b>${esc(vigente.nombre)}</b> (v${esc(String(vigente.version || 1))}). La vigente sigue en la planificación hasta que Administración apruebe esta propuesta.</p>` : `<p class="ayuda">Receta nueva. Cuando Administración la apruebe, aparece en Recetas y en la planificación.</p>`}
    ${p.origen === 'ajuste' ? `<div class="nota neutra">${ic('ajuste')}<span>Viene del ajuste de harina/agua. El ajuste del día sigue valiendo mientras se revisa.</span></div>` : ''}
    ${p.estado === 'devuelta' && devuelta ? `<div class="nota ojo">${ic('alerta')}<span><b>Devuelta por ${esc(devuelta.por || 'Administración')}:</b> ${esc(devuelta.comentario || 'sin comentario')}. Corrígela y vuelve a enviarla.</span></div>` : ''}
    ${p.estado === 'en_revision' ? `<div class="nota neutra">${ic('alerta')}<span>En revisión desde ${esc((ult.en || '').slice(0, 10))}. Para cambiar algo, "Retirar de revisión".</span></div>` : ''}
    <section class="caja form-receta">
      <div class="bloque bloque-datos">
        <div class="campo"><label for="ed-nombre">Nombre</label><input id="ed-nombre" data-ed="nombre" value="${esc(d.nombre)}" maxlength="80" ${dis}></div>
        <div class="campo"><label for="ed-tipo">Tipo</label><select id="ed-tipo" data-ed="tipo" ${dis}><option value="receta" ${d.tipo !== 'sub_receta' ? 'selected' : ''}>Receta (se planifica)</option><option value="sub_receta" ${d.tipo === 'sub_receta' ? 'selected' : ''}>Sub receta (va dentro de otras)</option></select></div>
        <div class="par">
          <div class="campo"><label for="ed-porciones">Rinde</label><input id="ed-porciones" data-ed="porciones" inputmode="decimal" value="${M.num(d.porciones) ? esc(String(d.porciones).replace('.', ',')) : ''}" ${dis}></div>
          <div class="campo"><label for="ed-unidad">En</label><select id="ed-unidad" data-ed="unidad" ${dis}><option value="un" ${d.unidad !== 'g' ? 'selected' : ''}>unidades</option><option value="g" ${d.unidad === 'g' ? 'selected' : ''}>gramos</option></select></div>
        </div>
        <small class="ayuda">Unidades: piezas que se cuentan (12 marraquetas, 1 masa). Gramos: lo que se usa por peso (masa madre, rellenos).</small>
        ${bol ? `<div class="campo"><label for="ed-clas">Clasificación</label><select id="ed-clas" data-ed="clasificacion" ${dis}>${clasBol.map(([v, t]) => `<option value="${v}" ${(d.clasificacion || 'producto_simple') === v || (v === 'producto_simple' && d.clasificacion === 'producto_compuesto') ? 'selected' : ''}>${t}</option>`).join('')}</select></div>` : ''}
        ${bol && d.clasificacion === 'masa_base' ? `<div class="par">
          <div class="campo"><label for="ed-peso">Peso de 1 unidad (g)</label><input id="ed-peso" data-ed="pesoUnidad" inputmode="decimal" value="${M.num(d.pesoUnidad) || ''}" ${dis}></div>
          <label class="check"><input type="checkbox" data-ed="planificable" ${d.planificable !== false ? 'checked' : ''} ${dis}> Se planifica en Masas</label></div>
          <small class="ayuda">Desmarca "Se planifica en Masas" en empastes y poolish: van dentro de la masa base.</small>` : ''}
        ${bol && d.clasificacion === 'relleno' ? `<p class="ayuda">Los rellenos pasan a Pastelería más adelante.</p>` : ''}
        ${bol && d.tipo !== 'sub_receta' ? `<div class="par">
          <label class="check"><input type="checkbox" data-ed="seCongela" ${d.seCongela ? 'checked' : ''} ${dis}> Se congela ya formado</label>
          <div class="campo"><label for="ed-caja">Unidades por caja</label><input id="ed-caja" data-ed="unidadesPorCaja" inputmode="numeric" value="${M.num(d.unidadesPorCaja) || ''}" ${dis}></div></div>` : ''}
      </div>

      <div class="bloque bloque-ing">
        <div class="bloque-cab"><h3>Ingredientes</h3><span>Total <b id="ed-total"></b>${pan ? ` · harina <b id="ed-harina"></b>` : ''}</span></div>
        <div class="ings">${ings.map(filaIng).join('') || '<p class="ayuda">Sin ingredientes todavía.</p>'}</div>
        ${puede ? `<div class="bloque-pie"><button type="button" class="btn-sec" data-ed-agregar="ing">+ Ingrediente</button><button type="button" class="btn-link" data-ed-pedir="1">Falta una materia prima</button></div>` : ''}
      </div>

      ${d.tipo !== 'sub_receta' ? `<div class="bloque bloque-neutro">
        <div class="bloque-cab"><h3>Insumos</h3><span>envases, etiquetas · por ${d.unidad === 'g' ? 'lote' : 'unidad'}</span></div>
        <div class="ings">${ins.map(filaIns).join('') || '<p class="ayuda">Sin insumos.</p>'}</div>
        ${puede ? `<div class="bloque-pie"><button type="button" class="btn-sec" data-ed-agregar="ins">+ Insumo</button></div>` : ''}
      </div>` : ''}

      <div class="bloque bloque-neutro">
        <div class="bloque-cab"><h3>Pasos</h3></div>
        <div class="pasos-ed">${pasos.map((t, k) => `<div class="paso-ed"><label for="ed-paso-${k}">Paso ${k + 1}</label><div class="paso-fila"><textarea id="ed-paso-${k}" data-paso="${k}" rows="2" ${dis}>${esc(t)}</textarea>${puede ? `<button type="button" class="btn-x" data-quitar-paso="${k}" aria-label="Quitar paso ${k + 1}">×</button>` : ''}</div></div>`).join('') || '<p class="ayuda">Sin pasos todavía.</p>'}</div>
        ${puede ? `<div class="bloque-pie"><button type="button" class="btn-sec" data-ed-agregar="paso">+ Paso</button></div>` : ''}
      </div>

      <div class="campo"><label for="ed-notas">Notas internas (opcional)</label><textarea id="ed-notas" data-ed="notas" rows="2" ${dis}>${esc(d.notas || '')}</textarea></div>
      <div class="error" id="ed-error" role="alert"></div>
      <div class="acciones-ed">${acciones.join('')}${ABIERTA(p) ? `<button type="button" class="btn-link anular" data-ed-estado="anulada">Anular propuesta</button>` : ''}</div>
    </section>`;
}
// Totales y % en vivo (sin redibujar los campos)
export function actualizarCalculos() {
  const E = A.E, ed = E.editor; if (!ed || !A.$('ed-total')) return;
  const ings = ed.datos.ingredientes || [], pan = E.area === 'PAN';
  const harina = harinaBase(ed.datos);
  A.$('ed-total').textContent = M.gramos(ings.reduce((s, i) => s + M.num(i.gramos), 0));
  if (pan && A.$('ed-harina')) A.$('ed-harina').textContent = M.gramos(harina);
  const act = document.activeElement;
  ings.forEach((i, k) => {
    const g = A.$(`ed-ing-${k}-g`), p = A.$(`ed-ing-${k}-p`), pc = A.$(`ed-ing-${k}-pc`);
    if (g && g !== act) g.value = M.num(i.gramos) ? String(r1(i.gramos)).replace('.', ',') : '';
    const pct = harina > 0 ? Math.round(M.num(i.gramos) / harina * 1000) / 10 : 0;
    if (p && p !== act) p.value = pct ? String(pct).replace('.', ',') : '';
    if (pc) pc.textContent = pct ? M.unidades(pct) + ' %' : '';
  });
}

// Después de redibujar: si se estaba escribiendo un ingrediente, vuelven sus sugerencias
export function trasPintar(el) {
  if (!A.E.editor || !el || !el.dataset || el.dataset.k !== 'nombre') return;
  if (el.dataset.ing !== undefined) pintarSugerencias(el, false);
  else if (el.dataset.ins !== undefined) pintarSugerencias(el, true);
}

// ── Eventos ──
export function alClick(b) {
  const E = A.E, ds = b.dataset, ed = E.editor;
  if (ds.edNueva) { crear({ nombre: '', tipo: 'receta', porciones: 1, unidad: 'un', ingredientes: [], insumos: [], pasos: [], notas: '', clasificacion: E.area === 'BOL' ? 'producto_simple' : '', pesoUnidad: 0, planificable: true, seCongela: false, unidadesPorCaja: 0 }); return true; }
  if (ds.edAbrir) { abrirEditor(ds.edAbrir); return true; }
  if (ds.edEditar) {
    const abierta = propuestaAbierta(ds.edEditar);
    if (abierta) { abrirEditor(abierta.pid); return true; }
    const r = E.recetas.find(x => x.id === ds.edEditar); if (r) crear(datosDe(r), { recetaId: r.id, origen: 'edicion' });
    return true;
  }
  if (!ed) return false;
  if (ds.edCerrar) { cerrarEditor(); return true; }
  if (ds.edAgregar) {
    if (ds.edAgregar === 'ing') ed.datos.ingredientes.push({ id: '', nombre: '', gramos: 0, unidades: null, pct: null });
    if (ds.edAgregar === 'ins') ed.datos.insumos.push({ id: '', nombre: '', cantidad: 1 });
    if (ds.edAgregar === 'paso') ed.datos.pasos.push('');
    programar(); A.pintar();
    const foco = ds.edAgregar === 'ing' ? `ed-ing-${ed.datos.ingredientes.length - 1}-n` : ds.edAgregar === 'ins' ? `ed-ins-${ed.datos.insumos.length - 1}-n` : `ed-paso-${ed.datos.pasos.length - 1}`;
    const el = A.$(foco); if (el) el.focus();
    return true;
  }
  if (ds.quitarIng !== undefined) {
    const antes = sumaHarinas(ed.datos), q = ed.datos.ingredientes[Number(ds.quitarIng)];
    ed.datos.ingredientes.splice(Number(ds.quitarIng), 1);
    if (q && esHarina(q.nombre) && Math.abs(M.num(ed.datos.harinaTotal) - antes) < 0.05) ed.datos.harinaTotal = r1(sumaHarinas(ed.datos));
    programar(); A.pintar(); return true;
  }
  if (ds.quitarIns !== undefined) { ed.datos.insumos.splice(Number(ds.quitarIns), 1); programar(); A.pintar(); return true; }
  if (ds.quitarPaso !== undefined) { ed.datos.pasos.splice(Number(ds.quitarPaso), 1); programar(); A.pintar(); return true; }
  if (ds.elegir) {
    const lista = ds.elegir === 'ins' ? ed.datos.insumos : ed.datos.ingredientes, i = lista[Number(ds.fila)], m = (E.mps || []).find(x => x.id === ds.mp);
    if (i && m) {
      i.id = m.id; i.nombre = m.nombre;
      if (ds.elegir === 'ing' && !subEnUnidades(m.id)) i.unidades = null;
      programar(); A.pintar();
      const sig = A.$(ds.elegir === 'ins' ? `ed-ins-${ds.fila}-c` : (subEnUnidades(m.id) ? `ed-ing-${ds.fila}-u` : `ed-ing-${ds.fila}-g`)); if (sig) sig.focus();
    }
    return true;
  }
  if (ds.edPedir) { dialogoPedir(); return true; }
  if (ds.edEstado) {
    const nuevo = ds.edEstado;
    if (nuevo === 'en_revision') {
      const err = validar(limpio(ed.datos));
      if (err) { A.$('ed-error').textContent = err; return true; }
    }
    if (nuevo === 'anulada' && !confirm('¿Anular esta propuesta? Queda en el registro como anulada; la receta vigente no cambia.')) return true;
    cambiarEstado(ed.pid, nuevo);
    if (nuevo === 'anulada' || nuevo === 'en_revision') { E.editor = null; A.pintar(); }
    return true;
  }
  return false;
}
function validar(d) {
  if (!d.nombre) return 'Falta el nombre.';
  if (!(M.num(d.porciones) > 0)) return 'Falta cuánto rinde.';
  if (!d.ingredientes.length) return 'Agrega al menos un ingrediente.';
  const malo = d.ingredientes.find(i => !i.id); if (malo) return `"${malo.nombre}" no está habilitado para el área: pídelo con "Falta una materia prima" o elige otro.`;
  const vacio = d.ingredientes.find(i => !(M.num(i.gramos) > 0) && !(M.num(i.unidades) > 0)); if (vacio) return `Falta la cantidad de "${vacio.nombre}".`;
  const insMalo = (d.insumos || []).find(i => !i.id); if (insMalo) return `"${insMalo.nombre}" no está habilitado: pídelo o quítalo.`;
  const dup = Object.values(A.E.recetas || {}).find(r => r.area === A.E.area && norm(r.nombre) === norm(d.nombre) && r.id !== (A.E.propuestas[A.E.editor.pid] || {}).recetaId);
  if (dup) return `Ya existe una receta "${dup.nombre}". Usa otro nombre o edita esa.`;
  return '';
}
export function alInput(t) {
  const E = A.E, ed = E.editor; if (!ed) return false;
  const d = ed.datos, ds = t.dataset;
  if (ds.ed) {
    const k = ds.ed, v = t.type === 'checkbox' ? t.checked : t.value;
    d[k] = ['porciones', 'pesoUnidad', 'unidadesPorCaja'].includes(k) ? M.num(v) : v;
    programar();
    if (['tipo', 'clasificacion', 'unidad'].includes(k)) A.pintar();
    return true;
  }
  if (ds.ing !== undefined) {
    const i = d.ingredientes[Number(ds.ing)]; if (!i) return true;
    if (ds.k === 'nombre') {
      const m = buscarOpcion(t.value, false), antes = i.id;
      i.nombre = t.value; i.id = m ? m.id : '';
      if (m) i.nombre = m.nombre;
      if (antes !== i.id && i.id) { const su = subEnUnidades(i.id); if (!su) i.unidades = null; programar(); A.pintar(); return true; }
      pintarSugerencias(t, false); programar(); return true;
    } else if (ds.k === 'gramos') {
      const antes = sumaHarinas(d);
      i.gramos = M.num(t.value);
      // Una sub receta que rinde unidades se costea por unidades: se mantienen al día con los gramos
      const su = subEnUnidades(i.id); if (su) i.unidades = Math.round(i.gramos / su.peso * 10000) / 10000;
      if (esHarina(i.nombre) && Math.abs(M.num(d.harinaTotal) - antes) < 0.05) d.harinaTotal = r1(sumaHarinas(d));
    }
    else if (ds.k === 'unidades') { const su = subEnUnidades(i.id); i.unidades = t.value.trim() === '' ? null : M.num(t.value); if (su && i.unidades !== null) i.gramos = r1(i.unidades * su.peso); }
    else if (ds.k === 'pct') {
      const harina = harinaBase(d);
      if (harina > 0) { i.gramos = r1(harina * M.num(t.value) / 100); const su = subEnUnidades(i.id); if (su) i.unidades = Math.round(i.gramos / su.peso * 10000) / 10000; }
    }
    programar(); actualizarCalculos();
    return true;
  }
  if (ds.ins !== undefined) {
    const i = d.insumos[Number(ds.ins)]; if (!i) return true;
    if (ds.k === 'nombre') { const m = buscarOpcion(t.value, true), antes = i.id; i.nombre = m ? m.nombre : t.value; i.id = m ? m.id : ''; if (antes !== i.id && i.id) { programar(); A.pintar(); return true; } pintarSugerencias(t, true); programar(); return true; }
    else i.cantidad = M.num(t.value);
    programar(); return true;
  }
  if (ds.paso !== undefined) { d.pasos[Number(ds.paso)] = t.value; programar(); return true; }
  return false;
}

// ── Pedir una materia prima (nueva o habilitar una que existe en otra área) ──
function dialogoPedir() {
  const E = A.E, esc = A.esc, d = A.$('dialogo'), ed = E.editor;
  const otras = (E.mps || []).filter(m => (m.estado || 'activa') === 'activa' && m.tipo !== 'sub_receta' && !/^SR/.test(m.id) && !habilitada(m, E.area)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  let modo = 'nueva';
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>Falta una materia prima</h2>
      <p class="ayuda">Le llega a Administración en Sistema Fën. Cuando la cree o la habilite, aparece aquí para elegirla.</p>
      <fieldset class="opciones" style="border:0;padding:0;margin:0"><legend class="rotulo">¿Qué falta?</legend>
        <label><input type="radio" name="pm-modo" value="nueva" checked>Una que no existe</label>
        <label><input type="radio" name="pm-modo" value="habilitar" ${otras.length ? '' : 'disabled'}>Una que existe en otra área (habilitarla para ${esc(A.AREAS[E.area].nombre)})</label>
      </fieldset>
      <div id="pm-nueva">
        <div class="campo"><label for="pm-nombre">Nombre</label><input id="pm-nombre" maxlength="80" autocomplete="off"></div>
        <div class="fila-campos">
          <div class="campo"><label for="pm-tipo">Es</label><select id="pm-tipo"><option value="mp">Materia prima (ingrediente)</option><option value="insumo">Insumo (envase, etiqueta…)</option></select></div>
          <div class="campo"><label for="pm-unidad">Se compra por</label><input id="pm-unidad" placeholder="kg, 25kg, lt, un, 10un…" maxlength="20"></div>
        </div>
      </div>
      <div id="pm-habilitar" class="oculto"><div class="campo"><label for="pm-existente">Materia prima</label><select id="pm-existente">${otras.map(m => `<option value="${esc(m.id)}">${esc(m.nombre)}</option>`).join('')}</select></div></div>
      <div class="campo"><label for="pm-nota">Nota (opcional)</label><input id="pm-nota" maxlength="200" placeholder="Marca, proveedor, para qué es…"></div>
      <div class="error" id="pm-error" role="alert"></div>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">Pedir</button></div>
    </form>`;
  d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.oninput = null;
  d.onchange = ev => { if (ev.target.name === 'pm-modo') { modo = ev.target.value; A.$('pm-nueva').classList.toggle('oculto', modo !== 'nueva'); A.$('pm-habilitar').classList.toggle('oculto', modo !== 'habilitar'); } };
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (!b.dataset.guardar) return;
    const id = nuevoId(), base = { area: E.area, id, estado: 'pendiente', nota: A.$('pm-nota').value.trim().slice(0, 200), receta: ed ? String(ed.datos.nombre || '').slice(0, 80) : '', por: A.quien(), en: A.ahoraIso() };
    let s;
    if (modo === 'habilitar') { const m = otras.find(x => x.id === A.$('pm-existente').value); if (!m) return; s = { ...base, tipo: 'habilitar', mpId: m.id, nombre: m.nombre }; }
    else {
      const nombre = A.$('pm-nombre').value.trim();
      if (!nombre) { A.$('pm-error').textContent = 'Escribe el nombre.'; return; }
      if ((E.mps || []).some(m => norm(m.nombre) === norm(nombre))) { A.$('pm-error').textContent = 'Ya existe una con ese nombre: elige "Una que existe en otra área" o búscala en la lista.'; return; }
      s = { ...base, tipo: 'nueva', nombre: nombre.slice(0, 80), esInsumo: A.$('pm-tipo').value === 'insumo', unidadCompra: A.$('pm-unidad').value.trim().toLowerCase().slice(0, 20) };
    }
    d.close();
    E.solicitudes[id] = s;
    A.guardarSinEsperar(A.setDoc(A.doc(A.db, 'solicitudes', `${E.area}_${id}`), s), 'Pedida a Administración.');
    A.pintar();
  };
}
