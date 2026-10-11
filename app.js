// ═══════════════════════════════════════════════
//  fën · Cocina — la app de las jefas  v0.1.1
//  Base en vivo (Firebase fen-produccion): abre al tiro con lo guardado en el equipo,
//  la dupla ve lo mismo al instante y cada cambio se guarda por separado (nunca
//  "borrar la semana y reescribir"). Si algo no se pudo guardar, lo dice.
//
//  Entrada: el equipo se autoriza UNA vez con la cuenta del área; después cada persona
//  elige su nombre y pone su PIN de Asistencia (lo revisa el Apps Script de Producción),
//  y queda recordada 12 horas.
//
//  v0.1.0 (P1): Panadería completa (Hoy y Planificación) y Recetas en consulta para
//  todas las áreas. Bollería, Pastelería y Cafetería siguen en la app actual por ahora.
//  v0.1.1: las elaboraciones previas (masa ciabatta, masa madre…) tienen tarjeta completa, con
//  ingredientes, tandas (por unidades o por kg, y "dividir siempre así") y ajuste de harina/agua.
// ═══════════════════════════════════════════════
import {
  auth, db, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence,
  collection, doc, getDoc, setDoc, query, where, onSnapshot, serverTimestamp
} from './firebase.js?v=0.1.1';
import * as M from './modelo.js?v=0.1.1';

const C = window.FEN_COCINA;
const AREAS = {
  PAN: { nombre: 'Panadería', icono: 'pan', nueva: true },
  BOL: { nombre: 'Bollería', icono: 'croissant', nueva: false },
  PAS: { nombre: 'Pastelería', icono: 'torta', nueva: false },
  CAF: { nombre: 'Cafetería', icono: 'cafe', nueva: false }
};
const ESTADOS = { consolidada: 'Aprobada', en_prueba: 'En prueba', borrador: 'Borrador', 'pendiente_aprobación': 'En revisión', pendiente_aprobacion: 'En revisión' };
const K_PERSONA = 'fen_cocina_persona', K_AREA = 'fen_cocina_area';

const E = {
  usuario: null, area: null, persona: null,
  recetas: [], mps: [], config: {}, personas: [], ajustes: {},
  planes: {}, dias: {}, cargado: {}, escuchas: {},
  celdasMalas: {}, fecha: M.hoyTxt(), lunesPlan: M.lunesDe(M.hoyTxt()), filasNuevas: {}, recetaVista: null, cantidadVista: null, buscar: '',
  pin: { email: '', digitos: '', enviando: false, error: '' }
};
const $ = id => document.getElementById(id);
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ahoraIso = () => new Date().toISOString();
const horaDe = iso => { try { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; } catch (e) { return ''; } };
const leerLS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const guardarLS = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

// ── Íconos lineales ──
const IC = {
  hoy: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
  plan: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  libro: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
  ajuste: '<path d="M5 7h9M18 7h1M5 17h3M12 17h7"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  capas: '<path d="M4 8l8-4 8 4-8 4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/>',
  check: '<path d="M6 12.5l4 4 8-9"/>',
  caja: '<rect x="4" y="4" width="16" height="16" rx="4"/>',
  izq: '<path d="M15 5l-7 7 7 7"/>', der: '<path d="M9 5l7 7-7 7"/>',
  alerta: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5M12 16h.01"/>',
  ok: '<circle cx="12" cy="12" r="8"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  pan: '<path d="M5 11c0-3.5 3-6 7-6s7 2.5 7 6v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M9 9.5l1 2M12 8.5v2.5M15 9.5l-1 2"/>',
  croissant: '<path d="M3 14c2-5 5-8 9-8s7 3 9 8"/><path d="M3 14c3 2 6 3 9 3s6-1 9-3"/><path d="M8 8.5l1.5 7M12 6v11M16 8.5l-1.5 7"/>',
  torta: '<path d="M4 20h16M5 20v-7h14v7"/><path d="M5 13c2 1.5 4.5 1.5 7 0s5-1.5 7 0"/><path d="M12 9V6"/>',
  cafe: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M11 3v3"/>',
  pasos: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;

function avisar(texto, mal) {
  const f = $('flotante'); f.textContent = texto; f.classList.toggle('mal', !!mal); f.classList.remove('oculto');
  clearTimeout(avisar.t); avisar.t = setTimeout(() => f.classList.add('oculto'), mal ? 6000 : 2600);
}
const mensajeError = e => {
  const c = (e && e.code) || '';
  if (/permission-denied/.test(c)) return 'Este equipo no tiene permiso para eso. Pide a Administración que revise la cuenta del área.';
  if (/unavailable|network/.test(c)) return 'Sin conexión. Queda guardado en el equipo y se envía al volver.';
  return (e && e.message) || String(e);
};
function mostrar(cual) {
  ['cargando', 'v-autorizar', 'v-pin', 'app'].forEach(id => $(id).classList.toggle('oculto', id !== cual));
}

// ═══════════════ Entrada ═══════════════
setPersistence(auth, browserLocalPersistence).catch(() => {});
$('form-autorizar').addEventListener('submit', async ev => {
  ev.preventDefault();
  $('a-error').textContent = ''; $('a-btn').disabled = true;
  try { await signInWithEmailAndPassword(auth, $('a-correo').value.trim(), $('a-clave').value); $('a-clave').value = ''; }
  catch (e) { $('a-error').textContent = /invalid|wrong|user-not-found/.test(e.code || '') ? 'Correo o contraseña incorrectos.' : mensajeError(e); }
  finally { $('a-btn').disabled = false; }
});

onAuthStateChanged(auth, async u => {
  E.usuario = u;
  if (!u) { pararEscuchas(); E.area = null; mostrar('v-autorizar'); return; }
  // El área se recuerda en el equipo para abrir al tiro; se confirma con la base en segundo plano.
  const guardada = leerLS(K_AREA, null);
  if (guardada && guardada.uid === u.uid && AREAS[guardada.area]) entrarArea(guardada.area);
  try {
    const sn = await getDoc(doc(db, 'cuentas', u.uid));
    const area = sn.exists() ? sn.data().area : null;
    if (!AREAS[area]) {
      guardarLS(K_AREA, null); mostrar('v-autorizar');
      $('a-error').textContent = 'Esta cuenta no tiene un área asignada. Se asigna en Sistema Fën → Producción → Cuentas de las áreas.';
      await signOut(auth); return;
    }
    guardarLS(K_AREA, { uid: u.uid, area });
    if (area !== E.area) entrarArea(area);
  } catch (e) {
    if (!E.area) { mostrar('v-autorizar'); $('a-error').textContent = 'No se pudo leer el área de esta cuenta: ' + mensajeError(e); }
  }
});

function entrarArea(area) {
  E.area = area;
  document.body.dataset.area = area;
  $('area-icono').innerHTML = ic(AREAS[area].icono);
  $('area-nombre').textContent = AREAS[area].nombre;
  $('pie-version').textContent = `Cocina v${C.VERSION} · ${AREAS[area].nombre}`;
  iniciarEscuchas();
  const p = leerLS(K_PERSONA, null);
  if (p && p.area === area && p.hasta > Date.now()) { E.persona = p; abrirApp(); }
  else { E.persona = null; pintarPin(); mostrar('v-pin'); }
}

// ── PIN ──
function personasDelArea() { return E.personas.filter(p => (p.areas || []).includes(E.area)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')); }
function pintarPin() {
  const P = E.pin, lista = personasDelArea();
  $('v-pin').innerHTML = `
    <div class="marca"><img class="logo" src="logo-fen.png?v=${C.VERSION}" alt="Fën"><span>${esc(AREAS[E.area].nombre)}</span></div>
    <div class="tarjeta pin-caja">
      <h1 id="t-pin">¿Quién trabaja?</h1>
      ${!E.cargado.personas ? '<p class="ayuda">Cargando las personas…</p>' : lista.length ? `<div class="personas" role="group" aria-label="Personas">${lista.map(p =>
        `<button type="button" class="persona" data-persona="${esc(p.id)}" aria-pressed="${P.email === p.id}">${esc(p.nombre)}</button>`).join('')}</div>`
        : '<p class="nota ojo">No hay personas asignadas a esta área. Se asignan en Sistema Fën → Producción → Personas.</p>'}
      ${P.email ? `
        <p class="ayuda">PIN de Asistencia (4 dígitos)</p>
        <div class="pin-puntos" aria-hidden="true">${[0, 1, 2, 3].map(i => `<span class="${i < P.digitos.length ? 'lleno' : ''}"></span>`).join('')}</div>
        <div class="error" role="alert">${esc(P.error)}</div>
        <div class="teclado">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" class="tecla" data-tecla="${n}" ${P.enviando ? 'disabled' : ''}>${n}</button>`).join('')}
          <button type="button" class="tecla" data-tecla="borrar" aria-label="Borrar" ${P.enviando ? 'disabled' : ''}>⌫</button>
          <button type="button" class="tecla" data-tecla="0" ${P.enviando ? 'disabled' : ''}>0</button>
          <span></span></div>
        ${P.enviando ? '<p class="ayuda">Revisando el PIN…</p>' : ''}` : ''}
    </div>`;
}
$('v-pin').addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  const P = E.pin;
  if (b.dataset.persona) { P.email = b.dataset.persona; P.digitos = ''; P.error = ''; pintarPin(); return; }
  if (b.dataset.tecla && !P.enviando) {
    if (b.dataset.tecla === 'borrar') P.digitos = P.digitos.slice(0, -1);
    else if (P.digitos.length < 4) P.digitos += b.dataset.tecla;
    P.error = ''; pintarPin();
    if (P.digitos.length === 4) revisarPin();
  }
});
async function revisarPin() {
  const P = E.pin; P.enviando = true; pintarPin();
  try {
    const r = await llamarScript({ action: 'cocina_pin', email: P.email, pin: P.digitos });
    if (!r || r.ok !== true) throw new Error((r && (r.error || r.msg)) || 'No se pudo revisar el PIN.');
    E.persona = { email: r.email, nombre: r.nombre, area: E.area, hasta: Date.now() + C.HORAS_PIN * 3600000 };
    guardarLS(K_PERSONA, E.persona);
    E.pin = { email: '', digitos: '', enviando: false, error: '' };
    abrirApp();
  } catch (e) {
    P.enviando = false; P.digitos = ''; P.error = e.message || String(e); pintarPin();
  }
}
// El Apps Script de Producción (revisa la sesión de Firebase de esta cuenta)
async function llamarScript(cuerpo) {
  const token = await auth.currentUser.getIdToken();
  const body = JSON.stringify({ ...cuerpo, idToken: token });
  const conTiempo = (pr, ms) => Promise.race([pr, new Promise((_, no) => setTimeout(() => no(new Error('El servidor no respondió a tiempo. Intenta de nuevo.')), ms))]);
  let r;
  try { r = await conTiempo(fetch(C.SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body }).then(x => x.json()), 30000); }
  catch (e) { throw new Error(/tiempo/.test(e.message) ? e.message : 'No hay conexión con el servidor. Revisa internet e intenta de nuevo.'); }
  if (r && r.code === 'version') r = await conTiempo(fetch(C.SCRIPT_URL + '?p=' + encodeURIComponent(body)).then(x => x.json()), 30000);
  return r;
}

$('btn-persona').addEventListener('click', () => {
  if (!confirm(`¿Cambiar de persona? ${E.persona ? E.persona.nombre + ' sale de este equipo.' : ''}`)) return;
  E.persona = null; guardarLS(K_PERSONA, null); pintarPin(); mostrar('v-pin');
});
$('btn-salir-equipo').addEventListener('click', async () => {
  if (!confirm('¿Quitar la autorización de este equipo? Para volver a usarlo, Administración tiene que autorizarlo de nuevo con la cuenta del área.')) return;
  guardarLS(K_PERSONA, null); guardarLS(K_AREA, null); E.persona = null;
  await signOut(auth);
});

// ═══════════════ Datos en vivo ═══════════════
function escuchar(clave, ref, cb) {
  if (E.escuchas[clave]) return;
  E.escuchas[clave] = onSnapshot(ref, cb, err => {
    delete E.escuchas[clave];
    if (/permission-denied/.test(err.code || '')) avisar('Este equipo perdió el permiso para leer. Pide a Administración que revise la cuenta del área.', true);
  });
}
function pararEscuchas() { Object.values(E.escuchas).forEach(f => { try { f(); } catch (e) {} }); E.escuchas = {}; E.planes = {}; E.dias = {}; E.cargado = {}; }
function iniciarEscuchas() {
  pararEscuchas();
  escuchar('recetas', collection(db, 'recetas'), sn => { E.recetas = sn.docs.map(d => ({ id: d.id, ...d.data() })); E.cargado.recetas = true; repintar(); });
  escuchar('mps', collection(db, 'mps'), sn => { E.mps = sn.docs.map(d => ({ id: d.id, ...d.data() })); E.cargado.mps = true; repintar(); });
  escuchar('config', doc(db, 'config', E.area), sn => { E.config = sn.exists() ? sn.data() : {}; E.cargado.config = true; repintar(); });
  escuchar('personas', collection(db, 'personas'), sn => {
    E.personas = sn.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.activa !== false); E.cargado.personas = true;
    if (!$('v-pin').classList.contains('oculto')) pintarPin();
  });
  escuchar('ajustes', query(collection(db, 'ajustes'), where('area', '==', E.area)), sn => {
    E.ajustes = {}; sn.docs.forEach(d => { const a = d.data(); E.ajustes[a.recetaId] = a; }); E.cargado.ajustes = true; repintar();
  });
}
function asegurarPlan(lunes) {
  escuchar('plan_' + lunes, doc(db, 'planes', `${E.area}_${lunes}`), sn => { E.planes[lunes] = sn.exists() ? sn.data() : { area: E.area, lunes, filas: {} }; repintar(); revisarPlanilla(); });
  return E.planes[lunes];
}
function asegurarDia(fecha) {
  escuchar('dia_' + fecha, doc(db, 'dias', `${E.area}_${fecha}`), sn => { E.dias[fecha] = sn.exists() ? sn.data() : {}; repintar(); });
  return E.dias[fecha];
}
const quien = () => (E.persona ? E.persona.nombre : '');
// Devuelve la promesa de la base (se resuelve cuando el servidor confirma). La pantalla no la espera:
// lo escrito queda en el equipo y se ve al tiro, también sin conexión.
function guardarDia(fecha, cambios) {
  return setDoc(doc(db, 'dias', `${E.area}_${fecha}`), { area: E.area, fecha, ...cambios, actualizado: { por: quien(), en: serverTimestamp() } }, { merge: true });
}

// Ajuste vigente para una fecha (desde ≤ fecha ≤ hasta)
// Ajuste que vale un día: el último período que lo cubre (desde ≤ día ≤ hasta)
function vigenteDe(a, f) {
  const ps = (a && a.periodos) || [];
  for (let i = ps.length - 1; i >= 0; i--) { const p = ps[i]; if (M.tieneAjuste(p) && p.desde <= f && (!p.hasta || f <= p.hasta)) return p; }
  return null;
}
const ajustesDe = f => { const r = {}; Object.values(E.ajustes).forEach(a => { const v = vigenteDe(a, f); if (v) r[a.recetaId] = v; }); return r; };
const ctx = () => ({ recetas: E.recetas, mps: E.mps, config: E.config });

// ═══════════════ La app ═══════════════
function abrirApp() {
  $('btn-persona').textContent = `${E.persona.nombre} · cambiar`;
  const nueva = AREAS[E.area].nueva;
  const items = nueva ? [['hoy', 'Hoy', 'hoy'], ['plan', 'Planificación', 'plan'], ['recetas', 'Recetas', 'libro']] : [['recetas', 'Recetas', 'libro']];
  $('secciones').innerHTML = items.map(([id, t, i]) => `<a href="#${id}" data-vista="${id}">${ic(i)}${t}</a>`).join('');
  if (!items.some(x => '#' + x[0] === location.hash)) history.replaceState(null, '', '#' + items[0][0]);
  mostrar('app'); pintarRed(); repintar();
}
window.addEventListener('hashchange', () => repintar());
// Una tablet que queda prendida pasa sola al día siguiente (si estaba mirando "hoy")
E.hoyVisto = M.hoyTxt();
function revisarCambioDeDia() {
  const h = M.hoyTxt(); if (h === E.hoyVisto) return;
  if (E.fecha === E.hoyVisto) E.fecha = h;
  if (E.lunesPlan === M.lunesDe(E.hoyVisto)) E.lunesPlan = M.lunesDe(h);
  E.hoyVisto = h; repintar();
}
setInterval(revisarCambioDeDia, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') revisarCambioDeDia(); });
window.addEventListener('online', pintarRed); window.addEventListener('offline', pintarRed);
function pintarRed() {
  const en = navigator.onLine !== false, el = $('estado-red');
  el.textContent = en ? 'En línea' : 'Sin conexión: se guarda en el equipo';
  el.classList.toggle('sin', !en);
}
const vistaActual = () => (location.hash || '#hoy').slice(1);

let marco = 0;
function repintar() { if (marco) return; marco = requestAnimationFrame(() => { marco = 0; pintar(); }); }
function pintar() {
  if ($('app').classList.contains('oculto') || !E.area) return;
  const v = vistaActual();
  document.querySelectorAll('#secciones a').forEach(a => { if (a.dataset.vista === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  // Lo que se está escribiendo no se pierde al repintar
  const act = document.activeElement, guardado = act && act.id && $('principal').contains(act) && /INPUT|TEXTAREA/.test(act.tagName)
    ? { id: act.id, valor: act.value, ini: act.selectionStart, fin: act.selectionEnd } : null;
  const main = $('principal');
  if (!AREAS[E.area].nueva && v !== 'recetas') { location.hash = '#recetas'; return; }
  $('barra-sub').textContent = v === 'plan' ? 'Planificación · semana ' + M.etiquetaSemana(E.lunesPlan) : v === 'recetas' ? 'Recetas' : M.fechaLarga(E.fecha) + ' · semana ' + M.etiquetaSemana(M.lunesDe(E.fecha));
  main.innerHTML = v === 'plan' ? vistaPlan() : v === 'recetas' ? vistaRecetas() : vistaHoy();
  if (guardado && $(guardado.id)) {
    const el = $(guardado.id); el.value = guardado.valor; el.focus();
    if (el.dataset.celda) el.classList.toggle('error-celda', !/^\s*\d*\s*$/.test(el.value));
    try { el.setSelectionRange(guardado.ini, guardado.fin); } catch (e) {}
  }
}

// ── Hoy ──
function vistaHoy() {
  if (!E.cargado.recetas || !E.cargado.mps) return '<div class="vacio">Cargando…</div>';
  const f = E.fecha, lunes = M.lunesDe(f);
  const plan = asegurarPlan(lunes); asegurarPlan(M.sumarDias(lunes, 7)); asegurarPlan(M.sumarDias(lunes, 14)); const dia = asegurarDia(f) || {};
  const nav = `<div class="nav-fecha">
      <button type="button" class="btn-flecha" data-dia="-1" aria-label="Día anterior">${ic('izq')}</button>
      <h2>${esc(M.fechaLarga(f))}${f === M.hoyTxt() ? ' · hoy' : ''}</h2>
      <button type="button" class="btn-flecha" data-dia="1" aria-label="Día siguiente">${ic('der')}</button>
      ${f !== M.hoyTxt() ? '<button type="button" class="btn-sec" data-dia="hoy">Volver a hoy</button>' : ''}
    </div>`;
  if (!plan) return nav + '<div class="vacio">Cargando el plan…</div>';
  const c = ctx(), ajHoy = ajustesDe(f), hechos = dia.hechos || {};
  const planDia = M.planDelDia(plan, f, E.recetas);
  if (!planDia.length) return nav + `<div class="vacio">${ic('plan')}<b>Sin producción planificada para este día</b><a href="#plan">Ir a Planificación</a></div>`;
  const pie = M.pieMasaMadre(f, E.planes, ajustesDe, c);
  const el = M.elaboracionesDia(planDia, ajHoy, c);
  const hecho = k => hechos[k] && hechos[k].por ? hechos[k] : null;
  const btnHecho = (k, texto = 'Marcar hecho') => {
    const h = hecho(k);
    return h ? `<button type="button" class="btn-sec btn-hecho" data-hecho="${esc(k)}" data-valor="0">${ic('check')}Hecho · ${esc(h.por)} ${esc(horaDe(h.en))}</button>`
      : `<button type="button" class="btn-sec" data-hecho="${esc(k)}" data-valor="1">${ic('caja')}${texto}</button>`;
  };
  const cajaPie = !pie ? '' : ['blanca', 'integral'].filter(t => pie[t].total > 0).map(t => `
      <div class="caja ${hecho('pie_' + t) ? 'hecha' : ''}">
        <span class="rotulo">Pie de masa madre ${t} · toca hoy</span>
        <span class="grande num">${M.gramos(pie[t].total)}</span>
        <div class="lista-mini">${pie[t].desglose.map(x => `<div class="fila sub"><span>${esc(x.nombre)}</span><span>${M.gramos(x.gramos)}</span></div>`).join('')}</div>
        <span class="ayuda">Cubre hasta el ${esc(M.fechaCorta(pie.cubiertos[pie.cubiertos.length - 1]))} + reserva ${pie.reservaPct} %.</span>
        ${btnHecho('pie_' + t)}
      </div>`).join('');
  E.tarjetas = {};
  const elabs = el.subRecetas.map(s => tarjetaElab(s, s.recetaId ? ajHoy[s.recetaId] : null, dia, hecho, c)).join('');
  const ins = Object.entries(el.insumos).filter(([, g]) => g > 0.5).sort((a, b) => b[1] - a[1]);
  const harina = M.harinaDe(el.insumos);
  const cajaIns = ins.length ? `<div class="caja">
      <span class="rotulo">Insumos del día</span>
      <span class="grande num">${harina ? esc(M.enSacos(harina, C.KG_SACO)) : M.gramos(ins[0][1])}</span>
      <span class="ayuda">${harina ? 'de harina en total' : esc(ins[0][0])}</span>
      <details class="desp"><summary>Ver todos (${ins.length})</summary><div class="lista-mini">${ins.map(([n, g]) => `<div class="fila sub"><span>${esc(n)}</span><span>${M.gramos(g)}</span></div>`).join('')}</div></details>
    </div>` : '';
  const recetas = planDia.map(x => tarjetaReceta(x, ajHoy[x.receta.id], dia, hecho)).join('');
  const notas = dia.notas || {};
  return nav + `
    <section class="resumen" aria-label="Antes de empezar">${cajaPie}${cajaIns}</section>
    ${elabs ? `<h2 class="titulo">Elaboraciones previas · ${el.subRecetas.length}</h2>${elabs}` : ''}
    <h2 class="titulo">Recetas del día · ${planDia.length}</h2>
    ${recetas}
    <section class="caja">
      <label class="rotulo" for="notas-dia">Notas del día (las ve la dupla)</label>
      <textarea id="notas-dia" rows="3" style="font: inherit; border: 1px solid var(--borde); border-radius: 10px; padding: 10px 12px; background: var(--suave-fondo)">${esc(notas.texto || '')}</textarea>
      ${notas.por ? `<span class="ayuda">Última nota de ${esc(notas.por)}</span>` : ''}
    </section>`;
}

function textoAjuste(r, a) {
  if (!a) return '';
  const P = M.panadero(r), partes = [];
  if (M.num(a.harina) > 0 && Math.abs(M.num(a.harina) - P.harina) > 0.1) partes.push(`Harina base ${M.gramos(a.harina)} (receta ${M.gramos(P.harina)})`);
  Object.entries(a.pct || {}).forEach(([id, p]) => {
    const i = (r.ingredientes || []).find(x => x.id === id);
    if (i) partes.push(`${i.nombre} ${M.unidades(p)} % (receta ${M.unidades(P.pct(i))} %)`);
  });
  return partes.join(' · ');
}

// Una fila de ingrediente: "150 un · 29,7 kg" si va por unidades; el % solo si la receta tiene harina propia
const filaIng = (x, conPct) => `<div class="fila"><span>${esc(x.nombre)}</span><span class="${x.ajustado ? 'aj' : ''}">${x.unidades !== null && x.unidades !== undefined ? M.unidades(x.unidades) + ' un' + (x.gramos > 0 ? ' · ' + M.gramos(x.gramos) : '') : M.gramos(x.gramos)}${conPct && x.pct ? ` · ${M.unidades(x.pct)} %` : ''}</span></div>`;

// Tandas que valen hoy: las guardadas del día; si no hay, las "de siempre" de esa receta; si no, una sola.
// En gramos (masa madre…), si el total cambió se reparten igual que antes; en unidades se avisa.
function tandasHoy(clave, total, rid, enGramos, dia) {
  const guardadas = ((dia.tandas || {})[clave]) || null;
  const cuadran = guardadas && Math.abs(M.sumaTandas(guardadas) - total) < (enGramos ? 1 : 0.001);
  if (cuadran) return { tandas: M.tandasDe(guardadas, total) };
  if (guardadas && enGramos) return { tandas: M.reescalar(guardadas, total) };
  if (guardadas) return { tandas: [total], descuadre: guardadas };
  const usual = M.tandasUsual(rid && (E.ajustes[rid] || {}).tandaUsual, total);
  return { tandas: usual || [total], usual: !!usual };
}

// Tarjeta común de recetas y elaboraciones previas
function tarjeta(o) {
  const enG = o.unidad === 'g', h = o.hecho(o.claveHecho);
  const fmt = x => enG ? M.gramos(x) : M.unidades(x);
  const T = tandasHoy(o.clave, o.total, o.rid, enG, o.dia);
  E.tarjetas[o.clave] = { nombre: o.nombre, total: o.total, unidad: o.unidad, rid: o.rid, escalar: o.escalar, tandas: T.tandas, aj: o.aj };
  const columnas = T.tandas.map((t, i) => {
    const e = o.escalar(t);
    return `<div class="tanda">
        ${T.tandas.length > 1 ? `<span class="rotulo">Tanda ${i + 1} · ${enG ? M.gramos(t) : M.unidades(t) + ' un'}</span>` : ''}
        ${e.filas.map(x => filaIng(x, o.conPct)).join('')}
        <div class="fila total"><span>Total masa</span><span>${M.gramos(e.total)}</span></div>
      </div>`;
  }).join('');
  const pasos = o.receta ? (o.receta.pasos || []).filter(Boolean) : [], proc = o.receta && o.receta.procedimiento;
  return `<article class="receta ${o.elab ? 'elab' : ''} ${h ? 'terminada' : ''}" ${o.elab ? 'data-elab-card' : 'data-receta-card'}="${esc(o.idCard)}">
      <div class="receta-cab">
        <div style="display:flex;flex-direction:column;gap:4px;min-width:0">
          ${o.elab ? '<span class="rotulo">Elaboración previa</span>' : ''}
          <b>${esc(o.nombre)}</b>
          <span class="det">${o.detalle}${T.tandas.length > 1 ? ` · ${T.tandas.length} tandas (${T.tandas.map(fmt).join(' + ')})${T.usual ? ' · como siempre' : ''}` : ''}${h ? ` · terminada por ${esc(h.por)} a las ${esc(horaDe(h.en))}` : ''}</span>
          ${o.para ? `<span class="det">${o.para}</span>` : ''}
        </div>
        ${o.aj && o.receta ? `<span class="chip">Ajuste: ${esc(textoAjuste(o.receta, o.aj))}</span>` : ''}
      </div>
      ${T.descuadre ? `<div class="nota ojo" style="margin:12px 20px 0">${ic('alerta')}<span>El plan cambió a ${fmt(o.total)}: las tandas guardadas (${T.descuadre.map(fmt).join(' + ')}) ya no suman eso. Vuelve a dividir.</span></div>` : ''}
      <div class="tandas">${columnas}</div>
      ${pasos.length || proc ? `<details class="desp" style="padding:0 20px"><summary>${ic('pasos')}&nbsp;Pasos</summary>${pasos.length ? `<ol class="pasos">${pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>` : `<p class="texto-proc">${esc(proc)}</p>`}</details>` : ''}
      <div class="receta-pie">
        ${o.ajustable ? `<button type="button" class="btn-sec" data-ajustar="${esc(o.rid)}">${ic('ajuste')}Ajustar harina / agua</button>` : o.ajusteEn ? `<span class="ayuda">${esc(o.ajusteEn)}</span>` : ''}
        <button type="button" class="btn-sec" data-tandas="${esc(o.clave)}">${ic('capas')}Tandas</button>
        <span class="der">${h ? `<button type="button" class="btn-sec btn-hecho" data-hecho="${esc(o.claveHecho)}" data-valor="0">${ic('check')}Terminada · deshacer</button>`
          : `<button type="button" class="btn" data-hecho="${esc(o.claveHecho)}" data-valor="1">${ic('check')}Marcar terminada</button>`}</span>
      </div>
    </article>`;
}

function tarjetaReceta({ receta: r, unidades }, aj, dia, hecho) {
  const c = ctx(), esPan = E.area === 'PAN', P = M.panadero(r);
  // Un producto hecho de una masa (Ciabatta = Masa ciabatta): la harina y el agua se ajustan en la masa
  const masas = (r.ingredientes || []).filter(i => M.esSub(i, c) && !M.esPieMM(i.nombre)).map(i => i.nombre);
  return tarjeta({ clave: r.id, idCard: r.id, rid: r.id, receta: r, nombre: r.nombre, unidad: r.unidad === 'g' ? 'g' : 'un', total: unidades, dia, hecho,
    claveHecho: 'rec_' + r.id, aj, escalar: t => M.escalar(r, t, aj, c), conPct: esPan,
    detalle: `${M.unidades(unidades)} ${r.unidad === 'g' ? 'g' : 'unidades'}`,
    ajustable: esPan && P.ajustable, ajusteEn: esPan && !P.ajustable && masas.length ? `Harina y agua: se ajustan en ${masas.join(', ')} (elaboraciones previas)` : '' });
}

function tarjetaElab(s, aj, dia, hecho, c) {
  const rs = s.recetaId ? E.recetas.find(r => r.id === s.recetaId) : null, P = rs ? M.panadero(rs) : null;
  const total = s.porUnidades ? s.unidades : Math.round(s.gramos);
  const para = [...new Set(s.usan.map(u => u.nombre))];
  return tarjeta({ clave: 'sub_' + s.id, idCard: s.id, elab: true, rid: rs ? rs.id : null, receta: rs, nombre: s.nombre, unidad: s.porUnidades ? 'un' : 'g', total, dia, hecho,
    claveHecho: 'sub_' + s.id, aj, escalar: t => M.escalarSub(s, t, aj, c), conPct: E.area === 'PAN',
    detalle: s.porUnidades ? `${M.unidades(s.unidades)} un · ${M.gramos(s.gramos)}` : M.gramos(s.gramos),
    para: `Para ${esc(para.join(', '))}`, ajustable: E.area === 'PAN' && !!(P && P.ajustable) });
}

// ── Planificación ──
function vistaPlan() {
  if (!E.cargado.recetas) return '<div class="vacio">Cargando…</div>';
  const lunes = E.lunesPlan, plan = asegurarPlan(lunes);
  const nav = `<div class="nav-fecha">
      <button type="button" class="btn-flecha" data-semana="-7" aria-label="Semana anterior">${ic('izq')}</button>
      <h2>Semana ${esc(M.etiquetaSemana(lunes))}</h2>
      <button type="button" class="btn-flecha" data-semana="7" aria-label="Semana siguiente">${ic('der')}</button>
      ${lunes !== M.lunesDe(M.hoyTxt()) ? '<button type="button" class="btn-sec" data-semana="hoy">Esta semana</button>' : ''}
    </div>`;
  if (!plan) return nav + '<div class="vacio">Cargando el plan…</div>';
  const filas = plan.filas || {}, nuevas = E.filasNuevas[lunes] || [];
  const ids = [...new Set([...Object.keys(filas).filter(id => Object.values(filas[id] || {}).some(v => M.num(v) > 0)), ...nuevas])];
  const receta = id => E.recetas.find(r => r.id === id);
  const lista = ids.map(id => ({ id, r: receta(id), nombre: (receta(id) || {}).nombre || (plan.nombres || {})[id] || id })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const hoyIdx = lunes === M.lunesDe(M.hoyTxt()) ? M.indiceDia(M.hoyTxt()) : -1;
  const disponibles = E.recetas.filter(r => r.area === E.area && r.estado === 'consolidada' && r.tipo !== 'sub_receta' && !ids.includes(r.id)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const totDia = M.DIAS_CORTOS.map((_, i) => lista.reduce((s, x) => s + M.num((filas[x.id] || {})['d' + i]), 0));
  const enRevision = lista.filter(x => x.r && x.r.estado !== 'consolidada');
  return nav + `
    ${enRevision.length ? `<div class="nota ojo">${ic('alerta')}<span>${esc(enRevision.map(x => x.nombre).join(', '))}: la receta no está aprobada ahora (${esc(enRevision.map(x => ESTADOS[x.r.estado] || x.r.estado).join(', '))}). Su plan se mantiene.</span></div>` : ''}
    <div class="tabla-caja">
      <table class="plan">
        <thead><tr><th scope="col">Receta</th>${M.DIAS_CORTOS.map((d, i) => `<th scope="col" class="${i === hoyIdx ? 'hoy-col' : ''}">${d} ${Number(M.sumarDias(lunes, i).slice(8))}</th>`).join('')}<th scope="col">Total</th></tr></thead>
        <tbody>${lista.length ? lista.map(x => `<tr>
            <td class="nombre">${esc(x.nombre)}</td>
            ${M.DIAS_CORTOS.map((d, i) => { const v = M.num((filas[x.id] || {})['d' + i]); const idc = `c-${x.id}-${i}`, mala = E.celdasMalas[lunes + '|' + idc]; return `<td class="${i === hoyIdx ? 'hoy-col' : ''}"><label class="sr" for="${esc(idc)}">${esc(x.nombre)} ${d}</label><input id="${esc(idc)}" inputmode="numeric" data-celda="${esc(x.id)}" data-d="${i}" value="${mala !== undefined ? esc(mala) : (v || '')}" class="${mala !== undefined ? 'error-celda' : ''}" autocomplete="off"></td>`; }).join('')}
            <td class="num"><b>${M.miles(M.DIAS_CORTOS.reduce((s, _, i) => s + M.num((filas[x.id] || {})['d' + i]), 0))}</b></td>
          </tr>`).join('') : `<tr><td colspan="9" style="text-align:left;color:var(--suave);padding:18px 10px">Esta semana no tiene recetas planificadas. Agrega una abajo o copia la semana anterior.</td></tr>`}</tbody>
        ${lista.length ? `<tfoot><tr><td>Total</td>${totDia.map((t, i) => `<td class="num ${i === hoyIdx ? 'hoy-col' : ''}">${M.miles(t)}</td>`).join('')}<td class="num">${M.miles(totDia.reduce((s, x) => s + x, 0))}</td></tr></tfoot>` : ''}
      </table>
    </div>
    <div class="agregar">
      <div class="campo"><label for="agregar-receta">Agregar receta a esta semana</label>
        <select id="agregar-receta"><option value="">Elige una receta aprobada…</option>${disponibles.map(r => `<option value="${esc(r.id)}">${esc(r.nombre)}</option>`).join('')}</select></div>
      <button type="button" class="btn-sec" data-accion="agregar">Agregar</button>
      <button type="button" class="btn-sec" data-accion="copiar">Copiar la semana anterior</button>
    </div>
    <p class="ayuda">Cada número se guarda solo al escribirlo, y la dupla lo ve al instante. La planilla de Producción se actualiza sola unos segundos después${planillaTexto()}.</p>`;
}
function planillaTexto() {
  const pend = Object.values(E.planes).some(p => p && p.planillaPendiente);
  return E.planilla.error ? ` · <b>planilla pendiente:</b> ${esc(E.planilla.error)}` : pend ? ' · hay cambios por pasar a la planilla' : '';
}

let tiempos = {};
function guardarCelda(rid, d, texto) {
  const lunes = E.lunesPlan, n = Math.round(M.num(texto));
  const input = $(`c-${rid}-${d}`);
  const idc = `${lunes}|c-${rid}-${d}`;
  // Lo mal escrito se queda a la vista (marcado) aunque la pantalla se repinte, hasta que se corrija
  if (!/^\s*\d*\s*$/.test(texto) || n > 99999) { E.celdasMalas[idc] = texto; if (input) input.classList.add('error-celda'); avisar('Escribe un número entero (unidades).', true); return; }
  delete E.celdasMalas[idc];
  if (input) { input.classList.remove('error-celda'); input.classList.add('guardando'); }
  const r = E.recetas.find(x => x.id === rid);
  // Queda en el equipo al tiro; "guardando" se apaga cuando el servidor confirma
  setDoc(doc(db, 'planes', `${E.area}_${lunes}`), {
    area: E.area, lunes, filas: { [rid]: { ['d' + d]: n } }, nombres: { [rid]: r ? r.nombre : rid },
    planillaPendiente: true, actualizado: { por: quien(), en: serverTimestamp() }
  }, { merge: true }).then(() => { const el = $(`c-${rid}-${d}`); if (el) el.classList.remove('guardando'); })
    .catch(e => { const el = $(`c-${rid}-${d}`); if (el) { el.classList.remove('guardando'); el.classList.add('error-celda'); } avisar('No se guardó: ' + mensajeError(e), true); });
  programarPlanilla();
}
async function copiarSemanaAnterior() {
  const lunes = E.lunesPlan, ant = M.sumarDias(lunes, -7);
  asegurarPlan(ant);
  for (let i = 0; i < 40 && !E.planes[ant]; i++) await new Promise(r => setTimeout(r, 100));
  const prev = E.planes[ant];
  const filasPrev = Object.fromEntries(Object.entries((prev && prev.filas) || {}).filter(([, d]) => Object.values(d || {}).some(v => M.num(v) > 0)));
  if (!Object.keys(filasPrev).length) { avisar('La semana anterior no tiene nada planificado.', true); return; }
  const actual = E.planes[lunes] || {};
  const tiene = Object.values(actual.filas || {}).some(d => Object.values(d || {}).some(v => M.num(v) > 0));
  if (tiene && !confirm('Esta semana ya tiene números. ¿Reemplazarlos por los de la semana anterior?')) return;
  // Celda por celda: lo de esta semana que no estaba en la anterior queda en 0
  const filas = {};
  new Set([...Object.keys(actual.filas || {}), ...Object.keys(filasPrev)]).forEach(id => {
    filas[id] = {}; for (let i = 0; i < 7; i++) filas[id]['d' + i] = M.num(((filasPrev[id] || {})['d' + i]) || 0);
  });
  const nombres = {}; Object.keys(filas).forEach(id => { const r = E.recetas.find(x => x.id === id); nombres[id] = r ? r.nombre : ((prev.nombres || {})[id] || id); });
  guardarSinEsperar(setDoc(doc(db, 'planes', `${E.area}_${lunes}`), { area: E.area, lunes, filas, nombres, planillaPendiente: true, actualizado: { por: quien(), en: serverTimestamp() } }, { merge: true }));
  avisar('Semana anterior copiada. Revisa y ajusta lo que corresponda.'); programarPlanilla();
}

// La planilla (copia para Looker y la app antigua): el Apps Script lee los planes cambiados y los escribe
E.planilla = { t: 0, corriendo: false, error: '' };
function programarPlanilla(ms = 15000) { clearTimeout(E.planilla.t); E.planilla.t = setTimeout(pasarPlanilla, ms); }
function revisarPlanilla() { if (Object.values(E.planes).some(p => p && p.planillaPendiente) && !E.planilla.t && !E.planilla.corriendo) programarPlanilla(5000); }
async function pasarPlanilla() {
  E.planilla.t = 0;
  if (E.planilla.corriendo || !E.usuario || navigator.onLine === false) { programarPlanilla(60000); return; }
  E.planilla.corriendo = true;
  try {
    const r = await llamarScript({ action: 'cocina_planilla' });
    if (!r || r.ok !== true) throw new Error((r && (r.error || r.msg)) || 'sin respuesta');
    E.planilla.error = '';
  } catch (e) { E.planilla.error = e.message || String(e); programarPlanilla(120000); }
  finally { E.planilla.corriendo = false; repintar(); }
}

// ── Recetas (consulta) ──
function vistaRecetas() {
  if (!E.cargado.recetas) return '<div class="vacio">Cargando…</div>';
  if (E.recetaVista) return detalleReceta(E.recetas.find(r => r.id === E.recetaVista));
  const q = E.buscar.trim().toLowerCase();
  const lista = E.recetas.filter(r => r.area === E.area && (!q || r.nombre.toLowerCase().includes(q)))
    .sort((a, b) => (a.estado === 'consolidada' ? 0 : 1) - (b.estado === 'consolidada' ? 0 : 1) || a.nombre.localeCompare(b.nombre, 'es'));
  return `${!AREAS[E.area].nueva ? `<div class="nota neutra">${ic('alerta')}<span>${esc(AREAS[E.area].nombre)} sigue planificando en la app actual por ahora. Aquí puedes consultar las recetas. <a href="${esc(C.APP_ANTIGUA)}">Abrir la app actual</a></span></div>` : ''}
    <div class="campo"><label for="buscar-receta">Buscar</label><input id="buscar-receta" value="${esc(E.buscar)}" placeholder="Nombre de la receta" autocomplete="off"></div>
    <div class="lista-recetas">${lista.map(r => `<button type="button" class="item-receta" data-receta="${esc(r.id)}">
        <b>${esc(r.nombre)}</b>
        <small>${r.tipo === 'sub_receta' ? 'Sub receta · ' : ''}rinde ${M.unidades(M.porciones(r))} ${r.unidad === 'g' ? 'g' : 'un'}</small>
        ${r.estado !== 'consolidada' ? `<span class="estado">${esc(ESTADOS[r.estado] || r.estado || 'Sin estado')}</span>` : ''}
      </button>`).join('') || '<p class="ayuda">No hay recetas con ese nombre.</p>'}</div>`;
}
function detalleReceta(r) {
  if (!r) { E.recetaVista = null; return vistaRecetas(); }
  const cant = E.cantidadVista ?? M.porciones(r), e = M.escalar(r, cant, null, ctx()), esPan = E.area === 'PAN';
  const pasos = (r.pasos || []).filter(Boolean);
  return `<div class="nav-fecha"><button type="button" class="btn-flecha" data-volver="1" aria-label="Volver a la lista">${ic('izq')}</button><h2>${esc(r.nombre)}</h2>
      ${r.estado !== 'consolidada' ? `<span class="estado">${esc(ESTADOS[r.estado] || r.estado || '')}</span>` : ''}</div>
    <div class="caja">
      <div class="campo" style="max-width:260px"><label for="cant-receta">Cantidad (${r.unidad === 'g' ? 'gramos' : 'unidades'})</label><input id="cant-receta" inputmode="decimal" value="${esc(M.unidades(cant))}"></div>
      <span class="ayuda">La receta base rinde ${M.unidades(M.porciones(r))} ${r.unidad === 'g' ? 'g' : 'un'}${esPan && M.panadero(r).ajustable ? ` con ${M.gramos(M.panadero(r).harina)} de harina` : ''}.</span>
      <div class="lista-mini">${e.filas.map(x => filaIng(x, esPan)).join('')}
      <div class="fila" style="font-weight:600;border-top:1px solid var(--linea);padding-top:6px"><span>Total</span><span>${M.gramos(e.total)}</span></div></div>
    </div>
    ${pasos.length || r.procedimiento ? `<div class="caja"><span class="rotulo">Pasos</span>${pasos.length ? `<ol class="pasos" style="padding-left:20px">${pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>` : `<p class="texto-proc" style="padding:0">${esc(r.procedimiento)}</p>`}</div>` : ''}`;
}

// ═══════════════ Acciones ═══════════════
$('principal').addEventListener('click', async ev => {
  const b = ev.target.closest('button'); if (!b) return;
  const ds = b.dataset;
  if (ds.dia) { E.fecha = ds.dia === 'hoy' ? M.hoyTxt() : M.sumarDias(E.fecha, Number(ds.dia)); pintar(); return; }
  if (ds.semana) { E.lunesPlan = ds.semana === 'hoy' ? M.lunesDe(M.hoyTxt()) : M.sumarDias(E.lunesPlan, Number(ds.semana)); pintar(); return; }
  if (ds.hecho) {
    b.disabled = true;
    guardarSinEsperar(guardarDia(E.fecha, { hechos: { [ds.hecho]: ds.valor === '1' ? { por: quien(), en: ahoraIso() } : null } }));
    return;
  }
  if (ds.tandas) { dialogoTandas(ds.tandas); return; }
  if (ds.ajustar) { dialogoAjuste(ds.ajustar); return; }
  if (ds.accion === 'agregar') {
    const id = $('agregar-receta').value; if (!id) { avisar('Elige una receta.', true); return; }
    (E.filasNuevas[E.lunesPlan] = E.filasNuevas[E.lunesPlan] || []).push(id); pintar();
    const el = $(`c-${id}-0`); if (el) el.focus();
    return;
  }
  if (ds.accion === 'copiar') { b.disabled = true; await copiarSemanaAnterior(); b.disabled = false; return; }
  if (ds.receta) { E.recetaVista = ds.receta; E.cantidadVista = null; pintar(); return; }
  if (ds.volver) { E.recetaVista = null; pintar(); return; }
});
$('principal').addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset.celda) {
    const k = t.id; clearTimeout(tiempos[k]);
    t.classList.toggle('error-celda', !/^\s*\d*\s*$/.test(t.value));   // se marca al tiro si no es un número
    tiempos[k] = setTimeout(() => guardarCelda(t.dataset.celda, Number(t.dataset.d), t.value), 700);
  }
  if (t.id === 'notas-dia') { clearTimeout(tiempos.notas); const f = E.fecha; tiempos.notas = setTimeout(() => guardarSinEsperar(guardarDia(f, { notas: { texto: t.value.slice(0, 2000), por: quien(), en: ahoraIso() } })), 900); }
  if (t.id === 'buscar-receta') { E.buscar = t.value; repintar(); }
  if (t.id === 'cant-receta') { const v = M.num(t.value); if (v > 0) { E.cantidadVista = v; repintar(); } }
});
// Al salir de una celda se guarda si cambió (focusout también corre cuando la pantalla se repintó mientras se escribía)
$('principal').addEventListener('focusout', ev => {
  const t = ev.target;
  if (!t.dataset || !t.dataset.celda) return;
  clearTimeout(tiempos[t.id]);
  const plan = E.planes[E.lunesPlan] || {}, actual = M.num(((plan.filas || {})[t.dataset.celda] || {})['d' + t.dataset.d]);
  if (!/^\s*\d*\s*$/.test(t.value) || Math.round(M.num(t.value)) !== actual) guardarCelda(t.dataset.celda, Number(t.dataset.d), t.value);
});

// ── Diálogos ──
// Los campos no se redibujan al escribir (así "25000" o "72,5" se escriben normal): solo cambian los
// gramos y avisos de al lado. Al guardar se escribe en el equipo y se cierra al tiro; la base se
// pone al día sola (también sin conexión).
const enCampo = v => String(Math.round(M.num(v) * 100) / 100).replace('.', ',');
function guardarSinEsperar(promesa, ok) {
  promesa.then(() => { if (ok) avisar(ok); }).catch(e => avisar('No se guardó: ' + mensajeError(e), true));
}

// ── Diálogo: tandas ──
// En 1 a 6 tandas, o "de hasta N" (unidades, o kg si va en gramos). Cada tanda se puede corregir a mano.
// "Dividir siempre así" lo guarda en la receta para los próximos días (ajustes/{AREA}_{receta}.tandaUsual).
function dialogoTandas(clave) {
  const T = E.tarjetas && E.tarjetas[clave]; if (!T) return;
  const total = T.total, enG = T.unidad === 'g';
  const fmt = x => enG ? M.gramos(x) : M.unidades(x) + ' un';
  const usualPrev = T.rid ? ((E.ajustes[T.rid] || {}).tandaUsual || null) : null;
  let t = T.tandas.slice();
  let modo = usualPrev ? { ...usualPrev } : t.length > 1 ? { modo: 'n', valor: t.length } : null;
  const d = $('dialogo');
  const lista = () => {
    $('t-lista').innerHTML = t.map((x, i) => `<div class="fila-aj"><label for="t-${i}">Tanda ${i + 1}</label><input id="t-${i}" data-t="${i}" inputmode="decimal" value="${enCampo(x)}"><span class="gr" id="t-g-${i}"></span></div>`).join('');
    d.querySelectorAll('[data-n]').forEach(b => b.setAttribute('aria-pressed', String(t.length === Number(b.dataset.n) && !(modo && modo.modo === 'cada'))));
    estado();
  };
  const estado = () => {
    const suma = M.sumaTandas(t), ok = Math.abs(suma - total) < (enG ? 1 : 0.001);
    const el = $('t-estado'); el.className = ok ? 'ayuda' : 'error';
    el.textContent = ok ? `Suman ${fmt(suma)}.` : `Suman ${fmt(suma)} de ${fmt(total)}.`;
    $('t-guardar').disabled = !ok;
    t.forEach((x, i) => { const g = $('t-g-' + i); if (g) g.textContent = M.gramos(T.escalar(x).total); });
  };
  d.innerHTML = `<form method="dialog" class="dlg" id="f-tandas">
      <h2>Tandas · ${esc(T.nombre)}</h2>
      <p class="ayuda">Total del día: <b>${fmt(total)}</b>. Cada tanda muestra su receta escalada${T.aj ? ', con el ajuste de harina/agua de hoy' : ''}. La dupla las ve al instante.</p>
      <div class="botones-n" role="group" aria-label="Cantidad de tandas">${[1, 2, 3, 4, 5, 6].map(n => `<button type="button" class="btn-sec" data-n="${n}" aria-pressed="false">${n} ${n === 1 ? 'tanda' : 'tandas'}</button>`).join('')}</div>
      <div class="fila-aj"><label for="t-cada">O tandas de hasta<small>${enG ? 'Kilos de masa por tanda' : 'Unidades por tanda (por ejemplo, lo que cabe en la amasadora)'}</small></label><input id="t-cada" inputmode="decimal" value="${modo && modo.modo === 'cada' ? enCampo(enG ? modo.valor / 1000 : modo.valor) : ''}"><span class="gr">${enG ? 'kg' : 'un'}</span></div>
      <div class="filas-aj" id="t-lista"></div>
      <div id="t-estado" role="status"></div>
      ${T.rid ? `<label class="check"><input type="checkbox" id="t-siempre" ${usualPrev ? 'checked' : ''}> Dividir siempre así ${esc(T.nombre)} (también los próximos días)</label>` : ''}
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1" id="t-guardar">Guardar tandas</button></div>
    </form>`;
  lista(); d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.n) { const n = Number(b.dataset.n); t = M.dividir(total, n); modo = { modo: 'n', valor: n }; $('t-cada').value = ''; lista(); return; }
    if (b.dataset.cerrar) { d.close(); return; }
    if (b.dataset.guardar && !b.disabled) {
      d.close();
      guardarSinEsperar(guardarDia(E.fecha, { tandas: { [clave]: t.length > 1 ? t : null } }), 'Tandas guardadas.');
      const siempre = $('t-siempre') && $('t-siempre').checked;
      if (T.rid && (siempre || usualPrev)) {
        const nuevo = siempre && modo && !(modo.modo === 'n' && modo.valor <= 1) ? { modo: modo.modo, valor: modo.valor, por: quien(), en: ahoraIso() } : null;
        const datos = { area: E.area, recetaId: T.rid, tandaUsual: nuevo };
        if (!E.ajustes[T.rid]) datos.periodos = [];
        guardarSinEsperar(setDoc(doc(db, 'ajustes', `${E.area}_${T.rid}`), datos, { merge: true }));
      }
    }
  };
  d.oninput = ev => {
    const el = ev.target;
    if (el.id === 't-cada') {
      const v = M.num(el.value) * (enG ? 1000 : 1);
      if (v > 0) { const n = Math.max(1, Math.ceil(total / v - 1e-9)); t = M.dividir(total, Math.min(n, 30)); modo = { modo: 'cada', valor: v }; }
      lista(); return;
    }
    const i = el.dataset.t; if (i === undefined) return;
    t[Number(i)] = M.num(el.value); modo = { modo: 'n', valor: t.length }; $('t-cada').value = ''; estado();
  };
}

// ── Diálogo: ajuste de harina / agua ──
// ajustes/{AREA}_{receta} guarda períodos; el último que cubre un día es el que vale ese día
// (un "solo este día" encima de uno largo no lo borra). "Quitar" termina todo desde ese día.
function dialogoAjuste(rid) {
  const r = E.recetas.find(x => x.id === rid); if (!r) return;
  const f = E.fecha, doc0 = E.ajustes[rid], vig = vigenteDe(doc0, f);
  // % panadero: los de la receta, o calculados de los gramos si la receta no los trae (masa madre…)
  const P = M.panadero(r), orig = P.harina;
  const harinas = (r.ingredientes || []).filter(i => /^harina/i.test(i.nombre));
  const ingsPct = (r.ingredientes || []).filter(i => P.pct(i) > 0 && !(harinas.length === 1 && harinas[0] === i));
  const pctOrig = i => Math.round(P.pct(i) * 100) / 100;
  const esSubR = r.tipo === 'sub_receta';
  let harina = vig && M.num(vig.harina) > 0 ? M.num(vig.harina) : orig;
  const pct = {}; ingsPct.forEach(i => { pct[i.id] = vig && vig.pct && vig.pct[i.id] !== undefined ? M.num(vig.pct[i.id]) : pctOrig(i); });
  let vigencia = vig ? (vig.hasta === vig.desde ? 'dia' : 'seguir') : 'dia';   // uno nuevo parte "solo este día"
  const d = $('dialogo');
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>Ajustar harina / agua · ${esc(r.nombre)}</h2>
      <p class="ayuda">Para cuando llega una harina que absorbe distinto. La receta original no cambia: el ajuste vale para las tarjetas, las tandas, las elaboraciones previas y los insumos.${esSubR ? (r.unidad !== 'g' ? ' Se mantiene la harina de cada unidad: con más agua, la masa pesa un poco más.' : ' Se mantienen los kilos que piden los panes; cambian las proporciones.') : ''}${P.calculado ? ' Los % se calculan de los gramos de la receta.' : ''}</p>
      <div class="filas-aj">
        <div class="fila-aj"><label for="aj-harina">Harina base (100 %)<small>Receta: ${M.gramos(orig)}</small></label><input id="aj-harina" inputmode="decimal" value="${enCampo(harina)}"><span class="gr">g</span></div>
        ${ingsPct.map(i => `<div class="fila-aj"><label for="aj-${esc(i.id)}">${esc(i.nombre)}<small>Receta: ${M.unidades(pctOrig(i))} %</small></label><input id="aj-${esc(i.id)}" data-pct="${esc(i.id)}" inputmode="decimal" value="${enCampo(pct[i.id])}"><span class="gr" id="aj-g-${esc(i.id)}"></span></div>`).join('')}
      </div>
      <fieldset class="opciones" style="border:0;padding:0;margin:0"><legend class="rotulo">¿Hasta cuándo?</legend>
        <label><input type="radio" name="vig" value="dia" ${vigencia === 'dia' ? 'checked' : ''}>Solo el ${esc(M.fechaCorta(f))}</label>
        <label><input type="radio" name="vig" value="seguir" ${vigencia === 'seguir' ? 'checked' : ''}>Desde el ${esc(M.fechaCorta(f))}, hasta que lo quite (por ejemplo, mientras dure esta harina)</label>
      </fieldset>
      <div class="dlg-pie">${vig ? '<button type="button" class="btn-sec izq" data-quitar="1">Quitar ajuste</button>' : ''}<button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">Guardar ajuste</button></div>
    </form>`;
  const marcar = () => {
    const h = $('aj-harina'); h.classList.toggle('cambiado', Math.abs(harina - orig) > 0.1);
    ingsPct.forEach(i => { const el = $('aj-' + i.id), g = $('aj-g-' + i.id); if (el) el.classList.toggle('cambiado', Math.abs(pct[i.id] - pctOrig(i)) > 0.001); if (g) g.textContent = M.gramos(harina * pct[i.id] / 100); });
  };
  marcar(); d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.oninput = ev => {
    const t = ev.target;
    if (t.id === 'aj-harina') harina = M.num(t.value);
    else if (t.dataset.pct) pct[t.dataset.pct] = M.num(t.value);
    else if (t.name === 'vig') vigencia = t.value;
    marcar();
  };
  d.onchange = ev => { if (ev.target.name === 'vig') vigencia = ev.target.value; };
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    const ref = doc(db, 'ajustes', `${E.area}_${rid}`);
    const periodos = ((doc0 && doc0.periodos) || []).map(x => ({ ...x }));
    const terminarDesde = lista => lista.filter(x => x.desde < f).map(x => (!x.hasta || x.hasta >= f) ? { ...x, hasta: M.sumarDias(f, -1) } : x);
    if (b.dataset.quitar) {
      d.close();
      guardarSinEsperar(setDoc(ref, { area: E.area, recetaId: rid, periodos: recortar(terminarDesde(periodos)), quitado: { por: quien(), en: ahoraIso(), desde: f } }, { merge: true }), 'Ajuste quitado: vuelve a la receta original.');
      return;
    }
    if (b.dataset.guardar) {
      if (!(harina > 0) || Object.values(pct).some(v => !(v >= 0 && v < 1000))) { avisar('Revisa los números: la harina debe ser mayor que 0 y los % entre 0 y 999.', true); return; }
      const cambios = {}; ingsPct.forEach(i => { if (Math.abs(pct[i.id] - pctOrig(i)) > 0.001) cambios[i.id] = pct[i.id]; });
      const cambiaHarina = Math.abs(harina - orig) > 0.1;
      if (!cambiaHarina && !Object.keys(cambios).length) { if (vig) b.closest('form').querySelector('[data-quitar]').click(); else d.close(); return; }
      const nuevo = { harina: cambiaHarina ? harina : null, pct: cambios, desde: f, hasta: vigencia === 'dia' ? f : null, por: quien(), en: ahoraIso() };
      // "Hasta que lo quite" reemplaza lo que venía desde ese día; "solo este día" va encima sin borrar lo demás
      const base = vigencia === 'dia' ? periodos : terminarDesde(periodos);
      d.close();
      guardarSinEsperar(setDoc(ref, { area: E.area, recetaId: rid, periodos: recortar([...base, nuevo]), quitado: null }, { merge: true }), 'Ajuste guardado.');
    }
  };
}
// Se guardan hasta 30 períodos (los más viejos que ya terminaron se van primero)
function recortar(lista) { return lista.slice(-30); }
