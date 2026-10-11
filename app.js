// ═══════════════════════════════════════════════
//  fën · Cocina — la app de las jefas  v0.10.0
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
//  v0.1.2: el ajuste muestra el peso por pieza y sugiere la harina base que lo mantiene.
//  v0.2.0 (P2a): Bollería entra a la app nueva: Metas de la semana → masas base y empastes que
//  se elaboran la semana anterior (Masas), con tandas según la amasadora, y Hoy con las masas del día.
//  v0.3.0 (P2b): Bitácora de Bollería (inventario, masas elaboradas y descongeladas, formado y horneado),
//  stock congelado que sale de ella, avance contra la meta y cierre del viernes para imprimir.
//  v0.4.0 (P3): Panadería y Bollería crean y editan recetas (editor.js): cada cambio es una propuesta
//  que aprueba Administración en Sistema Fën; "Llevar a la receta" desde el ajuste; pedir materias primas.
//  v0.5.0 (P4a): Pastelería entra a la app nueva: Hoy con sus recetas del día (sin plan semanal: cuánto se
//  sugiere para la semana según lo que planificaron Bollería y Panadería, cuánto llevan, y cuánto hacen hoy).
//  v0.10.0: lo que Administración configura con envase (saco de 25 kg…) se cuenta y se recibe en sacos + lo suelto,
//  y el stock también se ve en sacos.
//  v0.9.0: al contar la bodega se ve quién contó cada materia prima la última vez, y avisa si otra área ya la
//  contó hoy (conteosmp/{mpId}, reglas v1.6.0).
//  v0.8.0: Cafetería crea y edita sus recetas aquí (como las otras áreas) y su consumo entra a la bodega
//  (lo vendido en la caja + el café de la bitácora de turno; lo calcula Sistema Fën).
//  v0.7.0 (P5): Bodega en las cuatro áreas: "Llegó mercadería" y "Conteo de bodega" de las materias primas
//  críticas (bodega común: lo que cuenta un área vale para todas). El stock y las alertas los calcula Sistema Fën
//  con lo hecho en Cocina; aquí se ve lo que está bajo el mínimo.
//  v0.6.0 (P4b): Merma en las cuatro áreas (sin precios; Sistema Fën la valoriza) y Cafetería entra a la app
//  nueva con su Bitácora de turno (calibración, café botado, pruebas). Ambas se copian solas a la planilla.
//  En Bollería, la merma marcada "se perdió congelado" baja el stock congelado (la que no, no: ya había salido).
//  v0.5.1: una tablet puede entrar a más de un área (la cuenta tiene "areas"): botón "Cambiar de área".
//  Antes de cambiar se guarda lo pendiente; en cada área se pide el PIN de una persona de esa área.
// ═══════════════════════════════════════════════
import {
  auth, db, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence,
  collection, doc, getDoc, setDoc, query, where, onSnapshot, serverTimestamp
} from './firebase.js?v=0.10.0';
import * as M from './modelo.js?v=0.10.0';
import * as B from './bolleria.js?v=0.10.0';
import * as ED from './editor.js?v=0.10.0';
import * as R from './registros.js?v=0.10.0';
import * as K from './consumo.js?v=0.10.0';

const C = window.FEN_COCINA;
const AREAS = {
  PAN: { nombre: 'Panadería', icono: 'pan', nueva: true },
  BOL: { nombre: 'Bollería', icono: 'croissant', nueva: true },
  PAS: { nombre: 'Pastelería', icono: 'torta', nueva: true },
  CAF: { nombre: 'Cafetería', icono: 'cafe', nueva: true }
};
const ESTADOS = { consolidada: 'Aprobada', en_prueba: 'En prueba', borrador: 'Borrador', 'pendiente_aprobación': 'En revisión', pendiente_aprobacion: 'En revisión' };
const K_PERSONA = 'fen_cocina_persona', K_AREA = 'fen_cocina_area';
// Secciones de cada área (las que no están, solo Recetas)
const SECCIONES = {
  PAN: [['hoy', 'Hoy', 'hoy'], ['plan', 'Planificación', 'plan'], ['merma', 'Merma', 'merma'], ['bodega', 'Bodega', 'bodega'], ['recetas', 'Recetas', 'libro']],
  BOL: [['hoy', 'Hoy', 'hoy'], ['bitacora', 'Bitácora', 'bitacora'], ['metas', 'Metas', 'meta'], ['masas', 'Masas', 'capas'], ['merma', 'Merma', 'merma'], ['bodega', 'Bodega', 'bodega'], ['recetas', 'Recetas', 'libro']],
  PAS: [['hoy', 'Hoy', 'hoy'], ['merma', 'Merma', 'merma'], ['bodega', 'Bodega', 'bodega'], ['recetas', 'Recetas', 'libro']],
  CAF: [['turno', 'Bitácora de turno', 'bitacora'], ['merma', 'Merma', 'merma'], ['bodega', 'Bodega', 'bodega'], ['recetas', 'Recetas', 'libro']]
};
const seccionesDe = a => SECCIONES[a] || [['recetas', 'Recetas', 'libro']];

const E = {
  usuario: null, area: null, areas: [], persona: null,
  recetas: [], mps: [], config: {}, personas: [], ajustes: {},
  planes: {}, dias: {}, cargado: {}, escuchas: {},
  metas: {}, diasArea: {}, ajenos: {}, propuestas: {}, solicitudes: {}, editor: null, lunesMeta: M.sumarDias(M.lunesDe(M.hoyTxt()), 7), periodoMerma: 'semana', periodoTurno: 'hoy', stockmp: {}, conteosmp: {},
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
  pasos: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  meta: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12h.01"/>',
  bitacora: '<path d="M6 4h11a1 1 0 0 1 1 1v15H7a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  copo: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>',
  merma: '<path d="M5 7h14M10 4h4M7 7l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12"/><path d="M10 11v5M14 11v5"/>',
  bodega: '<path d="M4 9l8-5 8 5v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M8 20v-7h8v7M8 16h8"/>',
  imprimir: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 14h10v6H7z"/>'
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
  if (guardada && guardada.uid === u.uid && AREAS[guardada.area]) { E.areas = Array.isArray(guardada.areas) ? guardada.areas : [guardada.area]; entrarArea(guardada.area); }
  try {
    const sn = await getDoc(doc(db, 'cuentas', u.uid));
    const areas = sn.exists() ? areasDeCuenta(sn.data()) : [];
    // Vuelve al área en que quedó la tablet, si la cuenta todavía la tiene; si no, a la principal
    const area = guardada && guardada.uid === u.uid && areas.includes(guardada.area) ? guardada.area : areas[0];
    E.areas = areas; pintarBotonArea();
    if (!AREAS[area]) {
      guardarLS(K_AREA, null); mostrar('v-autorizar');
      $('a-error').textContent = 'Esta cuenta no tiene un área asignada. Se asigna en Sistema Fën → Producción → Cuentas de las áreas.';
      await signOut(auth); return;
    }
    guardarLS(K_AREA, { uid: u.uid, area, areas });
    if (area !== E.area) { if (E.area) antesDeSalirDelArea(); entrarArea(area); }
  } catch (e) {
    if (!E.area) { mostrar('v-autorizar'); $('a-error').textContent = 'No se pudo leer el área de esta cuenta: ' + mensajeError(e); }
  }
});

// Áreas de la cuenta: la principal (area) primero y después las de "areas" (Sistema Fën → Cuentas de las áreas)
function areasDeCuenta(c) { return [...new Set([c && c.area, ...((c && Array.isArray(c.areas)) ? c.areas : [])])].filter(a => AREAS[a]); }
function pintarBotonArea() {
  const b = $('btn-area'); if (!b) return;
  b.classList.toggle('oculto', E.areas.length < 2);
}
// Lo que está por guardarse se guarda en el área en que se escribió, antes de cambiar
function antesDeSalirDelArea() {
  const a = document.activeElement; if (a && a.blur && $('principal').contains(a)) a.blur();   // focusout guarda celdas y cantidades
  const n = $('notas-dia');
  if (tiempos.notas && n) guardarSinEsperar(guardarDia(E.fecha, { notas: { texto: n.value.slice(0, 2000), por: quien(), en: ahoraIso() } }));
  Object.values(tiempos).forEach(t => clearTimeout(t)); tiempos = {};
  if (E.editor) ED.cerrarEditor();
  const dlg = $('dialogo'); if (dlg.open) dlg.close();
  if (E.planilla.t) { clearTimeout(E.planilla.t); E.planilla.t = 0; pasarPlanilla(E.area); }   // el plan cambiado pasa a la planilla de su área
  const rg = reg(); if (rg.t) { clearTimeout(rg.t); rg.t = 0; pasarRegistros(E.area); }
}
function dialogoArea() {
  const d = $('dialogo');
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>Cambiar de área</h2>
      <p class="ayuda">Lo que estabas escribiendo queda guardado en ${esc(AREAS[E.area].nombre)}. En el área nueva se pide el PIN de una persona de esa área (si ${E.persona ? esc(E.persona.nombre) + ' también es de ella, sigue' : 'ya estaba alguien, sigue'}).</p>
      <div class="lista-areas">${E.areas.map(a => `<button type="button" class="btn-area-op" data-ir-area="${a}" ${a === E.area ? 'aria-current="true"' : ''}>${ic(AREAS[a].icono)}<span>${esc(AREAS[a].nombre)}</span>${a === E.area ? '<small>Aquí estás</small>' : ''}</button>`).join('')}</div>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button></div>
    </form>`;
  d.onsubmit = ev => ev.preventDefault();
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (b.dataset.irArea) { d.close(); cambiarArea(b.dataset.irArea); }
  };
  d.showModal();
}
function cambiarArea(area) {
  if (!AREAS[area] || !E.areas.includes(area) || area === E.area) return;
  antesDeSalirDelArea();
  // La persona sigue si también es de la otra área; si no, se pide el PIN ahí
  const p = E.persona, reg = p && E.personas.find(x => x.id === p.email || (x.email && x.email === p.email));
  if (p && p.hasta > Date.now() && reg && (reg.areas || []).includes(area)) guardarLS(K_PERSONA, { ...p, area });
  guardarLS(K_AREA, { uid: E.usuario.uid, area, areas: E.areas });
  location.hash = '#hoy';
  entrarArea(area);
}
$('btn-area').addEventListener('click', dialogoArea);

function entrarArea(area) {
  E.area = area; E.recetaVista = null; E.cantidadVista = null; E.buscar = ''; E.editor = null;
  E.fecha = M.hoyTxt(); E.lunesPlan = M.lunesDe(E.fecha); E.lunesMeta = M.sumarDias(E.lunesPlan, 7);   // cada área parte en hoy
  E.pin = { email: '', digitos: '', enviando: false, error: '' };
  document.body.dataset.area = area; pintarBotonArea();
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
      ${E.areas.length > 1 ? `<button type="button" class="btn-link" data-pin-area="1">Cambiar de área</button>` : ''}
    </div>`;
}
$('v-pin').addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  const P = E.pin;
  if (b.dataset.pinArea) { dialogoArea(); return; }
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
  const body = JSON.stringify({ area: E.area, ...cuerpo, idToken: token });   // el área en que está la tablet (cuentas con varias áreas)
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
function escuchar(clave, ref, cb, alFallar) {
  if (E.escuchas[clave]) return;
  E.escuchas[clave] = onSnapshot(ref, cb, err => {
    delete E.escuchas[clave];
    if (alFallar && alFallar(err) === 'silencio') return;
    if (/permission-denied/.test(err.code || '')) avisar('Este equipo perdió el permiso para leer. Pide a Administración que revise la cuenta del área.', true);
  });
}
function pararEscuchas() { Object.values(E.escuchas).forEach(f => { try { f(); } catch (e) {} }); E.escuchas = {}; E.planes = {}; E.dias = {}; E.metas = {}; E.ajenos = {}; E.propuestas = {}; E.solicitudes = {}; E.editor = null; E.cargado = {}; }
function iniciarEscuchas() {
  pararEscuchas();
  escuchar('recetas', collection(db, 'recetas'), sn => { E.recetas = sn.docs.map(d => ({ id: d.id, ...d.data() })); E.cargado.recetas = true; repintar(); });
  escuchar('mps', collection(db, 'mps'), sn => { E.mps = sn.docs.map(d => ({ id: d.id, ...d.data() })); E.cargado.mps = true; repintar(); });
  escuchar('config', doc(db, 'config', E.area), sn => { E.config = sn.exists() ? sn.data() : {}; E.cargado.config = true; repintar(); });
  escuchar('stockmp', collection(db, 'stockmp'), sn => { E.stockmp = {}; sn.docs.forEach(d => { E.stockmp[d.id] = d.data(); }); E.cargado.stockmp = true; repintar(); },
    () => { E.stockmp = {}; E.cargado.stockmp = true; repintar(); return 'silencio'; });   // sin las reglas v1.5.0: se usa lo de la planilla (sin avisar)
  escuchar('conteosmp', collection(db, 'conteosmp'), sn => { E.conteosmp = {}; sn.docs.forEach(d => { E.conteosmp[d.id] = d.data(); }); repintar(); },
    () => { E.conteosmp = {}; return 'silencio'; });   // sin las reglas v1.6.0: el conteo funciona igual, sin el aviso
  escuchar('personas', collection(db, 'personas'), sn => {
    E.personas = sn.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.activa !== false); E.cargado.personas = true;
    if (!$('v-pin').classList.contains('oculto')) pintarPin();
  });
  // Recetas propuestas y materias primas pedidas (las áreas que editan recetas)
  if (ED.AREAS_EDITAN.includes(E.area)) {
    escuchar('propuestas', query(collection(db, 'propuestas'), where('area', '==', E.area)), sn => { E.propuestas = {}; sn.docs.forEach(d => { const x = d.data(); E.propuestas[x.pid] = { ...x, id: x.pid }; }); E.cargado.propuestas = true; ED.alCambiarPropuestas(); repintar(); });
    escuchar('solicitudes', query(collection(db, 'solicitudes'), where('area', '==', E.area)), sn => { E.solicitudes = {}; sn.docs.forEach(d => { const x = d.data(); E.solicitudes[x.id] = x; }); repintar(); });
  }
  // Todos los días del área: la bitácora de Bollería arma el stock congelado; la merma y la bitácora de
  // Cafetería se ven por semana o mes. Lo que quedó sin copiar a la planilla se copia.
  escuchar('diasArea', query(collection(db, 'dias'), where('area', '==', E.area)), sn => {
    E.diasArea = {}; sn.docs.forEach(d => { const x = d.data(); if (x.fecha) E.diasArea[x.fecha] = x; }); E.cargado.diasArea = true; repintar(); revisarRegistros();
  });
  escuchar('ajustes', query(collection(db, 'ajustes'), where('area', '==', E.area)), sn => {
    E.ajustes = {}; sn.docs.forEach(d => { const a = d.data(); E.ajustes[a.recetaId] = a; }); E.cargado.ajustes = true; repintar();
  });
}
function asegurarPlan(lunes) {
  escuchar('plan_' + lunes, doc(db, 'planes', `${E.area}_${lunes}`), sn => { E.planes[lunes] = sn.exists() ? sn.data() : { area: E.area, lunes, filas: {} }; repintar(); revisarPlanilla(); });
  return E.planes[lunes];
}
// Bollería: metas/{AREA}_{lunes de la semana de la meta} = { productos: {receta: piezas}, elaboracion: {masa: {d0..d4}} }
// (la elaboración es de la semana ANTERIOR: d0 = el lunes 7 días antes)
function asegurarMetas(lunes) {
  escuchar('metas_' + lunes, doc(db, 'metas', `${E.area}_${lunes}`), sn => { E.metas[lunes] = sn.exists() ? sn.data() : { area: E.area, lunes, productos: {}, elaboracion: {} }; repintar(); },
    // Sin permiso (reglas sin la colección metas): se muestra el aviso en vez de quedarse "Cargando…"
    () => { E.metas[lunes] = { area: E.area, lunes, productos: {}, elaboracion: {}, sinPermiso: true }; repintar(); });
  return E.metas[lunes];
}
// Documentos de otra área que se leen para las sugerencias (reglas v1.3.0: planes y metas se pueden leer entre áreas)
function asegurarAjeno(col, id) {
  const k = col + '/' + id;
  escuchar('ajeno_' + k, doc(db, col, id), sn => { E.ajenos[k] = sn.exists() ? sn.data() : {}; repintar(); }, () => { E.ajenos[k] = { sinPermiso: true }; repintar(); });
  return E.ajenos[k];
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
  const items = seccionesDe(E.area);
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
  if (E.lunesMeta === M.sumarDias(M.lunesDe(E.hoyVisto), 7)) E.lunesMeta = M.sumarDias(M.lunesDe(h), 7);
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
  if (!seccionesDe(E.area).some(x => x[0] === v)) { location.hash = '#' + seccionesDe(E.area)[0][0]; return; }
  $('barra-sub').textContent = v === 'plan' ? 'Planificación · semana ' + M.etiquetaSemana(E.lunesPlan) : v === 'recetas' ? 'Recetas'
    : v === 'bitacora' ? 'Bitácora · ' + M.fechaLarga(E.fecha) : v === 'merma' ? 'Merma · lo que se pierde' : v === 'bodega' ? 'Bodega · materias primas críticas' : v === 'turno' ? 'Bitácora de turno · ' + M.fechaLarga(M.hoyTxt()) : v === 'metas' ? 'Metas · semana ' + M.etiquetaSemana(E.lunesMeta) : v === 'masas' ? `Masas · se elaboran del ${M.fechaCorta(M.sumarDias(E.lunesMeta, -7))} al ${M.fechaCorta(M.sumarDias(E.lunesMeta, -3))}`
    : M.fechaLarga(E.fecha) + ' · semana ' + M.etiquetaSemana(M.lunesDe(E.fecha));
  main.innerHTML = v === 'recetas' && E.editor ? ED.vistaEditor() : v === 'plan' ? vistaPlan() : v === 'recetas' ? vistaRecetas() : v === 'metas' ? vistaMetas() : v === 'masas' ? vistaMasas() : v === 'bitacora' ? vistaBitacora() : v === 'merma' ? vistaMerma() : v === 'bodega' ? vistaBodega() : v === 'turno' ? vistaTurno() : E.area === 'BOL' ? vistaHoyBol() : E.area === 'PAS' ? vistaHoyPas() : vistaHoy();
  if (v === 'recetas' && E.editor) ED.actualizarCalculos();
  if (guardado && $(guardado.id)) {
    const el = $(guardado.id); el.value = guardado.valor; el.focus();
    if (el.dataset.celda || el.dataset.num) el.classList.toggle('error-celda', !/^\s*\d*\s*$/.test(el.value));
    try { el.setSelectionRange(guardado.ini, guardado.fin); } catch (e) {}
    if (v === 'recetas' && E.editor) ED.trasPintar(el);
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
  if (M.num(a.harina) > 0 && Math.abs(M.num(a.harina) - P.harina) > 0.1) { const gH = g => g >= 1000 ? M.gramos(g) : M.unidades(g) + ' g'; partes.push(`Harina base ${gH(a.harina)} (receta ${gH(P.harina)})`); }
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
function tandasHoy(clave, total, rid, enGramos, dia, defecto) {
  const guardadas = ((dia.tandas || {})[clave]) || null;
  const cuadran = guardadas && Math.abs(M.sumaTandas(guardadas) - total) < (enGramos ? 1 : 0.001);
  if (cuadran) return { tandas: M.tandasDe(guardadas, total) };
  if (guardadas && enGramos) return { tandas: M.reescalar(guardadas, total) };
  if (guardadas) return { tandas: [total], descuadre: guardadas };
  const usual = M.tandasUsual(rid && (E.ajustes[rid] || {}).tandaUsual, total);
  if (usual) return { tandas: usual, usual: true };
  return { tandas: defecto && defecto.length > 1 ? defecto : [total], defecto: !!(defecto && defecto.length > 1) };
}

// Tarjeta común de recetas y elaboraciones previas
function tarjeta(o) {
  const enG = o.unidad === 'g', h = o.hecho(o.claveHecho);
  const un = o.un || 'un', fmt = x => enG ? M.gramos(x) : M.unidades(x);
  const T = tandasHoy(o.clave, o.total, o.rid, enG, o.dia, o.defecto);
  E.tarjetas[o.clave] = { nombre: o.nombre, total: o.total, unidad: o.unidad, un, rid: o.rid, escalar: o.escalar, tandas: T.tandas, aj: o.aj, porTanda: o.porTanda };
  const columnas = T.tandas.map((t, i) => {
    const e = o.escalar(t);
    return `<div class="tanda">
        ${T.tandas.length > 1 ? `<span class="rotulo">Tanda ${i + 1} · ${enG ? M.gramos(t) : M.unidades(t) + ' ' + un}</span>` : ''}
        ${e.filas.map(x => filaIng(x, o.conPct)).join('')}
        <div class="fila total"><span>Total masa</span><span>${M.gramos(e.total)}</span></div>
      </div>`;
  }).join('');
  const pasos = o.receta ? (o.receta.pasos || []).filter(Boolean) : [], proc = o.receta && o.receta.procedimiento;
  return `<article class="receta ${o.elab ? 'elab' : ''} ${h ? 'terminada' : ''}" ${o.attr || (o.elab ? 'data-elab-card' : 'data-receta-card')}="${esc(o.idCard)}">
      <div class="receta-cab">
        <div style="display:flex;flex-direction:column;gap:4px;min-width:0">
          ${o.rotulo || o.elab ? `<span class="rotulo">${esc(o.rotulo || 'Elaboración previa')}</span>` : ''}
          <b>${esc(o.nombre)}</b>
          <span class="det">${o.detalle}${T.tandas.length > 1 ? ` · ${T.tandas.length} tandas (${T.tandas.map(fmt).join(' + ')})${T.usual ? ' · como siempre' : T.defecto ? ' · según la amasadora' : ''}` : ''}${h ? ` · terminada por ${esc(h.por)} a las ${esc(horaDe(h.en))}` : ''}</span>
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


// ═══════════════ Bollería ═══════════════
const avisoPermiso = () => `<div class="nota ojo">${ic('alerta')}<span>Este equipo no puede leer las metas de Bollería. Pide a Administración que publique las reglas de fen-produccion v1.1.0 o más nuevas (ver README).</span></div>`;
// Semana de la meta (lunes) → la elaboración de masas es la semana anterior (lun–vie)
const semanaElab = lunesMeta => M.sumarDias(lunesMeta, -7);
const recetaPorId = id => E.recetas.find(r => r.id === id);
function navMeta() {
  const l = E.lunesMeta;
  return `<div class="nav-fecha">
      <button type="button" class="btn-flecha" data-meta-sem="-7" aria-label="Semana anterior">${ic('izq')}</button>
      <h2>Meta del ${esc(M.etiquetaSemana(l))}</h2>
      <button type="button" class="btn-flecha" data-meta-sem="7" aria-label="Semana siguiente">${ic('der')}</button>
      ${l !== M.sumarDias(M.lunesDe(M.hoyTxt()), 7) ? '<button type="button" class="btn-sec" data-meta-sem="prox">La próxima</button>' : ''}
    </div>`;
}
// Un número guardado por celda (meta o masas de un día); lo mal escrito queda marcado
function campoNum(id, tipo, rid, d, valor, etiqueta) {
  const mala = E.celdasMalas[E.lunesMeta + '|' + id];
  return `<label class="sr" for="${esc(id)}">${esc(etiqueta)}</label><input id="${esc(id)}" inputmode="numeric" data-num="${tipo}" data-rid="${esc(rid)}"${d !== null ? ` data-d="${d}"` : ''} value="${mala !== undefined ? esc(mala) : (M.num(valor) || '')}" class="${mala !== undefined ? 'error-celda' : ''}" autocomplete="off">`;
}
function valorGuardado(t) {
  const m = E.metas[E.lunesMeta] || {};
  return t.dataset.num === 'meta' ? M.num((m.productos || {})[t.dataset.rid]) : M.num(((m.elaboracion || {})[t.dataset.rid] || {})['d' + t.dataset.d]);
}
function guardarNumero(t) {
  const lunes = E.lunesMeta, key = lunes + '|' + t.id, texto = t.value, rid = t.dataset.rid;
  if (!/^\s*\d*\s*$/.test(texto) || Math.round(M.num(texto)) > 99999) { E.celdasMalas[key] = texto; t.classList.add('error-celda'); avisar(t.dataset.num === 'meta' ? 'Escribe un número entero (piezas).' : 'Escribe un número entero (masas).', true); return; }
  delete E.celdasMalas[key]; t.classList.remove('error-celda'); t.classList.add('guardando');
  const n = Math.round(M.num(texto)), r = recetaPorId(rid);
  const datos = { area: E.area, lunes, nombres: { [rid]: r ? r.nombre : rid }, actualizado: { por: quien(), en: serverTimestamp() } };
  if (t.dataset.num === 'meta') datos.productos = { [rid]: n }; else datos.elaboracion = { [rid]: { ['d' + t.dataset.d]: n } };
  const id = t.id;
  setDoc(doc(db, 'metas', `${E.area}_${lunes}`), datos, { merge: true })
    .then(() => { const el = $(id); if (el) el.classList.remove('guardando'); })
    .catch(e => { const el = $(id); if (el) { el.classList.remove('guardando'); el.classList.add('error-celda'); } avisar('No se guardó: ' + mensajeError(e), true); });
}

function vistaMetas() {
  if (!E.cargado.recetas || !E.cargado.mps) return '<div class="vacio">Cargando…</div>';
  const m = asegurarMetas(E.lunesMeta);
  if (!m) return navMeta() + '<div class="vacio">Cargando la meta…</div>';
  if (m.sinPermiso) return navMeta() + avisoPermiso();
  const c = ctx(), metas = m.productos || {};
  const prods = B.productos(E.recetas, c).filter(p => p.receta.estado === 'consolidada' || M.num(metas[p.receta.id]) > 0);
  const nec = B.necesidades(metas, c, E.config);
  const sinMasa = E.recetas.filter(r => r.area === E.area && r.tipo !== 'sub_receta' && r.estado === 'consolidada' && !prods.some(p => p.receta.id === r.id));
  const enPrueba = B.productos(E.recetas, c).filter(p => p.receta.estado !== 'consolidada' && !(M.num(metas[p.receta.id]) > 0));
  const el = semanaElab(E.lunesMeta);
  const filas = prods.map(p => {
    const n = M.num(metas[p.receta.id]);
    return `<tr><td class="nombre">${esc(p.receta.nombre)}${p.receta.estado !== 'consolidada' ? ` <span class="estado">${esc(ESTADOS[p.receta.estado] || p.receta.estado)}</span>` : ''}<small>${esc(p.masa.nombre)} · 1 masa rinde ${M.unidades(1 / p.masas)}</small></td>
      <td>${campoNum('m-' + p.receta.id, 'meta', p.receta.id, null, n, 'Meta de ' + p.receta.nombre)}</td>
      <td class="num">${n ? M.unidades(n * p.masas) : '—'}</td></tr>`;
  }).join('');
  const resumen = nec.masas.map(x => `<div class="caja">
      <span class="rotulo">${esc(x.masa.nombre)}</span>
      <span class="grande num">${M.miles(x.masas)} masas</span>
      <span class="ayuda">${M.gramos(x.kg * 1000)} de masa${x.merma ? ` · incluye ${M.unidades(x.merma)} % de merma de laminado` : ''}${Math.abs(x.masas - x.exactas) > 0.001 ? ` · exactas ${M.unidades(x.exactas)}, se redondea a masas enteras` : ''}</span>
      ${x.empastes ? `<div class="fila sub"><span>${esc(x.empaste ? x.empaste.nombre : 'Empaste')}</span><span>${M.miles(x.empastes)} de ${M.gramos(x.gPorEmpaste)} · ${M.gramos(x.empastes * x.gPorEmpaste)}</span></div>` : ''}
      <div class="lista-mini">${x.productos.map(p => `<div class="fila sub"><span>${esc(p.receta.nombre)} · ${M.miles(p.piezas)}</span><span>${M.unidades(p.masas)} masas</span></div>`).join('')}</div>
    </div>`).join('');
  return navMeta() + `
    <p class="ayuda">Las piezas que quieren tener esta semana. De aquí salen las masas base y los empastes que se elaboran y congelan <b>del ${esc(M.fechaCorta(el))} al ${esc(M.fechaCorta(M.sumarDias(el, 4)))}</b> (semana anterior). Cada número se guarda solo y la dupla lo ve al instante.</p>
    ${nec.avisos.map(a => `<div class="nota ojo">${ic('alerta')}<span>${esc(a)}</span></div>`).join('')}
    <div class="tabla-caja"><table class="plan metas">
      <thead><tr><th scope="col">Producto</th><th scope="col">Meta (piezas)</th><th scope="col">Masas</th></tr></thead>
      <tbody>${filas || '<tr><td colspan="3" style="text-align:left;color:var(--suave);padding:18px 10px">No hay productos aprobados que lleven una masa base.</td></tr>'}</tbody>
    </table></div>
    ${resumen ? `<h2 class="titulo">Hay que elaborar</h2><section class="resumen">${resumen}</section><p class="ayuda"><a href="#masas">Repartir las masas en los días →</a></p>` : ''}
    ${enPrueba.length ? `<p class="ayuda">En prueba (no se ofrecen para metas hasta que se aprueben): ${esc(enPrueba.map(p => p.receta.nombre).join(', '))}.</p>` : ''}
    ${sinMasa.length ? `<p class="ayuda">No entran a las metas porque no llevan una masa base: ${esc(sinMasa.map(r => r.nombre).join(', '))}.</p>` : ''}`;
}

function vistaMasas() {
  if (!E.cargado.recetas || !E.cargado.mps) return '<div class="vacio">Cargando…</div>';
  const m = asegurarMetas(E.lunesMeta);
  if (!m) return navMeta() + '<div class="vacio">Cargando…</div>';
  if (m.sinPermiso) return navMeta() + avisoPermiso();
  const c = ctx(), nec = B.necesidades(m.productos || {}, c, E.config), elab = m.elaboracion || {};
  const el = semanaElab(E.lunesMeta), hoy = M.hoyTxt();
  const ids = [...new Set([...nec.masas.map(x => x.masa.id), ...Object.keys(elab).filter(id => B.sumaDias(elab[id]) > 0)])];
  const filas = ids.map(id => { const x = nec.masas.find(y => y.masa.id === id); return { id, masa: x ? x.masa : recetaPorId(id), nec: x }; }).filter(x => x.masa)
    .sort((a, b) => a.masa.nombre.localeCompare(b.masa.nombre, 'es'));
  const dias = [0, 1, 2, 3, 4];
  const porTandaDe = masa => B.masasPorTanda(masa, E.config), tpd = B.tandasPorDia(E.config);
  const cuerpo = filas.map(x => {
    const plan = elab[x.id] || {}, hecho = B.sumaDias(plan), necesarias = x.nec ? x.nec.masas : 0, dif = necesarias - hecho;
    const estado = !necesarias && !hecho ? '' : dif > 0 ? `<span class="chip ojo">Faltan ${M.miles(dif)}</span>` : dif < 0 ? `<span class="chip">Sobran ${M.miles(-dif)}</span>` : '<span class="chip ok">Completo</span>';
    return `<tr data-masa="${esc(x.id)}"><td class="nombre">${esc(x.masa.nombre)}<small>${M.miles(necesarias)} necesarias · ${porTandaDe(x.masa)} por tanda</small></td>
      ${dias.map(d => `<td class="${M.sumarDias(el, d) === hoy ? 'hoy-col' : ''}">${campoNum(`e-${x.id}-${d}`, 'elab', x.id, d, plan['d' + d], `${x.masa.nombre} ${M.DIAS_CORTOS[d]}`)}</td>`).join('')}
      <td class="num"><b>${M.miles(hecho)}</b></td><td>${estado}<button type="button" class="btn-link" data-repartir="${esc(x.id)}" data-n="${necesarias}">Repartir parejo</button></td></tr>`;
  }).join('');
  // Por día: masas, tandas (masas enteras por tanda) y empastes (1 por masa)
  const pie = dias.map(d => {
    let masas = 0, tandas = 0, empastes = 0, kg = 0;
    filas.forEach(x => { const n = M.num((elab[x.id] || {})['d' + d]); masas += n; tandas += B.tandasMasas(n, porTandaDe(x.masa)).length; kg += n * B.pesoMasa(x.masa) / 1000; if (x.nec && x.nec.empastes) empastes += n; });
    return { masas, tandas, empastes, kg, pasa: tandas > tpd };
  });
  const cap = filas.length ? filas.map(x => `${esc(x.masa.nombre)}: ${porTandaDe(x.masa)} masas por tanda (${M.gramos(B.pesoMasa(x.masa))} c/u)`).join(' · ') : '';
  return navMeta() + `
    <p class="ayuda">Masas base para la meta del ${esc(M.etiquetaSemana(E.lunesMeta))}, que se elaboran <b>del ${esc(M.fechaCorta(el))} al ${esc(M.fechaCorta(M.sumarDias(el, 4)))}</b>. Reparte en los días que quieran: cada número se guarda solo. Cada masa lleva su empaste.</p>
    ${nec.avisos.map(a => `<div class="nota ojo">${ic('alerta')}<span>${esc(a)}</span></div>`).join('')}
    ${!filas.length ? `<div class="vacio">${ic('meta')}<b>Sin metas para esa semana</b><a href="#metas">Poner las metas</a></div>` : `
    <div class="tabla-caja"><table class="plan masas">
      <thead><tr><th scope="col">Masa base</th>${dias.map(d => `<th scope="col" class="${M.sumarDias(el, d) === hoy ? 'hoy-col' : ''}">${M.DIAS_CORTOS[d]} ${Number(M.sumarDias(el, d).slice(8))}</th>`).join('')}<th scope="col">Total</th><th scope="col"><span class="sr">Estado</span></th></tr></thead>
      <tbody>${cuerpo}</tbody>
      <tfoot>
        <tr><td>Tandas</td>${pie.map(p => `<td class="num ${p.pasa ? 'pasa' : ''}">${p.tandas || ''}</td>`).join('')}<td></td><td class="ayuda">${tpd} por día</td></tr>
        <tr><td>Empastes</td>${pie.map(p => `<td class="num">${p.empastes || ''}</td>`).join('')}<td class="num">${M.miles(pie.reduce((s, p) => s + p.empastes, 0))}</td><td></td></tr>
        <tr><td>Kilos de masa</td>${pie.map(p => `<td class="num">${p.kg ? M.unidades(p.kg) : ''}</td>`).join('')}<td class="num">${M.unidades(pie.reduce((s, p) => s + p.kg, 0))}</td><td></td></tr>
      </tfoot>
    </table></div>
    ${pie.some(p => p.pasa) ? `<div class="nota ojo">${ic('alerta')}<span>${esc(pie.map((p, d) => p.pasa ? `${M.DIAS_CORTOS[d]}: ${p.tandas} tandas` : '').filter(Boolean).join(' · '))}: más de las ${tpd} tandas de un día normal.</span></div>` : ''}
    <p class="ayuda">Amasadora: ${cap}. La capacidad y las tandas por día se cambian en Sistema Fën (Configuración de Producción).</p>`}`;
}

// Hoy de Bollería: las masas que tocan hoy (de la meta de la semana siguiente), sus elaboraciones previas, los empastes y los insumos
function vistaHoyBol() {
  if (!E.cargado.recetas || !E.cargado.mps) return '<div class="vacio">Cargando…</div>';
  const f = E.fecha, idx = M.indiceDia(f), lunesMeta = M.sumarDias(M.lunesDe(f), 7);
  const m = asegurarMetas(lunesMeta), dia = asegurarDia(f) || {};
  const nav = `<div class="nav-fecha">
      <button type="button" class="btn-flecha" data-dia="-1" aria-label="Día anterior">${ic('izq')}</button>
      <h2>${esc(M.fechaLarga(f))}${f === M.hoyTxt() ? ' · hoy' : ''}</h2>
      <button type="button" class="btn-flecha" data-dia="1" aria-label="Día siguiente">${ic('der')}</button>
      ${f !== M.hoyTxt() ? '<button type="button" class="btn-sec" data-dia="hoy">Volver a hoy</button>' : ''}
    </div>`;
  if (!m) return nav + '<div class="vacio">Cargando…</div>';
  if (m.sinPermiso) return nav + avisoPermiso();
  const c = ctx(), hechos = dia.hechos || {}, nec = B.necesidades(m.productos || {}, c, E.config);
  const hecho = k => hechos[k] && hechos[k].por ? hechos[k] : null;
  const masasHoy = B.masasBase(E.recetas, E.area).map(rs => ({ rs, n: M.num(((m.elaboracion || {})[rs.id] || {})['d' + idx]) })).filter(x => x.n > 0);
  const aviso = `<p class="ayuda">"Marcar terminada" en una masa la anota en la <a href="#bitacora">Bitácora</a> (masas elaboradas y congeladas). El formado y el horneado se anotan allá.</p>`;
  if (!masasHoy.length) return nav + `<div class="vacio">${ic('capas')}<b>Sin masas programadas para este día</b><a href="#masas">Ir a Masas</a></div>` + aviso;
  E.tarjetas = {};
  // Lo del día: masas + empastes (para elaboraciones previas e insumos)
  const planDia = [], empastes = [];
  masasHoy.forEach(x => {
    planDia.push({ receta: x.rs, unidades: x.n });
    const ne = nec.masas.find(y => y.masa.id === x.rs.id);
    if (ne && ne.empastes && ne.gPorEmpaste > 0) {
      const g = x.n * ne.gPorEmpaste, er = ne.empaste && ne.empaste.ingredientes && ne.empaste.ingredientes.length ? ne.empaste : null;
      empastes.push({ masa: x.rs, n: x.n, g, gPor: ne.gPorEmpaste, er, nombre: ne.empaste ? ne.empaste.nombre : 'Empaste' });
      if (er && M.pesoBase(er.ingredientes) > 0) planDia.push({ receta: er, unidades: g * M.porciones(er) / M.pesoBase(er.ingredientes) });
    }
  });
  const el = M.elaboracionesDia(planDia, {}, c);
  const empIds = new Set(empastes.map(e => e.er && e.er.mpId).filter(Boolean));
  const previas = el.subRecetas.filter(s => !empIds.has(s.id)).map(s => tarjetaElab(s, null, dia, hecho, c)).join('');
  const masas = masasHoy.map(x => {
    const porTanda = B.masasPorTanda(x.rs, E.config);
    return tarjeta({ clave: 'masa_' + x.rs.id, idCard: x.rs.id, attr: 'data-masa-card', rid: x.rs.id, receta: x.rs, nombre: x.rs.nombre, rotulo: 'Masa base', unidad: 'un', un: 'masas', total: x.n, dia, hecho,
      claveHecho: 'masa_' + x.rs.id, escalar: t => M.escalar(x.rs, t, null, c), conPct: false, porTanda,
      detalle: `${M.miles(x.n)} ${x.n === 1 ? 'masa' : 'masas'} · ${M.gramos(x.n * B.pesoMasa(x.rs))}`, defecto: B.tandasMasas(x.n, porTanda), ajustable: false });
  }).join('');
  const emps = empastes.map(e => tarjeta({ clave: 'emp_' + e.masa.id, idCard: e.masa.id, attr: 'data-empaste-card', rid: e.er ? e.er.id : null, receta: e.er, nombre: e.nombre, rotulo: 'Empastes de ' + e.masa.nombre, unidad: 'g', total: Math.round(e.g), dia, hecho,
    claveHecho: 'emp_' + e.masa.id, escalar: t => e.er ? M.escalarSub({ id: e.er.mpId || e.er.id, nombre: e.nombre, recetaId: e.er.id, porUnidades: false }, t, null, c) : { filas: [{ nombre: e.nombre, gramos: t, unidades: null, pct: null }], total: t }, conPct: false,
    detalle: `${M.miles(e.n)} de ${M.gramos(e.gPor)} · ${M.gramos(e.g)}`, ajustable: false })).join('');
  const ins = Object.entries(el.insumos).filter(([, g]) => g > 0.5).sort((a, b) => b[1] - a[1]);
  const cajaIns = ins.length ? `<div class="caja">
      <span class="rotulo">Insumos del día</span>
      <span class="grande num">${M.gramos(ins[0][1])}</span>
      <span class="ayuda">${esc(ins[0][0])}</span>
      <details class="desp"><summary>Ver todos (${ins.length})</summary><div class="lista-mini">${ins.map(([n, g]) => `<div class="fila sub"><span>${esc(n)}</span><span>${M.gramos(g)}</span></div>`).join('')}</div></details>
    </div>` : '';
  const total = masasHoy.reduce((s, x) => s + x.n, 0);
  const cajaMeta = `<div class="caja"><span class="rotulo">Para la meta del ${esc(M.etiquetaSemana(lunesMeta))}</span><span class="grande num">${M.miles(total)} ${total === 1 ? 'masa' : 'masas'} hoy</span>
      <div class="lista-mini">${nec.masas.map(x => { const hechas = B.sumaDias((m.elaboracion || {})[x.masa.id]); return `<div class="fila sub"><span>${esc(x.masa.nombre)}</span><span>${M.miles(hechas)} programadas de ${M.miles(x.masas)} necesarias</span></div>`; }).join('')}</div></div>`;
  const notas = dia.notas || {};
  return nav + `
    <section class="resumen" aria-label="Antes de empezar">${cajaMeta}${cajaIns}</section>
    ${previas ? `<h2 class="titulo">Elaboraciones previas · ${el.subRecetas.filter(s => !empIds.has(s.id)).length}</h2>${previas}` : ''}
    <h2 class="titulo">Masas del día · ${masasHoy.length}</h2>${masas}
    ${emps ? `<h2 class="titulo">Empastes</h2>${emps}` : ''}
    ${aviso}
    <section class="caja">
      <label class="rotulo" for="notas-dia">Notas del día (las ve la dupla)</label>
      <textarea id="notas-dia" rows="3" style="font: inherit; border: 1px solid var(--borde); border-radius: 10px; padding: 10px 12px; background: var(--suave-fondo)">${esc(notas.texto || '')}</textarea>
      ${notas.por ? `<span class="ayuda">Última nota de ${esc(notas.por)}</span>` : ''}
    </section>`;
}



// ═══════════════ Pastelería: recetas del día ═══════════════
// Sin plan semanal. Cada receta muestra cuánto se sugiere para la semana (lo que piden los productos que
// planificaron Bollería —metas— y Panadería —plan—), cuánto llevan hecho y cuánto hacen hoy.
// Lo de hoy se guarda en dias/PAS_{fecha}.cantidades = { receta: cantidad } (en la unidad de la receta).
function sugeridosSemana(lunes) {
  const c = ctx(), items = [];
  const metasBol = asegurarAjeno('metas', 'BOL_' + lunes), planPan = asegurarAjeno('planes', 'PAN_' + lunes);
  Object.entries((metasBol && metasBol.productos) || {}).forEach(([id, n]) => { const r = recetaPorId(id); if (r && M.num(n) > 0) items.push({ receta: r, unidades: M.num(n) }); });
  Object.entries((planPan && planPan.filas) || {}).forEach(([id, d]) => { const r = recetaPorId(id), n = Object.values(d || {}).reduce((s, v) => s + M.num(v), 0); if (r && n > 0) items.push({ receta: r, unidades: n }); });
  const subs = items.length ? M.elaboracionesDia(items, {}, c).subRecetas : [];
  const r = {}, origen = {};
  subs.forEach(s => {
    const rs = s.recetaId ? recetaPorId(s.recetaId) : null; if (!rs || rs.area !== E.area) return;
    const pesoUn = M.pesoBase(rs.ingredientes) / M.porciones(rs);
    r[rs.id] = rs.unidad === 'g' ? s.gramos : s.porUnidades ? s.unidades : (pesoUn > 0 ? s.gramos / pesoUn : 0);
    origen[rs.id] = [...new Set(s.usan.map(u => u.nombre))];
  });
  return { cant: r, origen, sinPermiso: !!((metasBol && metasBol.sinPermiso) || (planPan && planPan.sinPermiso)) };
}
function vistaHoyPas() {
  if (!E.cargado.recetas || !E.cargado.mps) return '<div class="vacio">Cargando…</div>';
  const f = E.fecha, lunes = M.lunesDe(f), dia = asegurarDia(f) || {};
  const nav = `<div class="nav-fecha">
      <button type="button" class="btn-flecha" data-dia="-1" aria-label="Día anterior">${ic('izq')}</button>
      <h2>${esc(M.fechaLarga(f))}${f === M.hoyTxt() ? ' · hoy' : ''}</h2>
      <button type="button" class="btn-flecha" data-dia="1" aria-label="Día siguiente">${ic('der')}</button>
      ${f !== M.hoyTxt() ? '<button type="button" class="btn-sec" data-dia="hoy">Volver a hoy</button>' : ''}
    </div>`;
  const c = ctx(), hechos = dia.hechos || {}, cant = dia.cantidades || {};
  const hecho = k => hechos[k] && hechos[k].por ? hechos[k] : null;
  const recetas = E.recetas.filter(r => r.area === E.area && r.estado === 'consolidada');
  if (!recetas.length) return nav + `<div class="vacio">${ic('libro')}<b>Pastelería todavía no tiene recetas aprobadas</b><a href="#recetas">Ir a Recetas</a></div>`;
  // La semana: lo hecho (días con "terminada") y lo sugerido
  const dias = Array.from({ length: 7 }, (_, i) => M.sumarDias(lunes, i));
  dias.forEach(asegurarDia);
  const hechoSemana = {}; dias.forEach(t => { const d = E.dias[t] || {}; Object.entries(d.cantidades || {}).forEach(([id, n]) => { if (d.hechos && d.hechos['rec_' + id] && d.hechos['rec_' + id].por) hechoSemana[id] = (hechoSemana[id] || 0) + M.num(n); }); });
  const sug = sugeridosSemana(lunes);
  const un = r => r.unidad === 'g' ? 'g' : 'un', fmt = (r, x) => r.unidad === 'g' ? M.gramos(x) : M.unidades(x) + ' un';
  E.tarjetas = {};
  const hoy = recetas.filter(r => M.num(cant[r.id]) > 0);
  const tarjetas = hoy.map(r => tarjetaReceta({ receta: r, unidades: M.num(cant[r.id]) }, null, dia, hecho)).join('');
  const el = hoy.length ? M.elaboracionesDia(hoy.map(r => ({ receta: r, unidades: M.num(cant[r.id]) })), {}, c) : { insumos: {}, subRecetas: [] };
  const ins = Object.entries(el.insumos).filter(([, g]) => g > 0.5).sort((a, b) => b[1] - a[1]);
  const cajaIns = ins.length ? `<div class="caja"><span class="rotulo">Insumos de hoy</span><span class="grande num">${M.gramos(ins.reduce((s, [, g]) => s + g, 0))}</span><span class="ayuda">${ins.length} ingredientes</span>
      <details class="desp"><summary>Ver todos</summary><div class="lista-mini">${ins.map(([n, g]) => `<div class="fila sub"><span>${esc(n)}</span><span>${M.gramos(g)}</span></div>`).join('')}</div></details></div>` : '';
  const orden = [...recetas].sort((a, b) => ((M.num(sug.cant[b.id]) > 0) - (M.num(sug.cant[a.id]) > 0)) || a.nombre.localeCompare(b.nombre, 'es'));
  const filas = orden.map(r => {
    const s = M.num(sug.cant[r.id]), h = M.num(hechoSemana[r.id]), id = 'pas-' + r.id;
    const mala = E.celdasMalas[f + '|' + id];
    return `<div class="fila-pas">
      <div class="txt"><b>${esc(r.nombre)}</b>
        <span class="ayuda">${s > 0 ? `Semana: sugerido ${fmt(r, s)} (${esc(sug.origen[r.id].join(', '))})` : 'Sin productos planificados que la usen esta semana'}${h > 0 ? ` · hecho ${fmt(r, h)}${s > 0 ? (h >= s ? ' · completo' : ` · faltan ${fmt(r, s - h)}`) : ''}` : ''}</span></div>
      <div class="cant-pas"><label for="${esc(id)}">Hoy</label><input id="${esc(id)}" data-pas="${esc(r.id)}" inputmode="decimal" value="${mala !== undefined ? esc(mala) : (M.num(cant[r.id]) ? esc(String(cant[r.id]).replace('.', ',')) : '')}" class="${mala !== undefined ? 'error-celda' : ''}" autocomplete="off"><span>${un(r)}</span></div>
    </div>`;
  }).join('');
  const notas = dia.notas || {};
  return nav + `
    ${sug.sinPermiso ? `<div class="nota ojo">${ic('alerta')}<span>No se pudo leer lo que planificaron Bollería y Panadería: faltan las reglas v1.3.0 (ver README). Igual pueden anotar lo de hoy.</span></div>` : ''}
    ${cajaIns ? `<section class="resumen">${cajaIns}</section>` : ''}
    ${tarjetas ? `<h2 class="titulo">Para hoy · ${hoy.length}</h2>${tarjetas}` : ''}
    <h2 class="titulo">Recetas</h2>
    <p class="ayuda">Escribe cuánto hacen hoy de cada una (en gramos o unidades, según la receta): aparece arriba escalada, con tandas y "Marcar terminada". Lo terminado suma a la semana.</p>
    <div class="lista-pas">${filas}</div>
    <section class="caja">
      <label class="rotulo" for="notas-dia">Notas del día (las ve la dupla)</label>
      <textarea id="notas-dia" rows="3" style="font: inherit; border: 1px solid var(--borde); border-radius: 10px; padding: 10px 12px; background: var(--suave-fondo)">${esc(notas.texto || '')}</textarea>
      ${notas.por ? `<span class="ayuda">Última nota de ${esc(notas.por)}</span>` : ''}
    </section>`;
}
function guardarCantPas(t) {
  const f = E.fecha, key = f + '|' + t.id, texto = t.value.trim();
  if (texto !== '' && !/^\d+([.,]\d+)?$/.test(texto)) { E.celdasMalas[key] = t.value; t.classList.add('error-celda'); avisar('Escribe un número (puede llevar coma).', true); return; }
  delete E.celdasMalas[key]; t.classList.remove('error-celda');
  guardarSinEsperar(guardarDia(f, { cantidades: { [t.dataset.pas]: texto === '' ? 0 : M.num(texto) } }));
}

// ═══════════════ Bitácora de Bollería ═══════════════
const nombreDe = id => { const r = recetaPorId(id); return r ? r.nombre : id; };
const idAnot = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
// Productos que pueden estar congelados: los que llevan masa base y los marcados "se congela"
function productosBol() {
  const c = ctx(), con = B.productos(E.recetas, c).map(p => p.receta);
  E.recetas.filter(r => r.area === E.area && r.tipo !== 'sub_receta' && r.seCongela && !con.includes(r)).forEach(r => con.push(r));
  return con.filter(r => r.estado === 'consolidada' || r.seCongela).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
function textoAnot(a) {
  if (a.tipo === 'inventario') {
    const partes = [];
    Object.entries(a.masas || {}).forEach(([id, n]) => partes.push(`${nombreDe(id)} ${M.miles(n)}`));
    Object.entries(a.empastes || {}).forEach(([id, n]) => partes.push(`empastes de ${nombreDe(id)} ${M.miles(n)}`));
    Object.entries(a.productos || {}).forEach(([id, n]) => { if (M.num(n)) partes.push(`${nombreDe(id)} ${M.miles(n)}`); });
    return 'Inventario del congelador: ' + (partes.join(' · ') || 'vacío');
  }
  if (a.tipo === 'elaboro') return `Elaboré ${M.miles(a.n)} ${a.n === 1 ? 'masa' : 'masas'} de ${nombreDe(a.masa)} y sus empastes → congelador${a.origen === 'hoy' ? ' (desde Hoy)' : ''}`;
  if (a.tipo === 'descongelo') return `Descongelé ${M.miles(a.n)} ${a.n === 1 ? 'masa' : 'masas'} de ${nombreDe(a.masa)} (con sus empastes)`;
  if (a.tipo === 'formo') { const h = M.num(a.n) - M.num(a.congelar); return `Formé ${M.miles(a.n)} ${nombreDe(a.producto)}: ${M.miles(a.congelar)} al congelador${h ? `, ${M.miles(h)} al horno hoy` : ''}`; }
  if (a.tipo === 'horneo') return `Horneé ${M.miles(a.n)} ${nombreDe(a.producto)} desde el congelador`;
  return a.tipo;
}

function vistaBitacora() {
  if (!E.cargado.recetas || !E.cargado.mps || !E.cargado.diasArea) return '<div class="vacio">Cargando…</div>';
  const f = E.fecha, lunes = M.lunesDe(f), m = asegurarMetas(lunes), dia = E.diasArea[f] || asegurarDia(f) || {};
  const nav = `<div class="nav-fecha">
      <button type="button" class="btn-flecha" data-dia="-1" aria-label="Día anterior">${ic('izq')}</button>
      <h2>${esc(M.fechaLarga(f))}${f === M.hoyTxt() ? ' · hoy' : ''}</h2>
      <button type="button" class="btn-flecha" data-dia="1" aria-label="Día siguiente">${ic('der')}</button>
      ${f !== M.hoyTxt() ? '<button type="button" class="btn-sec" data-dia="hoy">Volver a hoy</button>' : ''}
    </div>`;
  const c = ctx(), st = B.stock(E.diasArea, f), cfg = E.config || {};
  const delDia = Object.entries(dia.bitacora || {}).map(([id, a]) => ({ ...a, id })).sort((a, b) => String(a.en || '').localeCompare(String(b.en || '')));
  const botones = Object.entries(B.TIPOS).map(([k, t]) => `<button type="button" class="btn-sec" data-anotar="${k}">${ic(k === 'inventario' ? 'copo' : k === 'formo' || k === 'horneo' ? 'pan' : 'capas')}${esc(t)}</button>`).join('');
  const lista = delDia.length ? `<div class="lista-bit">${delDia.map(a => `<div class="anot ${a.anulado ? 'anulada' : ''}">
      <div><b>${esc(textoAnot(a))}</b><span class="ayuda">${esc(a.por || '')} · ${esc(horaDe(a.en))}${a.anulado ? ` · anulada por ${esc(a.anulado.por || '')}` : ''}</span></div>
      ${a.anulado ? '' : `<button type="button" class="btn-link" data-anular="${esc(a.id)}">Anular</button>`}
    </div>`).join('')}</div>` : '<p class="ayuda">Sin anotaciones este día.</p>';
  // Congelado al final del día
  const masas = B.masasBase(E.recetas, E.area).filter(r => M.num(st.masas[r.id]) || M.num(st.empastes[r.id]));
  const prods = productosBol().filter(r => M.num(st.productos[r.id]));
  const totMasas = Object.values(st.masas).reduce((s, n) => s + Math.max(0, n), 0);
  const totCajas = prods.reduce((s, r) => s + (B.cajas(st.productos[r.id], r.unidadesPorCaja) || 0), 0);
  const capM = M.num(cfg.capacidad_congelacion_masas), capP = M.num(cfg.capacidad_productos);
  const negativos = [...Object.entries(st.masas), ...Object.entries(st.productos)].filter(([, n]) => n < 0).map(([id]) => nombreDe(id));
  const congelado = `<div class="caja">
      <span class="rotulo">Congelado al cierre del ${esc(M.fechaCorta(f))}</span>
      ${!st.conInventario ? `<div class="nota ojo">${ic('alerta')}<span>Falta el inventario inicial: cuenten el congelador y anótenlo con "Inventario del congelador". Desde ahí todo se mueve solo.</span></div>` : ''}
      <div class="lista-mini">
        ${masas.map(r => `<div class="fila sub"><span>${esc(r.nombre)}</span><span>${M.miles(st.masas[r.id] || 0)} masas · ${M.miles(st.empastes[r.id] || 0)} empastes</span></div>`).join('')}
        ${prods.map(r => { const cj = B.cajas(st.productos[r.id], r.unidadesPorCaja); return `<div class="fila sub"><span>${esc(r.nombre)}</span><span>${M.miles(st.productos[r.id])}${cj !== null ? ` · ${cj} ${cj === 1 ? 'caja' : 'cajas'}` : ''}</span></div>`; }).join('')}
        ${!masas.length && !prods.length ? '<span class="ayuda">Nada congelado.</span>' : ''}
      </div>
      <span class="ayuda">${capM ? `Masas: ${M.miles(totMasas)} de ${M.miles(capM)} espacios` : ''}${capM && capP ? ' · ' : ''}${capP ? `Productos: ${M.miles(totCajas)} de ${M.miles(capP)} cajas` : ''}</span>
      ${capM && totMasas > capM ? `<div class="nota ojo">${ic('alerta')}<span>Las masas no caben en el congelador (${M.miles(totMasas)} de ${M.miles(capM)}).</span></div>` : ''}
      ${capP && totCajas > capP ? `<div class="nota ojo">${ic('alerta')}<span>Los productos no caben en el congelador (${M.miles(totCajas)} de ${M.miles(capP)} cajas).</span></div>` : ''}
      ${negativos.length ? `<div class="nota ojo">${ic('alerta')}<span>Quedan en negativo: ${esc(negativos.join(', '))}. Revisen las anotaciones o hagan un inventario.</span></div>` : ''}
    </div>`;
  // Avance de la meta de esta semana
  const metas = (m && m.productos) || {}, hor = B.horneado(E.diasArea, lunes);
  const conMeta = Object.keys(metas).filter(id => M.num(metas[id]) > 0 || M.num(hor[id]) > 0).sort((a, b) => nombreDe(a).localeCompare(nombreDe(b), 'es'));
  const avance = `<div class="caja">
      <span class="rotulo">Meta del ${esc(M.etiquetaSemana(lunes))}</span>
      ${conMeta.length ? `<div class="lista-mini">${conMeta.map(id => { const meta = M.num(metas[id]), h = M.num(hor[id]), falta = meta - h; return `<div class="fila sub"><span>${esc(nombreDe(id))}</span><span>van ${M.miles(h)} de ${M.miles(meta)}${meta ? (falta > 0 ? ` · faltan ${M.miles(falta)}` : ' · cumplida') : ''}</span></div>`; }).join('')}</div>`
        : `<span class="ayuda">Sin meta para esta semana. <a href="#metas">Ponerla</a></span>`}
      <span class="ayuda">Cuenta lo horneado: lo formado y horneado el mismo día y lo horneado desde el congelador.</span>
    </div>`;
  const rend = B.rendimiento(E.diasArea, lunes, c);
  const cajaRend = Object.keys(rend).filter(id => rend[id].masas > 0 && rend[id].esperadas > 0).map(id => {
    const x = rend[id], dif = x.esperadas - x.masas;
    return `<div class="fila sub"><span>${esc(nombreDe(id))}</span><span>${M.miles(x.masas)} masas descongeladas → piezas para ${M.unidades(x.esperadas)} masas${Math.abs(dif) >= 0.05 ? ` (${dif > 0 ? '+' : ''}${M.unidades(dif)})` : ''}</span></div>`;
  }).join('');
  return nav + `
    <div class="botones-bit">${botones}</div>
    <h2 class="titulo">Anotaciones del día</h2>${lista}
    <section class="resumen" style="margin-top:16px">${congelado}${avance}</section>
    ${cajaRend ? `<div class="caja" style="margin-top:14px"><span class="rotulo">Rendimiento real de la semana</span><div class="lista-mini">${cajaRend}</div><span class="ayuda">Las piezas formadas, pasadas a masas según lo que rinde cada receta. Si salen menos piezas que masas descongeladas, la diferencia es merma o rendimiento menor.</span></div>` : ''}
    <div class="botones" style="margin-top:16px"><button type="button" class="btn-sec" data-cierre="1">${ic('imprimir')}Cierre del viernes (para imprimir)</button></div>`;
}

// ── Diálogo: anotar en la bitácora ──
function dialogoAnotar(tipo) {
  const d = $('dialogo'), f = E.fecha, st = B.stock(E.diasArea, f);
  const masas = B.masasBase(E.recetas, E.area), prods = productosBol();
  const m = E.metas[M.sumarDias(M.lunesDe(f), 7)] || {}, idx = M.indiceDia(f);
  const sel = (id, lista, valor) => `<select id="${id}">${lista.map(r => `<option value="${esc(r.id)}" ${r.id === valor ? 'selected' : ''}>${esc(r.nombre)}</option>`).join('')}</select>`;
  const num = (id, etiqueta, v, ayuda) => `<div class="fila-aj"><label for="${id}">${esc(etiqueta)}${ayuda ? `<small>${esc(ayuda)}</small>` : ''}</label><input id="${id}" inputmode="numeric" value="${v === '' || v === undefined ? '' : esc(String(v))}"><span class="gr"></span></div>`;
  let cuerpo = '';
  if (tipo === 'inventario') {
    cuerpo = `<p class="ayuda">Cuenten lo que hay en el congelador. Reemplaza lo que la app tenía: desde aquí todo se mueve solo con las anotaciones.</p>
      <div class="filas-aj">
        ${masas.map(r => num('inv-m-' + r.id, r.nombre + ' (masas)', M.num(st.masas[r.id]) || '', '') + num('inv-e-' + r.id, 'Empastes de ' + r.nombre, M.num(st.empastes[r.id]) || '', '')).join('')}
        ${prods.map(r => num('inv-p-' + r.id, r.nombre, M.num(st.productos[r.id]) || '', r.unidadesPorCaja ? `${r.unidadesPorCaja} por caja` : '')).join('')}
      </div>`;
  } else if (tipo === 'elaboro' || tipo === 'descongelo') {
    const prog = masas.find(r => M.num(((m.elaboracion || {})[r.id] || {})['d' + idx]));
    const v = tipo === 'elaboro' && prog ? M.num(((m.elaboracion || {})[prog.id] || {})['d' + idx]) : '';
    cuerpo = `<div class="campo"><label for="an-masa">Masa base</label>${sel('an-masa', masas, prog ? prog.id : '')}</div>
      <div class="filas-aj">${num('an-n', tipo === 'elaboro' ? 'Masas elaboradas y congeladas' : 'Masas descongeladas', v, 'Cada masa lleva su empaste')}</div>`;
  } else if (tipo === 'formo') {
    cuerpo = `<div class="campo"><label for="an-prod">Producto</label>${sel('an-prod', prods, '')}</div>
      <div class="filas-aj">${num('an-n', 'Piezas formadas', '', '')}${num('an-cong', 'De esas, al congelador', '', 'Las demás se hornean hoy')}</div>
      <p class="ayuda" id="an-resto"></p>`;
  } else if (tipo === 'horneo') {
    cuerpo = `<div class="campo"><label for="an-prod">Producto</label>${sel('an-prod', prods, '')}</div>
      <div class="filas-aj">${num('an-n', 'Piezas horneadas desde el congelador', '', '')}</div>`;
  }
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>${esc(B.TIPOS[tipo])} · ${esc(M.fechaCorta(f))}</h2>${cuerpo}
      <div class="error" id="an-error" role="alert"></div>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">Anotar</button></div>
    </form>`;
  const resto = () => { const el = $('an-resto'); if (!el) return; const n = M.num($('an-n').value), cg = M.num($('an-cong').value); el.textContent = n ? `Al horno hoy: ${M.miles(Math.max(0, n - cg))}.` : ''; };
  d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.oninput = () => resto();
  d.onchange = null;
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (!b.dataset.guardar) return;
    const entero = id => { const t = ($(id) || {}).value || ''; return /^\s*\d*\s*$/.test(t) ? Math.round(M.num(t)) : NaN; };
    const err = t => { $('an-error').textContent = t; };
    let a;
    if (tipo === 'inventario') {
      a = { tipo, masas: {}, empastes: {}, productos: {} };
      for (const r of masas) { const x = entero('inv-m-' + r.id), y = entero('inv-e-' + r.id); if (isNaN(x) || isNaN(y)) return err('Escribe números enteros.'); a.masas[r.id] = x; a.empastes[r.id] = y; }
      for (const r of prods) { const x = entero('inv-p-' + r.id); if (isNaN(x)) return err('Escribe números enteros.'); a.productos[r.id] = x; }
    } else if (tipo === 'elaboro' || tipo === 'descongelo') {
      const n = entero('an-n'); if (!(n > 0)) return err('Escribe cuántas masas (número entero mayor que 0).');
      a = { tipo, masa: $('an-masa').value, n };
    } else if (tipo === 'formo') {
      const n = entero('an-n'), cg = $('an-cong').value.trim() === '' ? 0 : entero('an-cong');
      if (!(n > 0)) return err('Escribe cuántas piezas formaron.'); if (isNaN(cg) || cg > n) return err('Las del congelador no pueden ser más que las formadas.');
      a = { tipo, producto: $('an-prod').value, n, congelar: cg };
    } else if (tipo === 'horneo') {
      const n = entero('an-n'); if (!(n > 0)) return err('Escribe cuántas piezas hornearon.');
      a = { tipo, producto: $('an-prod').value, n };
    }
    d.close();
    guardarSinEsperar(guardarDia(f, { bitacora: { [idAnot()]: { ...a, por: quien(), en: ahoraIso() } } }), 'Anotado.');
  };
}

// ── Cierre del viernes: congelado (de la bitácora) + qué hornear el sábado y qué descongelar el domingo (lo deciden ellas) ──
function dialogoCierre() {
  const d = $('dialogo'), f = E.fecha, st = B.stock(E.diasArea, f), lunes = M.lunesDe(f);
  const masas = B.masasBase(E.recetas, E.area), prods = productosBol();
  const m = E.metas[lunes] || {}, hor = B.horneado(E.diasArea, lunes), previo = ((E.diasArea[f] || {}).cierre) || {};
  // Sugerencia para el sábado: lo que falta de la meta, sin pasar de lo congelado
  const sugSab = r => { const falta = M.num((m.productos || {})[r.id]) - M.num(hor[r.id]); return Math.max(0, Math.min(falta, M.num(st.productos[r.id]))); };
  const val = (o, id, def) => o && o[id] !== undefined ? o[id] : def;
  const fila = (id, etiqueta, v, ayuda) => `<div class="fila-aj"><label for="${id}">${esc(etiqueta)}${ayuda ? `<small>${esc(ayuda)}</small>` : ''}</label><input id="${id}" inputmode="numeric" value="${M.num(v) || ''}"><span class="gr"></span></div>`;
  d.innerHTML = `<form method="dialog" class="dlg dlg-ancho">
      <h2>Cierre del ${esc(M.fechaLarga(f))}</h2>
      <p class="ayuda">El congelado sale de la bitácora. Lo del sábado y el domingo lo deciden ustedes (para el sábado se sugiere lo que falta de la meta, sin pasar de lo congelado).</p>
      <h3 class="rotulo">Hornear el sábado ${esc(M.fechaCorta(M.sumarDias(f, 1)))}</h3>
      <div class="filas-aj">${prods.map(r => fila('ci-s-' + r.id, r.nombre, val(previo.sabado, r.id, sugSab(r)), `Congelado: ${M.miles(st.productos[r.id] || 0)}`)).join('')}</div>
      <h3 class="rotulo">Descongelar el domingo ${esc(M.fechaCorta(M.sumarDias(f, 2)))} para el lunes</h3>
      <div class="filas-aj">${masas.map(r => fila('ci-dm-' + r.id, r.nombre + ' (masas)', val((previo.domingo || {}).masas, r.id, 0), `Congeladas: ${M.miles(st.masas[r.id] || 0)}`)).join('')}
        ${prods.map(r => fila('ci-dp-' + r.id, r.nombre, val((previo.domingo || {}).productos, r.id, 0), '')).join('')}</div>
      <div class="error" id="ci-error" role="alert"></div>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">${ic('imprimir')}Guardar e imprimir</button></div>
    </form>`;
  d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.oninput = null; d.onchange = null;
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (!b.dataset.guardar) return;
    const leer = id => { const t = $(id).value; return /^\s*\d*\s*$/.test(t) ? Math.round(M.num(t)) : NaN; };
    const cierre = { sabado: {}, domingo: { masas: {}, productos: {} }, por: quien(), en: ahoraIso() };
    for (const r of prods) { const x = leer('ci-s-' + r.id), y = leer('ci-dp-' + r.id); if (isNaN(x) || isNaN(y)) { $('ci-error').textContent = 'Escribe números enteros.'; return; } cierre.sabado[r.id] = x; cierre.domingo.productos[r.id] = y; }
    for (const r of masas) { const x = leer('ci-dm-' + r.id); if (isNaN(x)) { $('ci-error').textContent = 'Escribe números enteros.'; return; } cierre.domingo.masas[r.id] = x; }
    d.close();
    guardarSinEsperar(guardarDia(f, { cierre }));
    imprimirCierre(f, st, cierre, masas, prods);
  };
}
function imprimirCierre(f, st, cierre, masas, prods) {
  const filas = (lista, fn) => lista.map(fn).filter(Boolean).join('') || '<tr><td colspan="2">—</td></tr>';
  let el = $('impresion'); if (!el) { el = document.createElement('div'); el.id = 'impresion'; document.body.appendChild(el); }
  el.innerHTML = `<h1>Bollería · cierre del ${esc(M.fechaLarga(f))}</h1>
    <p>Hecho por ${esc(quien())} · ${esc(new Date().toLocaleString('es-CL'))}</p>
    <h2>Congelado al cierre</h2>
    <table><tbody>
      ${filas(masas, r => (M.num(st.masas[r.id]) || M.num(st.empastes[r.id])) ? `<tr><td>${esc(r.nombre)}</td><td>${M.miles(st.masas[r.id] || 0)} masas · ${M.miles(st.empastes[r.id] || 0)} empastes</td></tr>` : '')}
      ${filas(prods, r => M.num(st.productos[r.id]) ? `<tr><td>${esc(r.nombre)}</td><td>${M.miles(st.productos[r.id])}${B.cajas(st.productos[r.id], r.unidadesPorCaja) !== null ? ` (${B.cajas(st.productos[r.id], r.unidadesPorCaja)} cajas)` : ''}</td></tr>` : '')}
    </tbody></table>
    <h2>Hornear el sábado ${esc(M.fechaCorta(M.sumarDias(f, 1)))}</h2>
    <table><tbody>${filas(prods, r => cierre.sabado[r.id] ? `<tr><td>${esc(r.nombre)}</td><td>${M.miles(cierre.sabado[r.id])}</td></tr>` : '')}</tbody></table>
    <h2>Descongelar el domingo ${esc(M.fechaCorta(M.sumarDias(f, 2)))} para el lunes</h2>
    <table><tbody>
      ${filas(masas, r => cierre.domingo.masas[r.id] ? `<tr><td>${esc(r.nombre)}</td><td>${M.miles(cierre.domingo.masas[r.id])} masas (con sus empastes)</td></tr>` : '')}
      ${filas(prods, r => cierre.domingo.productos[r.id] ? `<tr><td>${esc(r.nombre)}</td><td>${M.miles(cierre.domingo.productos[r.id])}</td></tr>` : '')}
    </tbody></table>`;
  setTimeout(() => window.print(), 50);
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
function programarPlanilla(ms = 15000, area = E.area) { clearTimeout(E.planilla.t); E.planilla.t = setTimeout(() => pasarPlanilla(area), ms); }
function revisarPlanilla() { if (Object.values(E.planes).some(p => p && p.planillaPendiente) && !E.planilla.t && !E.planilla.corriendo) programarPlanilla(5000); }
async function pasarPlanilla(area) {
  E.planilla.t = 0;
  const deArea = typeof area === 'string' ? area : E.area;
  if (E.planilla.corriendo || !E.usuario || navigator.onLine === false) { programarPlanilla(60000, deArea); return; }
  E.planilla.corriendo = true;
  try {
    const r = await llamarScript({ action: 'cocina_planilla', area: deArea });
    if (!r || r.ok !== true) throw new Error((r && (r.error || r.msg)) || 'sin respuesta');
    E.planilla.error = '';
  } catch (e) { E.planilla.error = e.message || String(e); programarPlanilla(120000, deArea); }
  finally { E.planilla.corriendo = false; repintar(); }
}

// ── Recetas (consulta) ──
function vistaRecetas() {
  if (!E.cargado.recetas) return '<div class="vacio">Cargando…</div>';
  if (E.recetaVista) return detalleReceta(E.recetas.find(r => r.id === E.recetaVista));
  const q = E.buscar.trim().toLowerCase();
  const lista = E.recetas.filter(r => r.area === E.area && (!q || r.nombre.toLowerCase().includes(q)))
    .sort((a, b) => (a.estado === 'consolidada' ? 0 : 1) - (b.estado === 'consolidada' ? 0 : 1) || a.nombre.localeCompare(b.nombre, 'es'));
  return `${ED.vistaPropuestas()}${!AREAS[E.area].nueva ? `<div class="nota neutra">${ic('alerta')}<span>${esc(AREAS[E.area].nombre)} sigue planificando en la app actual por ahora. Aquí puedes consultar las recetas. <a href="${esc(C.APP_ANTIGUA)}">Abrir la app actual</a></span></div>` : ''}
    <div class="campo"><label for="buscar-receta">Buscar</label><input id="buscar-receta" value="${esc(E.buscar)}" placeholder="Nombre de la receta" autocomplete="off"></div>
    ${ED.AREAS_EDITAN.includes(E.area) ? '<h2 class="titulo">Recetas</h2>' : ''}
    <div class="lista-recetas">${lista.map(r => `<button type="button" class="item-receta" data-receta="${esc(r.id)}">
        <b>${esc(r.nombre)}</b>
        <small>${r.tipo === 'sub_receta' ? 'Sub receta · ' : ''}rinde ${M.unidades(M.porciones(r))} ${r.unidad === 'g' ? 'g' : 'un'}</small>
        ${r.estado !== 'consolidada' ? `<span class="estado">${esc(ESTADOS[r.estado] || r.estado || 'Sin estado')}</span>` : ED.propuestaAbierta(r.id) ? '<span class="estado">Con cambios propuestos</span>' : ''}
      </button>`).join('') || '<p class="ayuda">No hay recetas con ese nombre.</p>'}</div>`;
}
function detalleReceta(r) {
  if (!r) { E.recetaVista = null; return vistaRecetas(); }
  const cant = E.cantidadVista ?? M.porciones(r), e = M.escalar(r, cant, null, ctx()), esPan = E.area === 'PAN';
  const pasos = (r.pasos || []).filter(Boolean);
  return `<div class="nav-fecha"><button type="button" class="btn-flecha" data-volver="1" aria-label="Volver a la lista">${ic('izq')}</button><h2>${esc(r.nombre)}</h2>
      ${r.estado !== 'consolidada' ? `<span class="estado">${esc(ESTADOS[r.estado] || r.estado || '')}</span>` : ''}
      ${ED.AREAS_EDITAN.includes(E.area) && r.area === E.area ? `<button type="button" class="btn-sec" data-ed-editar="${esc(r.id)}">${ic('libro')}${ED.propuestaAbierta(r.id) ? 'Ver la propuesta abierta' : 'Editar (nueva versión)'}</button>` : ''}</div>
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
  if (ED.alClick(b)) return;
  if (ds.dia) { E.fecha = ds.dia === 'hoy' ? M.hoyTxt() : M.sumarDias(E.fecha, Number(ds.dia)); pintar(); return; }
  if (ds.metaSem) { E.lunesMeta = ds.metaSem === 'prox' ? M.sumarDias(M.lunesDe(M.hoyTxt()), 7) : M.sumarDias(E.lunesMeta, Number(ds.metaSem)); pintar(); return; }
  if (ds.repartir) {
    const n = Number(ds.n); if (!(n > 0)) { avisar('Esa masa no tiene masas necesarias esta semana.', true); return; }
    const plan = (E.metas[E.lunesMeta] || {}).elaboracion || {};
    if (B.sumaDias(plan[ds.repartir]) > 0 && !confirm('¿Reemplazar lo repartido por un reparto parejo de lunes a viernes?')) return;
    const r = B.repartir(n), dias = {}; for (let d = 0; d < 5; d++) dias['d' + d] = r['d' + d] || 0;
    const rr = recetaPorId(ds.repartir);
    guardarSinEsperar(setDoc(doc(db, 'metas', `${E.area}_${E.lunesMeta}`), { area: E.area, lunes: E.lunesMeta, elaboracion: { [ds.repartir]: dias }, nombres: { [ds.repartir]: rr ? rr.nombre : ds.repartir }, actualizado: { por: quien(), en: serverTimestamp() } }, { merge: true }));
    return;
  }
  if (ds.semana) { E.lunesPlan = ds.semana === 'hoy' ? M.lunesDe(M.hoyTxt()) : M.sumarDias(E.lunesPlan, Number(ds.semana)); pintar(); return; }
  if (ds.hecho) {
    b.disabled = true;
    const cambios = { hechos: { [ds.hecho]: ds.valor === '1' ? { por: quien(), en: ahoraIso() } : null } };
    // Bollería: terminar una masa del día la anota en la bitácora (+masas y +empastes congelados); deshacer la anula
    if (E.area === 'BOL' && ds.hecho.startsWith('masa_')) {
      const rid = ds.hecho.slice(5), T = (E.tarjetas || {})['masa_' + rid];
      cambios.bitacora = { ['hoy_' + rid]: ds.valor === '1' ? { tipo: 'elaboro', masa: rid, n: T ? T.total : 0, origen: 'hoy', por: quien(), en: ahoraIso(), anulado: null } : { anulado: { por: quien(), en: ahoraIso() } } };
    }
    guardarSinEsperar(guardarDia(E.fecha, cambios));
    return;
  }
  if (ds.anotar) { dialogoAnotar(ds.anotar); return; }
  if (ds.periodo) { E[ds.periodoDe] = ds.periodo; pintar(); return; }
  if (ds.mermaNueva) { dialogoMerma(); return; }
  if (ds.bodega) { dialogoBodega(ds.bodega); return; }
  if (ds.turnoNuevo) { dialogoTurno(ds.turnoNuevo); return; }
  if (ds.anularReg) {
    const [campo, fecha, id] = ds.anularReg.split('|');
    if (!confirm('¿Anular esta anotación? Queda en el registro como anulada y deja de contar.')) return;
    guardarSinEsperar(guardarDia(fecha, { [campo]: { [id]: { anulado: { por: quien(), en: ahoraIso() } } }, registrosPendientes: true }), 'Anotación anulada.');
    const b0 = campo === 'bodega' ? (((E.diasArea[fecha] || {}).bodega) || {})[id] : null;
    if (b0 && b0.tipo === 'conteo' && E.conteosmp[b0.mp] && E.conteosmp[b0.mp].id === id && E.conteosmp[b0.mp].area === E.area)
      guardarSinEsperar(setDoc(doc(db, 'conteosmp', b0.mp), { area: E.area, mp: b0.mp, fecha: E.conteosmp[b0.mp].fecha, cantidad: E.conteosmp[b0.mp].cantidad, anulado: true }, { merge: true }));
    programarRegistros();
    return;
  }
  if (ds.anular) {
    if (!confirm('¿Anular esta anotación? Queda en el registro como anulada y deja de contar.')) return;
    guardarSinEsperar(guardarDia(E.fecha, { bitacora: { [ds.anular]: { anulado: { por: quien(), en: ahoraIso() } } } }), 'Anotación anulada.');
    return;
  }
  if (ds.cierre) { dialogoCierre(); return; }
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
  if (ED.alInput(t)) return;
  if (t.dataset.celda) {
    const k = t.id; clearTimeout(tiempos[k]);
    t.classList.toggle('error-celda', !/^\s*\d*\s*$/.test(t.value));   // se marca al tiro si no es un número
    tiempos[k] = setTimeout(() => guardarCelda(t.dataset.celda, Number(t.dataset.d), t.value), 700);
  }
  if (t.dataset.pas) {
    const k = t.id; clearTimeout(tiempos[k]);
    t.classList.toggle('error-celda', !/^\s*(\d+([.,]\d+)?)?\s*$/.test(t.value));
    tiempos[k] = setTimeout(() => guardarCantPas(t), 800);
  }
  if (t.dataset.num) {
    const k = t.id; clearTimeout(tiempos[k]);
    t.classList.toggle('error-celda', !/^\s*\d*\s*$/.test(t.value));
    tiempos[k] = setTimeout(() => { if (!/^\s*\d*\s*$/.test(t.value) || Math.round(M.num(t.value)) !== valorGuardado(t)) guardarNumero(t); }, 700);
  }
  if (t.id === 'notas-dia') { clearTimeout(tiempos.notas); const f = E.fecha; tiempos.notas = setTimeout(() => guardarSinEsperar(guardarDia(f, { notas: { texto: t.value.slice(0, 2000), por: quien(), en: ahoraIso() } })), 900); }
  if (t.id === 'buscar-receta') { E.buscar = t.value; repintar(); }
  if (t.id === 'cant-receta') { const v = M.num(t.value); if (v > 0) { E.cantidadVista = v; repintar(); } }
});
// Al salir de una celda se guarda si cambió (focusout también corre cuando la pantalla se repintó mientras se escribía)
$('principal').addEventListener('focusout', ev => {
  const t = ev.target;
  if (t.dataset && t.dataset.pas) { clearTimeout(tiempos[t.id]); const d = E.dias[E.fecha] || {}; if (M.num(t.value) !== M.num((d.cantidades || {})[t.dataset.pas]) || !/^\s*(\d+([.,]\d+)?)?\s*$/.test(t.value)) guardarCantPas(t); return; }
  if (t.dataset && t.dataset.num) { clearTimeout(tiempos[t.id]); if (!/^\s*\d*\s*$/.test(t.value) || Math.round(M.num(t.value)) !== valorGuardado(t)) guardarNumero(t); return; }
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
  const fmt = x => enG ? M.gramos(x) : M.unidades(x) + ' ' + (T.un || 'un');
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
      <div class="fila-aj"><label for="t-cada">O tandas de hasta<small>${enG ? 'Kilos de masa por tanda' : T.porTanda ? `${T.un === 'masas' ? 'Masas' : 'Unidades'} por tanda (la amasadora aguanta ${T.porTanda})` : 'Unidades por tanda (por ejemplo, lo que cabe en la amasadora)'}</small></label><input id="t-cada" inputmode="decimal" value="${modo && modo.modo === 'cada' ? enCampo(enG ? modo.valor / 1000 : modo.valor) : ''}"><span class="gr">${enG ? 'kg' : esc(T.un || 'un')}</span></div>
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
  // Peso por pieza: se muestra cuando la receta rinde unidades (en las masas que van por kilos, los kilos ya se mantienen solos)
  const mostrarPeso = r.unidad !== 'g' && !(esSubR && r.unidad === 'g');
  const porc = M.porciones(r);
  const redondear = g => g >= 2000 ? Math.round(g) : Math.round(g * 10) / 10;
  const gH = g => g >= 1000 ? M.gramos(g) : M.unidades(g) + ' g';   // en bases chicas el decimal importa (102,1 g)
  let sugerida = null;
  let harina = vig && M.num(vig.harina) > 0 ? M.num(vig.harina) : orig;
  const pct = {}; ingsPct.forEach(i => { pct[i.id] = vig && vig.pct && vig.pct[i.id] !== undefined ? M.num(vig.pct[i.id]) : pctOrig(i); });
  let vigencia = vig ? (vig.hasta === vig.desde ? 'dia' : 'seguir') : 'dia';   // uno nuevo parte "solo este día"
  const d = $('dialogo');
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>Ajustar harina / agua · ${esc(r.nombre)}</h2>
      <p class="ayuda">Para cuando llega una harina que absorbe distinto. La receta original no cambia: el ajuste vale para las tarjetas, las tandas, las elaboraciones previas y los insumos.${esSubR ? (r.unidad !== 'g' ? ' Se mantiene la harina de cada unidad; abajo ves cómo cambia el peso por pieza y la harina que lo conserva.' : ' Se mantienen los kilos que piden los panes; cambian las proporciones.') : ''}${P.calculado ? ' Los % se calculan de los gramos de la receta.' : ''}</p>
      <div class="filas-aj">
        <div class="fila-aj"><label for="aj-harina">Harina base (100 %)<small>Receta: ${M.gramos(orig)}</small></label><input id="aj-harina" inputmode="decimal" value="${enCampo(harina)}"><span class="gr">g</span></div>
        ${ingsPct.map(i => `<div class="fila-aj"><label for="aj-${esc(i.id)}">${esc(i.nombre)}<small>Receta: ${M.unidades(pctOrig(i))} %</small></label><input id="aj-${esc(i.id)}" data-pct="${esc(i.id)}" inputmode="decimal" value="${enCampo(pct[i.id])}"><span class="gr" id="aj-g-${esc(i.id)}"></span></div>`).join('')}
      </div>
      ${mostrarPeso ? '<div class="nota neutra peso-aj" id="aj-peso" role="status"></div>' : ''}
      <fieldset class="opciones" style="border:0;padding:0;margin:0"><legend class="rotulo">¿Hasta cuándo?</legend>
        <label><input type="radio" name="vig" value="dia" ${vigencia === 'dia' ? 'checked' : ''}>Solo el ${esc(M.fechaCorta(f))}</label>
        <label><input type="radio" name="vig" value="seguir" ${vigencia === 'seguir' ? 'checked' : ''}>Desde el ${esc(M.fechaCorta(f))}, hasta que lo quite (por ejemplo, mientras dure esta harina)</label>
      </fieldset>
      ${vig ? `<p class="ayuda">¿Esta harina llegó para quedarse? <button type="button" class="btn-link" data-llevar="1">Llevar el ajuste a la receta</button> (la envía a revisión; el ajuste sigue mientras se aprueba).</p>` : ''}
      <div class="dlg-pie">${vig ? '<button type="button" class="btn-sec izq" data-quitar="1">Quitar ajuste</button>' : ''}<button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">Guardar ajuste</button></div>
    </form>`;
  const marcar = () => {
    const h = $('aj-harina'); h.classList.toggle('cambiado', Math.abs(harina - orig) > 0.1);
    ingsPct.forEach(i => { const el = $('aj-' + i.id), g = $('aj-g-' + i.id); if (el) el.classList.toggle('cambiado', Math.abs(pct[i.id] - pctOrig(i)) > 0.001); if (g) g.textContent = M.gramos(harina * pct[i.id] / 100); });
    const caja = $('aj-peso'); if (!caja) return;
    const w = M.pesoAjustado(r, harina, pct), pieza = x => M.gramos(x / porc);
    sugerida = w.harinaParaMantener ? redondear(w.harinaParaMantener) : null;
    const distinto = Math.abs(w.peso - w.original) > Math.max(0.05 * porc, w.original * 0.001);
    caja.innerHTML = `<span>Peso por pieza: <b>${pieza(w.peso)}</b>${distinto ? ` (receta ${pieza(w.original)})` : ' · igual que la receta'}.`
      + (distinto && sugerida ? ` Para que cada pieza pese ${pieza(w.original)}, la harina base va en <b>${gH(sugerida)}</b>.</span> <button type="button" class="btn-sec" data-mantener="1">Usar ${gH(sugerida)}</button>` : '</span>');
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
    if (b.dataset.mantener) { if (sugerida) { harina = sugerida; $('aj-harina').value = enCampo(sugerida); marcar(); } return; }
    if (b.dataset.llevar) {
      const abierta = ED.propuestaAbierta(rid);
      if (abierta && !confirm(`Ya hay una propuesta abierta de ${r.nombre} (${ED.ESTADOS_P[abierta.estado] || abierta.estado}). ¿Reemplazarla por este ajuste?`)) return;
      if (abierta) ED.anular(abierta.pid, 'Reemplazada por el ajuste de harina/agua');
      d.close();
      ED.crear(ED.desdeAjuste(r, harina, { ...pct }), { recetaId: rid, origen: 'ajuste', estado: 'en_revision', abrir: false, comentario: `Desde el ajuste de harina/agua del ${M.fechaCorta(f)}` });
      return;
    }
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
// ═══════════════ Merma (las cuatro áreas) ═══════════════
// Sin precios: Sistema Fën la valoriza con los costos de la planilla. Se anota en el día de hoy.
const PERIODOS = [['hoy', 'Hoy'], ['semana', 'Esta semana'], ['semana_ant', 'Semana pasada'], ['mes', 'Este mes'], ['mes_ant', 'Mes pasado']];
function chipsPeriodo(clave, valor, cuales) {
  return `<div class="botones-n" role="group" aria-label="Período">${PERIODOS.filter(([k]) => cuales.includes(k)).map(([k, t]) => `<button type="button" class="btn-sec" data-periodo="${k}" data-periodo-de="${clave}" aria-pressed="${valor === k}">${t}</button>`).join('')}</div>`;
}
function avisoCopia() {
  const r = reg(); return r.error ? `<p class="ayuda">La copia a la planilla quedó pendiente (${esc(r.error)}). Se reintenta sola; lo anotado está guardado.</p>` : '';
}
function lineaAnot(campo, a, texto, detalle) {
  return `<div class="anot ${a.anulado ? 'anulada' : ''}">
      <div><b>${texto}</b><span class="ayuda">${detalle}${a.anulado ? ` · anulada por ${esc(a.anulado.por || '')}` : ''}</span></div>
      ${a.anulado ? '' : `<button type="button" class="btn-link" data-anular-reg="${esc(campo)}|${esc(a.fecha)}|${esc(a.id)}">Anular</button>`}
    </div>`;
}
function vistaMerma() {
  if (!E.cargado.recetas || !E.cargado.mps || !E.cargado.diasArea) return '<div class="vacio">Cargando…</div>';
  const per = R.periodo(E.periodoMerma), lista = R.delPeriodo(E.diasArea, 'merma', per), resumen = R.resumenMerma(lista);
  const rango = per.desde === per.hasta ? M.fechaCorta(per.desde) : `${M.fechaCorta(per.desde)} al ${M.fechaCorta(per.hasta)}`;
  return `
    <div class="cab-seccion">
      <p class="ayuda">Anoten lo que se pierde: productos, preparaciones o materias primas, con el motivo. Administración lo ve valorizado en Sistema Fën.</p>
      <button type="button" class="btn btn-fuerte" data-merma-nueva="1">${ic('merma')}Anotar merma</button>
    </div>
    ${chipsPeriodo('periodoMerma', E.periodoMerma, ['hoy', 'semana', 'semana_ant', 'mes', 'mes_ant'])}
    <div class="caja">
      <span class="rotulo">Lo perdido · ${esc(rango)}</span>
      ${resumen.length ? `<div class="lista-mini">${resumen.map(x => `<div class="fila sub"><span>${esc(x.nombre)}${x.tipo === 'mp' ? ' <small class="ayuda">(materia prima)</small>' : ''}</span><span>${esc(R.cantidadTexto(x.cantidad, x.unidad))}${x.veces > 1 ? ` · ${x.veces} veces` : ''}</span></div>`).join('')}</div>` : '<span class="ayuda">Nada anotado en este período.</span>'}
    </div>
    <h2 class="titulo">Anotaciones</h2>
    ${lista.length ? `<div class="lista-bit">${lista.map(a => lineaAnot('merma', a,
      `${esc(a.nombre)} · ${esc(R.cantidadTexto(a.cantidad, a.unidad))}`,
      `${esc(R.MOTIVOS[a.motivo] || a.motivo || '')}${a.congelado ? ' · se perdió congelado' : ''}${a.nota ? ' · ' + esc(a.nota) : ''} · ${esc(a.por || '')} · ${esc(M.fechaCorta(a.fecha))} ${esc(horaDe(a.en))}`)).join('')}</div>` : '<p class="ayuda">Sin anotaciones.</p>'}
    ${avisoCopia()}`;
}
// Lo que se puede anotar como merma en el área
function itemsMerma() {
  const area = E.area;
  const recetas = E.recetas.filter(r => r.area === area && r.estado !== 'anulada').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const mps = E.mps.filter(m => ED.habilitada(m, area) && (m.estado || 'activa') === 'activa' && m.tipo !== 'sub_receta').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return [
    ...recetas.filter(r => r.tipo !== 'sub_receta').map(r => ({ tipo: 'receta', x: r, grupo: 'Productos' })),
    ...recetas.filter(r => r.tipo === 'sub_receta').map(r => ({ tipo: 'receta', x: r, grupo: 'Preparaciones (sub recetas)', sub: true })),
    ...mps.map(m => ({ tipo: 'mp', x: m, grupo: 'Materias primas' }))
  ];
}
function dialogoMerma() {
  const d = $('dialogo'), items = itemsMerma();
  // Bollería: qué se puede perder congelado (masas base y productos que van al congelador)
  const masas = E.area === 'BOL' ? B.masasBase(E.recetas, E.area).map(r => r.id) : [];
  const congelables = E.area === 'BOL' ? productosBol().map(r => r.id) : [];
  let elegido = null, motivo = 'derrame_error';
  const lista = filtro => {
    const q = String(filtro || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const vis = items.filter(it => !q || it.x.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)).slice(0, 40);
    let grupo = '';
    $('mm-lista').innerHTML = vis.length ? vis.map(it => {
      const cab = it.grupo !== grupo ? `<div class="rotulo mm-grupo">${esc(it.grupo)}</div>` : ''; grupo = it.grupo;
      const k = it.tipo + ':' + it.x.id;
      return `${cab}<button type="button" class="mm-op" data-mm="${esc(k)}" aria-pressed="${elegido && elegido.k === k}">${esc(it.x.nombre)}</button>`;
    }).join('') : '<p class="ayuda">No hay nada con ese nombre.</p>';
  };
  const marcar = () => {
    const u = elegido ? R.unidadDe(elegido.tipo, elegido.x) : 'un';
    $('mm-u').textContent = elegido ? R.textoUnidad(u, 2) : '';
    $('mm-elegido').textContent = elegido ? elegido.x.nombre : 'Elige qué se perdió';
    d.querySelectorAll('[data-motivo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.motivo === motivo)));
    const cong = elegido && elegido.tipo === 'receta' && (masas.includes(elegido.x.id) || congelables.includes(elegido.x.id));
    $('mm-cong-caja').classList.toggle('oculto', !cong);
    if (!cong) $('mm-cong').checked = false;
  };
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>Anotar merma · hoy</h2>
      <div class="campo"><label for="mm-buscar">¿Qué se perdió?</label><input id="mm-buscar" autocomplete="off" placeholder="Buscar producto, preparación o materia prima"></div>
      <div class="mm-lista" id="mm-lista" role="group" aria-label="Opciones"></div>
      <p class="mm-elegido"><b id="mm-elegido"></b></p>
      <div class="fila-aj"><label for="mm-cant">Cantidad</label><input id="mm-cant" inputmode="decimal" autocomplete="off"><span class="gr" id="mm-u"></span></div>
      <h3 class="rotulo">Motivo</h3>
      <div class="botones-n" role="group" aria-label="Motivo">${Object.entries(R.MOTIVOS).map(([k, t]) => `<button type="button" class="btn-sec" data-motivo="${k}" aria-pressed="false">${esc(t)}</button>`).join('')}</div>
      <div id="mm-cong-caja" class="oculto">
        <label class="check"><input type="checkbox" id="mm-cong"> Se perdió estando congelado (sale del stock congelado)</label>
        <p class="ayuda">Márquenlo solo si estaba en el congelador (por ejemplo, vencido o dañado ahí). Si ya lo habían descongelado o sacado para hornear, no lo marquen: ya salió del stock cuando lo anotaron en la bitácora.</p>
      </div>
      <div class="campo"><label for="mm-nota">Nota (opcional)</label><input id="mm-nota" maxlength="200" autocomplete="off"></div>
      <div class="error" id="mm-error" role="alert"></div>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">Anotar</button></div>
    </form>`;
  lista(''); marcar(); d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.onchange = null;
  d.oninput = ev => { $('mm-error').textContent = ''; if (ev.target.id === 'mm-buscar') lista(ev.target.value); };
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (b.dataset.mm) { const it = items.find(x => x.tipo + ':' + x.x.id === b.dataset.mm); elegido = it ? { ...it, k: b.dataset.mm } : null; lista($('mm-buscar').value); marcar(); $('mm-cant').focus(); return; }
    if (b.dataset.motivo) { motivo = b.dataset.motivo; marcar(); return; }
    if (!b.dataset.guardar) return;
    const err = t => { $('mm-error').textContent = t; };
    if (!elegido) return err('Elige qué se perdió.');
    const t = $('mm-cant').value.trim();
    if (!/^\d+([.,]\d+)?$/.test(t) || !(M.num(t) > 0)) return err('Escribe la cantidad (un número mayor que 0).');
    const u = R.unidadDe(elegido.tipo, elegido.x), n = M.num(t);
    if (u === 'un' && elegido.tipo === 'receta' && n !== Math.round(n) && !confirm(`¿${M.unidades(n)} unidades? Normalmente se pierden unidades enteras.`)) return;
    const cong = $('mm-cong').checked;
    const a = { tipo: elegido.tipo, item: elegido.x.id, nombre: elegido.x.nombre, sub: !!elegido.sub, cantidad: n, unidad: u, motivo, nota: $('mm-nota').value.trim().slice(0, 200), por: quien(), en: ahoraIso() };
    if (cong) { a.congelado = true; a.congeladoDe = masas.includes(elegido.x.id) ? 'masa' : 'producto'; }
    d.close();
    guardarSinEsperar(guardarDia(M.hoyTxt(), { merma: { [idAnot()]: a }, registrosPendientes: true }), 'Merma anotada.');
    programarRegistros();
  };
}

// ═══════════════ Cafetería: bitácora de turno ═══════════════
// Calibraciones (shots × gramos por shot), café botado y pruebas de receta, en gramos de café.
// Queda a nombre de quien entró con su PIN; si anota por otra persona de Cafetería, la elige.
const gPorShot = () => M.num((E.config || {}).gramos_por_shot) || R.GRAMOS_SHOT;
function vistaTurno() {
  if (!E.cargado.diasArea) return '<div class="vacio">Cargando…</div>';
  const per = R.periodo(E.periodoTurno), lista = R.delPeriodo(E.diasArea, 'turno', per), t = R.totalesCafe(lista);
  const tiles = [['calibracion', 'Calibración'], ['merma', 'Café botado'], ['prueba_receta', 'Pruebas de receta']].map(([k, n]) =>
    `<div class="caja cifra"><span class="rotulo">${n}</span><b>${esc(M.gramos(t[k]))}</b>${k === 'calibracion' && t.shots ? `<span class="ayuda">${M.miles(t.shots)} shots</span>` : ''}</div>`).join('');
  return `
    <div class="botones-bit">${Object.entries(R.TIPOS_CAF).map(([k, n]) => `<button type="button" class="btn-sec" data-turno-nuevo="${k}">${ic(k === 'calibracion' ? 'cafe' : k === 'merma' ? 'merma' : 'libro')}${esc(n)}</button>`).join('')}</div>
    ${chipsPeriodo('periodoTurno', E.periodoTurno, ['hoy', 'semana', 'mes', 'mes_ant'])}
    <section class="resumen resumen-cafe">${tiles}<div class="caja cifra total"><span class="rotulo">Total de café</span><b>${esc(M.gramos(t.total))}</b><span class="ayuda">${esc(gPorShot())} g por shot</span></div></section>
    <h2 class="titulo">Anotaciones</h2>
    ${lista.length ? `<div class="lista-bit">${lista.map(a => lineaAnot('turno', a,
      `${esc(R.TIPOS_CAF[a.tipo] || a.tipo)} · ${a.tipo === 'calibracion' ? `${M.miles(a.shots)} ${M.num(a.shots) === 1 ? 'shot' : 'shots'} × ${esc(M.unidades(a.gPorShot))} g = ` : ''}${esc(M.gramos(a.gramos))}`,
      `${esc((a.barista && a.barista.nombre) || a.por || '')}${a.nota ? ' · ' + esc(a.nota) : ''} · ${esc(M.fechaCorta(a.fecha))} ${esc(horaDe(a.en))}`)).join('')}</div>` : '<p class="ayuda">Sin anotaciones en este período.</p>'}
    ${avisoCopia()}`;
}
function dialogoTurno(tipo) {
  const d = $('dialogo'), cal = tipo === 'calibracion', gps = gPorShot();
  const personas = personasDelArea(), yo = E.persona || {};
  const opciones = personas.some(p => p.id === yo.email) ? personas : [{ id: yo.email || '', nombre: yo.nombre || '' }, ...personas];
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>${esc(R.TIPOS_CAF[tipo])} · hoy</h2>
      <div class="campo"><label for="tu-barista">Barista</label><select id="tu-barista">${opciones.map(p => `<option value="${esc(p.id)}" ${p.id === yo.email ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>
      <div class="filas-aj">
        ${cal ? `<div class="fila-aj"><label for="tu-shots">Shots</label><input id="tu-shots" inputmode="numeric" value="1" autocomplete="off"><span class="gr"></span></div>
          <div class="fila-aj"><label for="tu-gps">Gramos por shot<small>De la configuración: ${esc(M.unidades(gps))} g</small></label><input id="tu-gps" inputmode="decimal" value="${esc(String(gps).replace('.', ','))}" autocomplete="off"><span class="gr">g</span></div>`
          : `<div class="fila-aj"><label for="tu-g">Gramos de café</label><input id="tu-g" inputmode="decimal" autocomplete="off"><span class="gr">g</span></div>`}
      </div>
      <p class="ayuda" id="tu-total"></p>
      <div class="campo"><label for="tu-nota">Nota (opcional)</label><input id="tu-nota" maxlength="200" autocomplete="off" placeholder="${cal ? 'Ej: molienda 2,5, extracción 28 s' : tipo === 'merma' ? 'Ej: se botó por molienda gruesa' : 'Ej: prueba de latte de temporada'}"></div>
      <div class="error" id="tu-error" role="alert"></div>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">Anotar</button></div>
    </form>`;
  const total = () => cal ? R.gramosCafe(tipo, $('tu-shots').value, M.num($('tu-gps').value)) : R.gramosCafe(tipo, 0, 0, M.num($('tu-g').value));
  const pintarTotal = () => { $('tu-total').textContent = `Total: ${M.gramos(total())} de café.`; };
  pintarTotal(); d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.onchange = null;
  d.oninput = () => { $('tu-error').textContent = ''; pintarTotal(); };
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (!b.dataset.guardar) return;
    const err = t => { $('tu-error').textContent = t; };
    const dec = id => { const t = $(id).value.trim(); return /^\d+([.,]\d+)?$/.test(t) ? M.num(t) : NaN; };
    let a;
    if (cal) {
      const sh = $('tu-shots').value.trim(), g = dec('tu-gps');
      if (!/^\d+$/.test(sh) || !(Number(sh) > 0)) return err('Escribe cuántos shots (número entero).');
      if (!(g > 0)) return err('Escribe los gramos por shot.');
      a = { tipo, shots: Number(sh), gPorShot: g, gramos: R.gramosCafe(tipo, sh, g) };
    } else {
      const g = dec('tu-g'); if (!(g > 0)) return err('Escribe los gramos de café.');
      a = { tipo, gramos: R.gramosCafe(tipo, 0, 0, g) };
    }
    const sel = $('tu-barista'), p = opciones.find(x => x.id === sel.value) || { id: '', nombre: '' };
    Object.assign(a, { barista: { email: p.id, nombre: p.nombre }, nota: $('tu-nota').value.trim().slice(0, 200), por: quien(), en: ahoraIso() });
    d.close();
    guardarSinEsperar(guardarDia(M.hoyTxt(), { turno: { [idAnot()]: a }, registrosPendientes: true }), 'Anotado.');
    programarRegistros();
  };
}

// ═══════════════ Bodega (P5): llegadas y conteo de las materias primas críticas ═══════════════
// Bodega común: un stock por materia prima. Lo que cuenta un área vale para todas. Se anota en el día de hoy
// del área (dias.bodega) y se copia a la planilla (MP_stock_movimientos). El stock lo calcula Sistema Fën.
function criticas() {
  return E.mps.filter(m => (m.estado || 'activa') === 'activa' && m.tipo !== 'sub_receta' && K.control(m, E.stockmp[m.id]).critica)
    .sort((a, b) => (ED.habilitada(b, E.area) - ED.habilitada(a, E.area)) || a.nombre.localeCompare(b.nombre, 'es'));
}
function vistaBodega() {
  if (!E.cargado.mps || !E.cargado.diasArea || !E.cargado.stockmp) return '<div class="vacio">Cargando…</div>';
  const cr = criticas(), hoy = M.hoyTxt();
  const per = { desde: M.sumarDias(hoy, -13), hasta: hoy }, movs = R.delPeriodo(E.diasArea, 'bodega', per);
  // Lo que calculó Sistema Fën (stock teórico y alertas)
  const est = m => (E.stockmp[m.id] || {}).estado || null;
  const bajos = cr.filter(m => { const e = est(m); return e && (e.bajoAhora || e.bajoDesde); });
  const fila = m => {
    const c = K.control(m, E.stockmp[m.id]), e = est(m);
    const txt = !e ? 'Sin calcular todavía' : !e.contado ? 'Falta un conteo' : `${K.textoEnv(e.stock, c.unidad, c.envase)}${e.alcanza !== null && e.alcanza !== undefined ? ` · alcanza para ~${M.unidades(e.alcanza)} ${M.num(e.alcanza) === 1 ? 'día' : 'días'}` : ''}`;
    const uc = ultimoConteo(m.id);
    return `<div class="fila sub"><span>${esc(m.nombre)}${!ED.habilitada(m, E.area) ? ' <small class="ayuda">(otra área)</small>' : ''}${uc ? `<small class="ayuda bloque">Contada ${esc(uc.texto)}</small>` : ''}</span><span class="${e && (e.bajoAhora || e.bajoDesde) ? 'txt-ojo' : ''}">${esc(txt)}${c.seguridad ? ` · mínimo ${esc(K.texto(c.seguridad, c.unidad))}` : ''}</span></div>`;
  };
  const calculado = cr.map(est).filter(Boolean).map(e => e.en).sort().pop();
  return `
    <div class="cab-seccion">
      <p class="ayuda">Bodega común: lo que entra y lo que cuentan aquí vale para todas las áreas. El consumo se descuenta solo: lo que marcan como hecho${E.area === 'CAF' ? ', lo vendido en la caja y el café de la bitácora' : ''}.</p>
      <div class="botones-bit"><button type="button" class="btn btn-fuerte" data-bodega="llegada">${ic('bodega')}Llegó mercadería</button><button type="button" class="btn-sec" data-bodega="conteo">${ic('pasos')}Conteo de bodega</button></div>
    </div>
    ${bajos.length ? `<div class="nota ojo">${ic('alerta')}<span>${bajos.map(m => { const e = est(m); return `<b>${esc(m.nombre)}</b> ${e.bajoAhora ? 'está bajo el mínimo' : 'queda bajo el mínimo el ' + esc(M.fechaLarga(e.bajoDesde).toLowerCase())}`; }).join(' · ')}. Avísale a Administración si no viene un pedido.</span></div>` : ''}
    <div class="caja">
      <span class="rotulo">Materias primas críticas</span>
      ${cr.length ? `<div class="lista-mini">${cr.map(fila).join('')}</div>` : '<span class="ayuda">Administración todavía no marca materias primas críticas.</span>'}
      ${calculado ? `<span class="ayuda">Calculado en Sistema Fën: ${esc(M.fechaCorta(M.hoyTxt(new Date(calculado))))} ${esc(horaDe(calculado))}.</span>` : ''}
    </div>
    <h2 class="titulo">Llegadas y conteos de ${esc(AREAS[E.area].nombre)} (14 días)</h2>
    ${movs.length ? `<div class="lista-bit">${movs.map(a => lineaAnot('bodega', a,
      `${a.tipo === 'conteo' ? 'Conteo' : 'Llegó'}: ${esc(a.nombre)} · ${esc(K.texto(a.cantidad, a.unidad))}${a.detalle ? ` (${esc(M.unidades(a.detalle.envases))} ${esc(K.envases(a.detalle.envase, a.detalle.envases))}${a.detalle.sueltos ? ' + ' + esc(K.texto(a.detalle.sueltos, a.unidad)) : ''})` : ''}`,
      `${a.nota ? esc(a.nota) + ' · ' : ''}${esc(a.por || '')} · ${esc(M.fechaCorta(a.fecha))} ${esc(horaDe(a.en))}`)).join('')}</div>` : '<p class="ayuda">Sin llegadas ni conteos.</p>'}
    ${avisoCopia()}`;
}
// Último conteo de una materia prima (de cualquier área): { texto, hoyOtra }
function ultimoConteo(mpId) {
  const c = E.conteosmp[mpId]; if (!c || c.anulado || !c.fecha) return null;
  const hoy = M.hoyTxt(), area = AREAS[c.area] ? AREAS[c.area].nombre : c.area;
  return {
    texto: `${c.fecha === hoy ? 'hoy' : M.fechaCorta(c.fecha)} ${horaDe(c.en)} · ${area}${c.por ? ' (' + c.por + ')' : ''} · ${K.texto(c.cantidad, c.unidad)}`,
    hoyOtra: c.fecha === hoy && c.area !== E.area ? `${area} ya la contó hoy a las ${horaDe(c.en)}` : ''
  };
}
function dialogoBodega(tipo) {
  const d = $('dialogo'), cr = criticas(), conteo = tipo === 'conteo';
  if (!cr.length) { avisar('Administración todavía no marca materias primas críticas (Sistema Fën → Producción → Bodega).', true); return; }
  const campo = m => {
    const u = K.unidadMp(m), uc = conteo ? ultimoConteo(m.id) : null;
    const notas = [!ED.habilitada(m, E.area) ? 'De otra área' : '', uc ? 'Último conteo: ' + uc.texto : ''].filter(Boolean);
    const env = K.control(m, E.stockmp[m.id]).envase;
    const etiqueta = `<label for="bo-${esc(m.id)}">${esc(m.nombre)}${env ? `<small>En ${esc(K.envases(env.nombre, 2))} de ${esc(K.texto(env.tamano, u))} + lo suelto</small>` : ''}${notas.map(n => `<small>${esc(n)}</small>`).join('')}${uc && uc.hoyOtra ? `<small class="txt-ojo" data-ya-contada="${esc(m.id)}">${esc(uc.hoyOtra)}: si la cuentan de nuevo, vale la última.</small>` : ''}</label>`;
    if (!env) return `<div class="fila-aj">${etiqueta}<input id="bo-${esc(m.id)}" data-bo="${esc(m.id)}" inputmode="decimal" autocomplete="off"><span class="gr">${K.unidadEntrada(u)}</span></div>`;
    return `<div class="fila-aj fila-env">${etiqueta}<div class="env-campos">
        <input id="bo-${esc(m.id)}" data-bo="${esc(m.id)}" inputmode="decimal" autocomplete="off" aria-label="${esc(K.envases(env.nombre, 2))}"><span class="gr">${esc(K.envases(env.nombre, 2))}</span>
        <span class="mas">+</span>
        <input id="bo-${esc(m.id)}-s" data-bo-suelto="${esc(m.id)}" inputmode="decimal" autocomplete="off" aria-label="${esc(K.unidadEntrada(u))} sueltos"><span class="gr">${K.unidadEntrada(u)} sueltos</span>
      </div><span class="gr env-total" id="bo-${esc(m.id)}-t"></span></div>`;
  };
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>${conteo ? 'Conteo de bodega' : 'Llegó mercadería'} · hoy</h2>
      <p class="ayuda">${conteo ? 'Cuenten lo que hay ahora de cada una (en sacos, kg, litros o unidades, según diga). Las que no cuenten, déjenlas vacías. El conteo reemplaza lo que decía la cuenta desde este momento.' : 'Escriban lo que llegó (en sacos, kg, litros o unidades, según diga). Lo demás, vacío.'}</p>
      <div class="filas-aj">${cr.map(campo).join('')}</div>
      ${conteo ? '' : '<div class="campo"><label for="bo-nota">Proveedor o factura (opcional)</label><input id="bo-nota" maxlength="120" autocomplete="off"></div>'}
      <div class="error" id="bo-error" role="alert"></div>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">${conteo ? 'Guardar conteo' : 'Anotar llegada'}</button></div>
    </form>`;
  d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.onchange = null;
  // Con envase: sacos × tamaño + lo suelto (en kg, l o un). Devuelve { total, envases, sueltos } o null si está vacío; 'mal' si no es número
  const leer = m => {
    const u = K.unidadMp(m), env = K.control(m, E.stockmp[m.id]).envase;
    const a = ($('bo-' + m.id).value || '').trim(), b = env ? ($('bo-' + m.id + '-s').value || '').trim() : '';
    if (a === '' && b === '') return null;
    if ((a && !/^\d+([.,]\d+)?$/.test(a)) || (b && !/^\d+([.,]\d+)?$/.test(b))) return 'mal';
    if (!env) return { total: K.aBase(a, u) };
    return { total: M.num(a) * env.tamano + K.aBase(b, u), envases: M.num(a), sueltos: K.aBase(b, u), env };
  };
  d.oninput = () => {
    $('bo-error').textContent = '';
    cr.forEach(m => { const t = $('bo-' + m.id + '-t'); if (!t) return; const r = leer(m); t.textContent = r && r !== 'mal' ? '= ' + K.texto(r.total, K.unidadMp(m)) : ''; });
  };
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (!b.dataset.guardar) return;
    const entradas = {}, nota = conteo ? '' : $('bo-nota').value.trim().slice(0, 120);
    for (const m of cr) {
      const r = leer(m); if (r === null) continue;
      if (r === 'mal') { $('bo-error').textContent = `${m.nombre}: escribe solo números.`; return; }
      if (!conteo && !(r.total > 0)) { $('bo-error').textContent = `${m.nombre}: la cantidad que llegó tiene que ser mayor que 0.`; return; }
      const u = K.unidadMp(m), a = { tipo, mp: m.id, nombre: m.nombre, cantidad: Math.round(r.total * 100) / 100, unidad: u, nota, por: quien(), en: ahoraIso() };
      if (r.env) a.detalle = { envase: r.env.nombre, tamano: r.env.tamano, envases: r.envases, sueltos: Math.round(r.sueltos * 100) / 100 };
      entradas[idAnot()] = a;
    }
    if (!Object.keys(entradas).length) { $('bo-error').textContent = conteo ? 'Escribe al menos un conteo.' : 'Escribe lo que llegó.'; return; }
    d.close();
    const hoy = M.hoyTxt();
    guardarSinEsperar(guardarDia(hoy, { bodega: entradas, registrosPendientes: true }), conteo ? 'Conteo guardado.' : 'Llegada anotada.');
    // El último conteo de cada una, para que lo vean las otras áreas
    if (conteo) Object.entries(entradas).forEach(([id, a]) => guardarSinEsperar(setDoc(doc(db, 'conteosmp', a.mp), { mp: a.mp, nombre: a.nombre, area: E.area, fecha: hoy, id, cantidad: a.cantidad, unidad: a.unidad, por: a.por, en: a.en, anulado: false })));
    programarRegistros();
  };
}

// La merma y la bitácora de Cafetería se copian a la planilla ("Registro_merma" y "CAF_registros"): el
// script lee los días con registrosPendientes y no duplica (cada anotación lleva su id).
// Un reloj por área (una tablet con varias áreas no pisa el reintento de otra)
E.registros = {};
const reg = (area = E.area) => E.registros[area] || (E.registros[area] = { t: 0, corriendo: false, error: '' });
function programarRegistros(ms = 10000, area = E.area) { const r = reg(area); clearTimeout(r.t); r.t = setTimeout(() => pasarRegistros(area), ms); }
function revisarRegistros() { const r = reg(); if (Object.values(E.diasArea).some(d => d && d.registrosPendientes) && !r.t && !r.corriendo) programarRegistros(5000); }
async function pasarRegistros(area) {
  const deArea = typeof area === 'string' ? area : E.area, R0 = reg(deArea);
  R0.t = 0;
  if (R0.corriendo || !E.usuario || navigator.onLine === false) { programarRegistros(60000, deArea); return; }
  R0.corriendo = true;
  try {
    const r = await llamarScript({ action: 'cocina_registros', area: deArea });
    if (!r || r.ok !== true) throw new Error((r && (r.error || r.msg)) || 'sin respuesta');
    R0.error = '';
  } catch (e) { R0.error = e.message || String(e); programarRegistros(120000, deArea); }
  finally {
    R0.corriendo = false;
    // Si se anotó algo mientras copiaba, ese día quedó pendiente: se vuelve a revisar
    if (deArea === E.area) revisarRegistros();
    repintar();
  }
}

function recortar(lista) { return lista.slice(-30); }

// El formulario de recetas (editor.js) usa estas piezas de la app
ED.configurar({ E, db, doc, setDoc, esc, ic, avisar, quien, ahoraIso, serverTimestamp, $, pintar, guardarSinEsperar, ctx, AREAS });
