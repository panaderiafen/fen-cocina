// ═══════════════════════════════════════════════ 
//  fën · Cocina — la app de las jefas  v0.17.0
//  v0.17.0: BODEGAS POR ÁREA RESPONSABLE (Sistema Fën v0.65.0 → "Asignar responsables"). Cuando se confirman, cada área ve,
//  cuenta y recibe en Bodega solo las materias primas de las que es responsable (Panadería la harina, aunque la use Bollería;
//  Bollería, Pastelería y Cafetería las suyas). El aviso de bajo el mínimo (arriba de la Bodega y en Hoy) es solo de lo suyo
//  y el correo va a Administración y a las jefas de esta área (script v2.11.0). Cada guardado de llegadas o conteos declara
//  las anotaciones que toca (movIds) para las reglas v1.8.0. Sin confirmar: igual que la v0.16.4.
//  v0.16.4: Panadería → Hoy: las masas (sub recetas "Masa …", menos masa madre, poolish y pie) van en "Recetas del día",
//  primero, con su tarjeta completa y "Para: 150 Ciabatta · 20 Focaccia (1,5 c/u)". La jefa elige cuáles en "Ordenar Hoy"
//  (ajustes/{AREA}__hoy.hoy.recetasDia = { subId: true|false }; sin elegir: lo de por defecto). Mismas claves (sub_{id}).
//  v0.16.3: chips de estado en Recetas (todas las áreas), pie de masa madre destacado en Hoy, check junto al título de lo terminado.
//  v0.16.2: revisión de pantallas (celular, tablets, PC): marcarTablasAnchas() avisa cuando una tabla se desliza.
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
//  v0.16.0: BODEGAS SEPARADAS. La Bodega de cada área muestra solo su bodega (Cafetería: la de Cafetería; Panadería,
//  Bollería y Pastelería: la de Producción, como siempre), y solo cuenta y recibe en ella (config/bodegas, reglas v1.7.0).
//  Bajo el mínimo: aviso arriba de la Bodega y una línea en Hoy / Bitácora de turno (sin costos), y la tablet pide al
//  script (v2.9.0, stock_alerta) el correo del día a Administración y a las jefas de esa bodega.
//  La calibración diaria editada pasa a la planilla (CAF_registros).
//  v0.14.0: Hoy (todas las áreas) se pinta con el color del área cuando es el día de hoy; otro día: fondo normal y
//  "Volver a hoy". La barra de la fecha queda fija arriba al bajar. Bollería: los empastes se hacen la semana en que se
//  laminan (corrección de Emmanuel): "Elaboré" ya no suma empastes; anotación nueva "Hice empastes" y panel Empastes
//  de la semana (necesarios, usados al laminar, en el refri, hechos, faltan); el PEM ya no tiene empastes.
//  v0.13.1: el domingo ya cuenta para la semana siguiente ("La próxima" y el descuento de lo congelado parten el domingo);
//  el PEM de una semana que ya pasó no pide inventario.
//  v0.13.0: Metas con stock inicial (del congelador) y "dejar para la próxima semana": a formar = meta − inicial + dejar;
//  el PEM y lo que sobra en el congelador se calculan con eso. Empastes: no se descongelan, se gastan al laminar (Formé).
//  v0.12.3: Masas se titula solo "PEM · lun 5 al vie 9 oct" (cabe en el celular).
//  v0.12.2: las anotaciones anuladas van abajo, en "Anuladas (N)" cerrado (Bitácora, Merma, Turno, Bodega).
//  v0.12.1: Bitácora con una línea por cosa; Masas se titula Plan de elaboración de masas (PEM), la meta abajo.
//  v0.12.0: Bollería descuenta de lo que hay que elaborar las masas que ya sobran en el congelador (congelado.js),
//  con un aviso de por qué se piden menos; Bollería también tiene "Marcar todo como hecho". Panadería: copiar de
//  cualquier semana y "Deshacer la copia".
//  v0.11.1: Bollería, en Metas y Masas: bajo "Meta del…" dice en qué días se elaboran las masas (semana anterior).
//  v0.11.0: el conteo de bodega vale como cierre de su día (lo hecho ese día ya está incluido). Panadería: aviso de
//  que "Marcar terminada" descuenta la bodega y "Marcar todo como hecho".
//  v0.10.0: lo que Administración configura con envase (saco de 25 kg…) se cuenta y se recibe en sacos + lo suelto,
//  y el stock también se ve en sacos.
//  v0.9.0: al contar la bodega se ve quién contó cada materia prima la última vez, y avisa si otra área ya la
//  contó hoy (conteosmp/{mpId}, reglas v1.6.0).
//  v0.15.0 (Cafetería, parte 1): calibración diaria automática en la Bitácora de turno (N shots cada día que se
//  vende; "Editar" guarda el número real del día en dias/CAF_{fecha}.calibracionDiaria, con historial); "Derramado"
//  (una o más preparaciones, como merma de receta con derramado: true: Sistema Fën la valoriza y la bodega descuenta
//  la preparación entera); la Bitácora de turno es solo de hoy (sin cambiar de día ni de período); la Merma de
//  Cafetería muestra hoy y se puede anotar en un día anterior (hasta 7 días atrás). Las recetas de Cafetería se
//  crean y cambian aquí (desde v0.8.0), con textos propios del área en el formulario.
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
} from './firebase.js?v=0.17.0';
import * as M from './modelo.js?v=0.11.0';
import * as B from './bolleria.js?v=0.11.0';
import * as ED from './editor.js?v=0.17.0';
import * as R from './registros.js?v=0.11.0';
import * as K from './consumo.js?v=0.17.0';
import * as CG from './congelado.js?v=0.17.0';
import * as CF from './cafeteria.js?v=0.17.0';

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
  metas: {}, diasArea: {}, ajenos: {}, propuestas: {}, solicitudes: {}, editor: null, lunesMeta: metaProx(), periodoMerma: 'semana', stockmp: {}, conteosmp: {}, mapa: null,
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
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  gota: '<path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10z"/>',
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
  copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  deshacer: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  imprimir: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 14h10v6H7z"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
// v0.16.3: el check junto al título de lo terminado (además del título en verde)
const marcaTerminada = `<span class="marca-terminada" role="img" aria-label="Terminada">${ic('check')}</span>`;

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
  E.fecha = M.hoyTxt(); E.lunesPlan = M.lunesDe(E.fecha); E.lunesMeta = metaProx(E.fecha);   // cada área parte en hoy
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
  // v0.16.0: qué área usa qué bodega (config/bodegas; reglas v1.7.0). Sin el documento o sin permiso: lo de siempre
  escuchar('bodegas', doc(db, 'config', 'bodegas'), sn => { E.mapa = K.mapaBodegas(sn.exists() ? sn.data() : null); repintar(); },
    () => { E.mapa = K.mapaBodegas(null); return 'silencio'; });
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
// v0.13.1: la meta "próxima" es la que se elabora esta semana (su PEM). El domingo no hay producción y ya se
// prepara la semana que viene: el domingo cuenta como parte de la semana siguiente.
function metaProx(h = M.hoyTxt()) { return M.sumarDias(M.lunesDe(M.indiceDia(h) === 6 ? M.sumarDias(h, 1) : h), 7); }
function revisarCambioDeDia() {
  const h = M.hoyTxt(); if (h === E.hoyVisto) return;
  if (E.fecha === E.hoyVisto) E.fecha = h;
  if (E.lunesPlan === M.lunesDe(E.hoyVisto)) E.lunesPlan = M.lunesDe(h);
  if (E.lunesMeta === metaProx(E.hoyVisto)) E.lunesMeta = metaProx(h);
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
    : v === 'bitacora' ? 'Bitácora · ' + M.fechaLarga(E.fecha) : v === 'merma' ? 'Merma · lo que se pierde' : v === 'bodega' ? 'Bodega · materias primas críticas' : v === 'turno' ? 'Bitácora de turno · ' + M.fechaLarga(M.hoyTxt()) : v === 'metas' ? 'Metas · semana ' + M.etiquetaSemana(E.lunesMeta) : v === 'masas' ? `Masas · PEM ${etiquetaPem(E.lunesMeta)}`
    : M.fechaLarga(E.fecha) + ' · semana ' + M.etiquetaSemana(M.lunesDe(E.fecha));
  // v0.14.0: en Hoy (Panadería, Bollería, Pastelería), si es el día de hoy, toda la pantalla toma el color del área
  document.body.classList.toggle('dia-hoy', v === 'hoy' && E.fecha === M.hoyTxt());
  // v0.16.0: en Hoy y en la Bitácora de turno, una línea con lo de la bodega del área que está bajo el mínimo
  const lb = v === 'hoy' || v === 'turno' ? lineaBodegaHoy() : '';
  main.innerHTML = lb + (v === 'recetas' && E.editor ? ED.vistaEditor() : v === 'plan' ? vistaPlan() : v === 'recetas' ? vistaRecetas() : v === 'metas' ? vistaMetas() : v === 'masas' ? vistaMasas() : v === 'bitacora' ? vistaBitacora() : v === 'merma' ? vistaMerma() : v === 'bodega' ? vistaBodega() : v === 'turno' ? vistaTurno() : E.area === 'BOL' ? vistaHoyBol() : E.area === 'PAS' ? vistaHoyPas() : vistaHoy());
  if (v === 'recetas' && E.editor) ED.actualizarCalculos();
  marcarTablasAnchas();
  if (guardado && $(guardado.id)) {
    const el = $(guardado.id); el.value = guardado.valor; el.focus();
    if (el.dataset.celda || el.dataset.num) el.classList.toggle('error-celda', !/^\s*\d*\s*$/.test(el.value));
    try { el.setSelectionRange(guardado.ini, guardado.fin); } catch (e) {}
    if (v === 'recetas' && E.editor) ED.trasPintar(el);
  }
}

// v0.16.2: una tabla más ancha que la pantalla (celular) se desliza dentro de su caja; se avisa con una línea
// "Desliza para ver todos los días" y una sombra al borde (estilos.css). Se revisa al pintar y al girar la tablet.
function marcarTablasAnchas() {
  document.querySelectorAll('#principal .tabla-caja').forEach(c => {
    const ancha = c.scrollWidth > c.clientWidth + 4;
    c.classList.toggle('ancha', ancha);
    c.classList.toggle('al-final', ancha && c.scrollLeft + c.clientWidth >= c.scrollWidth - 2);
    if (!c.dataset.desliza) { c.dataset.desliza = '1'; c.addEventListener('scroll', () => c.classList.toggle('al-final', c.scrollLeft + c.clientWidth >= c.scrollWidth - 2), { passive: true }); }
    let aviso = c.previousElementSibling;
    if (!aviso || !aviso.classList.contains('aviso-desliza')) { aviso = document.createElement('p'); aviso.className = 'aviso-desliza'; aviso.innerHTML = `${ic('der')}Desliza la tabla hacia el lado para ver todo`; c.before(aviso); }
    aviso.hidden = !ancha;
  });
}
addEventListener('resize', () => marcarTablasAnchas());

// ── Hoy ──
// v0.14.0: barra de la fecha (fija arriba al bajar). Hoy: "Hoy" marcado y el fondo del color del área (lo pone pintar);
// otro día: "Volver a hoy" a la vista
function navDia(f) {
  const esHoy = f === M.hoyTxt();
  return `<div class="nav-fecha nav-dia ${esHoy ? 'es-hoy' : 'otro-dia'}">
      <button type="button" class="btn-flecha" data-dia="-1" aria-label="Día anterior">${ic('izq')}</button>
      <h2>${esc(M.fechaLarga(f))}${esHoy ? ' <span class="chip-hoy">Hoy</span>' : ''}</h2>
      <button type="button" class="btn-flecha" data-dia="1" aria-label="Día siguiente">${ic('der')}</button>
      ${esHoy ? '' : `<button type="button" class="btn-sec btn-volver-hoy" data-dia="hoy">${ic('hoy')}Volver a hoy</button>`}
    </div>`;
}
function vistaHoy() {
  if (!E.cargado.recetas || !E.cargado.mps) return '<div class="vacio">Cargando…</div>';
  const f = E.fecha, lunes = M.lunesDe(f);
  const plan = asegurarPlan(lunes); asegurarPlan(M.sumarDias(lunes, 7)); asegurarPlan(M.sumarDias(lunes, 14)); const dia = asegurarDia(f) || {};
  const nav = navDia(f);
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
      <div class="caja caja-pie ${hecho('pie_' + t) ? 'hecha' : ''}" data-pie-card="${t}">
        <span class="rotulo rotulo-pie"><span class="chip-pie">Pie de masa madre ${t}</span> · toca hoy${hecho('pie_' + t) ? marcaTerminada : ''}</span>
        <span class="grande num">${M.gramos(pie[t].total)}</span>
        <div class="lista-mini">${pie[t].desglose.map(x => `<div class="fila sub"><span>${esc(x.nombre)}</span><span>${M.gramos(x.gramos)}</span></div>`).join('')}</div>
        <span class="ayuda">Cubre hasta el ${esc(M.fechaCorta(pie.cubiertos[pie.cubiertos.length - 1]))} + reserva ${pie.reservaPct} %.</span>
        ${btnHecho('pie_' + t)}
      </div>`).join('');
  E.tarjetas = {};
  // v0.16.4: las masas elegidas van en Recetas del día (primero); el resto sigue en Elaboraciones previas
  const masasDia = el.subRecetas.filter(vaEnRecetasDia), previas = el.subRecetas.filter(s => !vaEnRecetasDia(s));
  const elabs = previas.map(s => tarjetaElab(s, s.recetaId ? ajHoy[s.recetaId] : null, dia, hecho, c)).join('');
  const masasHtml = masasDia.map(s => tarjetaElab(s, s.recetaId ? ajHoy[s.recetaId] : null, dia, hecho, c, planDia)).join('');
  const enDia = new Set(masasDia.map(s => s.id));
  const ins = Object.entries(el.insumos).filter(([, g]) => g > 0.5).sort((a, b) => b[1] - a[1]);
  const harina = M.harinaDe(el.insumos);
  const cajaIns = ins.length ? `<div class="caja">
      <span class="rotulo">Insumos del día</span>
      <span class="grande num">${harina ? esc(M.enSacos(harina, C.KG_SACO)) : M.gramos(ins[0][1])}</span>
      <span class="ayuda">${harina ? 'de harina en total' : esc(ins[0][0])}</span>
      <details class="desp"><summary>Ver todos (${ins.length})</summary><div class="lista-mini">${ins.map(([n, g]) => `<div class="fila sub"><span>${esc(n)}</span><span>${M.gramos(g)}</span></div>`).join('')}</div></details>
    </div>` : '';
  const recetas = planDia.map(x => tarjetaReceta(x, ajHoy[x.receta.id], dia, hecho, enDia)).join('');
  const notas = dia.notas || {};
  // Lo que falta marcar del día: recetas y elaboraciones previas (las recetas descuentan la bodega)
  const pendientes = [...masasDia.map(s => 'sub_' + s.id), ...planDia.map(x => 'rec_' + x.receta.id), ...previas.map(s => 'sub_' + s.id)].filter(k => !hecho(k));
  const avisoHecho = `<div class="nota neutra aviso-hecho">${ic('alerta')}<span><b>Marcar terminada descuenta la bodega</b> (las materias primas de esa receta). Al cerrar el día, que todo lo hecho quede marcado.</span>
      ${pendientes.length ? `<button type="button" class="btn-sec" data-todo-hecho="${esc(pendientes.join(','))}">${ic('check')}Marcar todo como hecho (${pendientes.length})</button>` : `<span class="chip-ok">${ic('ok')}Todo marcado</span>`}</div>`;
  return nav + `
    <section class="resumen" aria-label="Antes de empezar">${cajaPie}${cajaIns}</section>
    ${elabs ? `<h2 class="titulo">Elaboraciones previas · ${previas.length}</h2>${elabs}` : ''}
    <div class="titulo-fila-hoy"><h2 class="titulo">Recetas del día · ${planDia.length + masasDia.length}</h2>${subRecetasSemana(lunes).length ? `<button type="button" class="btn-link" data-ordenar-hoy="1">${ic('ajuste')}Ordenar Hoy</button>` : ''}</div>
    ${avisoHecho}
    ${masasHtml}
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
  return `<article class="receta ${o.elab ? 'elab' : ''} ${o.clase || ''} ${h ? 'terminada' : ''}" ${o.attr || (o.elab ? 'data-elab-card' : 'data-receta-card')}="${esc(o.idCard)}">
      <div class="receta-cab">
        <div style="display:flex;flex-direction:column;gap:4px;min-width:0">
          ${o.rotulo || o.elab ? `<span class="rotulo">${esc(o.rotulo || 'Elaboración previa')}</span>` : ''}
          <b>${esc(o.nombre)}${h ? marcaTerminada : ''}</b>
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
        <span class="der">${o.botonFinal ? o.botonFinal : h ? `<button type="button" class="btn-sec btn-hecho" data-hecho="${esc(o.claveHecho)}" data-valor="0">${ic('check')}Terminada · deshacer</button>`
          : `<button type="button" class="btn" data-hecho="${esc(o.claveHecho)}" data-valor="1">${ic('check')}Marcar terminada</button>`}</span>
      </div>
    </article>`;
}

function tarjetaReceta({ receta: r, unidades }, aj, dia, hecho, enDia) {
  const c = ctx(), esPan = E.area === 'PAN', P = M.panadero(r);
  // Un producto hecho de una masa (Ciabatta = Masa ciabatta): la harina y el agua se ajustan en la masa
  const subsR = (r.ingredientes || []).filter(i => M.esSub(i, c) && !M.esPieMM(i.nombre)), masas = subsR.map(i => i.nombre);
  const dondeAj = subsR.length && enDia && subsR.every(i => enDia.has(i.id)) ? 'arriba, en Recetas del día' : 'elaboraciones previas';
  return tarjeta({ clave: r.id, idCard: r.id, rid: r.id, receta: r, nombre: r.nombre, unidad: r.unidad === 'g' ? 'g' : 'un', total: unidades, dia, hecho,
    claveHecho: 'rec_' + r.id, aj, escalar: t => M.escalar(r, t, aj, c), conPct: esPan,
    detalle: `${M.unidades(unidades)} ${r.unidad === 'g' ? 'g' : 'unidades'}`,
    ajustable: esPan && P.ajustable, ajusteEn: esPan && !P.ajustable && masas.length ? `Harina y agua: se ajustan en ${masas.join(', ')} (${dondeAj})` : '' });
}

function tarjetaElab(s, aj, dia, hecho, c, planDia) {
  const rs = s.recetaId ? E.recetas.find(r => r.id === s.recetaId) : null, P = rs ? M.panadero(rs) : null;
  const total = s.porUnidades ? s.unidades : Math.round(s.gramos);
  const para = [...new Set(s.usan.map(u => u.nombre))];
  // v0.16.4: una masa que va en "Recetas del día" dice para cuántos productos es (y cuánto lleva cada uno)
  const enDia = !!planDia;
  return tarjeta({ clave: 'sub_' + s.id, idCard: s.id, elab: true, rid: rs ? rs.id : null, receta: rs, nombre: s.nombre, unidad: s.porUnidades ? 'un' : 'g', total, dia, hecho,
    claveHecho: 'sub_' + s.id, aj, escalar: t => M.escalarSub(s, t, aj, c), conPct: E.area === 'PAN',
    rotulo: enDia ? 'Masa · sub receta' : '', clase: enDia ? 'masa-dia' : '',
    detalle: s.porUnidades ? `${M.unidades(s.unidades)} un · ${M.gramos(s.gramos)}` : M.gramos(s.gramos),
    para: enDia ? esc(paraLinea(s, planDia)) : `Para ${esc(para.join(', '))}`, ajustable: E.area === 'PAN' && !!(P && P.ajustable) });
}

// ── v0.16.4 · Sub recetas que van en "Recetas del día" (por área) ──
// ajustes/{AREA}__hoy = { area, recetaId: '_hoy', periodos: [], hoy: { recetasDia: { subId: true|false }, por, en } }
// (va en ajustes porque las jefas ya pueden escribir ahí: reglas v1.7.0 sin cambios; periodos vacío = no es un ajuste).
// Lo que la jefa no tocó sigue lo de por defecto: las "Masa …" (no la masa madre, el poolish ni el pie).
const CLAVE_HOY = '_hoy';
const normTxt = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const masaPorDefecto = nombre => { const n = normTxt(nombre); return /^masa /.test(n) && !/masa madre|poolish|\bpie\b/.test(n); };
const elegidasHoy = () => ((E.ajustes[CLAVE_HOY] || {}).hoy || {}).recetasDia || {};
const vaEnRecetasDia = s => { const v = elegidasHoy()[s.id]; return typeof v === 'boolean' ? v : masaPorDefecto(s.nombre); };
// "Para: 150 Ciabatta · 20 Focaccia (1,5 c/u)": cuántos de cada producto del día y cuánto de la masa lleva cada uno
function paraLinea(s, planDia) {
  const porOrigen = {}; s.usan.forEach(u => { porOrigen[u.nombre] = (porOrigen[u.nombre] || 0) + u.gramos; });
  const partes = planDia.filter(x => porOrigen[x.receta.nombre] > 0).map(x => {
    const g = porOrigen[x.receta.nombre], n = M.num(x.unidades), un = x.receta.unidad === 'g' ? ' g' : '';
    let cu = '';
    if (n > 0 && s.porUnidades && s.gramos > 0) { const v = g * s.unidades / s.gramos / n; if (Math.abs(v - 1) > 0.001) cu = ` (${M.unidades(Math.round(v * 1000) / 1000)} c/u)`; }
    else if (n > 0 && !s.porUnidades && x.receta.unidad !== 'g') cu = ` (${M.unidades(Math.round(g / n * 10) / 10)} g c/u)`;
    return `${M.unidades(n)}${un} ${x.receta.nombre}${cu}`;
  });
  return 'Para: ' + (partes.length ? partes.join(' · ') : [...new Set(s.usan.map(u => u.nombre))].join(', '));
}
// Las sub recetas que usa lo planificado en la semana (para elegir aunque hoy no toquen)
function subRecetasSemana(lunes) {
  const plan = E.planes[lunes], vistas = {};
  if (!plan) return [];
  for (let i = 0; i < 7; i++) {
    const f = M.sumarDias(lunes, i), pd = M.planDelDia(plan, f, E.recetas);
    if (pd.length) M.elaboracionesDia(pd, ajustesDe(f), ctx()).subRecetas.forEach(s => { if (!vistas[s.id]) vistas[s.id] = { id: s.id, nombre: s.nombre }; });
  }
  return Object.values(vistas).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
function dialogoOrdenarHoy() {
  const subs = subRecetasSemana(M.lunesDe(E.fecha)); if (!subs.length) return;
  const el = elegidasHoy(), d = $('dialogo');
  d.innerHTML = `<form method="dialog" class="dlg" id="f-ordenar-hoy">
      <div class="dlg-cab-i"><h2>Ordenar Hoy</h2><button type="button" class="btn-i" data-info-hoy="1" aria-expanded="false" aria-controls="oh-info" aria-label="Qué es esto">${ic('info')}</button></div>
      <p class="ayuda info-texto" id="oh-info" hidden>Las sub recetas marcadas se muestran en <b>Recetas del día</b>, primero y con su tarjeta completa (ingredientes, tandas, ajuste, terminada), con la línea "Para:" de los productos que las usan. Las no marcadas quedan en <b>Elaboraciones previas</b> (masa madre, poolish…). Solo cambia dónde se ven: marcarla terminada, la bodega y el historial son iguales. Vale para todos los días de esta área y la dupla lo ve al instante.</p>
      <fieldset class="lista-check"><legend class="rotulo">Sub recetas que van en Recetas del día</legend>
        ${subs.map(s => `<label class="check"><input type="checkbox" data-oh="${esc(s.id)}" ${vaEnRecetasDia(s) ? 'checked' : ''}> ${esc(s.nombre)}${typeof el[s.id] === 'boolean' ? '' : ' <span class="ayuda">(por defecto)</span>'}</label>`).join('')}
      </fieldset>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">Guardar</button></div>
    </form>`;
  d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.oninput = null;
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.infoHoy) { const p = $('oh-info'), abrir = p.hidden; p.hidden = !abrir; b.setAttribute('aria-expanded', String(abrir)); return; }
    if (b.dataset.cerrar) { d.close(); return; }
    if (b.dataset.guardar) {
      const recetasDia = {}; d.querySelectorAll('[data-oh]').forEach(i => { recetasDia[i.dataset.oh] = i.checked; });
      d.close();
      const datos = { area: E.area, recetaId: CLAVE_HOY, hoy: { recetasDia, por: quien(), en: ahoraIso() } };
      if (!E.ajustes[CLAVE_HOY]) datos.periodos = [];
      guardarSinEsperar(setDoc(doc(db, 'ajustes', `${E.area}_${CLAVE_HOY}`), datos, { merge: true }), 'Hoy ordenado.');
    }
  };
}


// ═══════════════ Bollería ═══════════════
const avisoPermiso = () => `<div class="nota ojo">${ic('alerta')}<span>Este equipo no puede leer las metas de Bollería. Pide a Administración que publique las reglas de fen-produccion v1.1.0 o más nuevas (ver README).</span></div>`;
// Semana de la meta (lunes) → la elaboración de masas es la semana anterior (lun–vie)
const semanaElab = lunesMeta => M.sumarDias(lunesMeta, -7);
const recetaPorId = id => E.recetas.find(r => r.id === id);
// Lo que hay que elaborar para una meta, con las masas que ya sobran en el congelador descontadas (congelado.js)
// "Dejar para la próxima semana" de una meta: lo suyo o, si no lo pusieron, lo de las semanas anteriores
const dejarEfectivo = l => CG.dejarDe(asegurarMetas(l), asegurarMetas(M.sumarDias(l, -7)), asegurarMetas(M.sumarDias(l, -14))).dejar;
// v0.13.0: plan de la semana de una meta (meta − stock inicial + dejar = a formar), con las metas de las 2 semanas anteriores
function planDe(l, hoy = M.hoyTxt()) {
  const d = { metas: asegurarMetas(l), metasAnt: asegurarMetas(M.sumarDias(l, -7)), metasAnt2: asegurarMetas(M.sumarDias(l, -14)), metasAnt3: asegurarMetas(M.sumarDias(l, -21)) };
  if (!d.metas || !d.metasAnt || !d.metasAnt2 || !d.metasAnt3 || !E.cargado.diasArea) return null;
  return CG.planSemana(l, d, E.diasArea, hoy);
}
// Lo que hay que elaborar para una meta: masas para lo que hay que formar, menos las que ya sobran en el congelador
function necesidadesMeta(lunes, m, hoy = M.hoyTxt()) {
  const c = ctx(), plan = planDe(lunes, hoy), el = semanaElab(lunes);
  const base = B.necesidades(plan ? CG.aFormar(plan) : ((m && m.productos) || {}), c, E.config);
  const sinDescontar = estado => ({ nec: CG.descontar(base, null), sob: { estado, desde: el, porMasa: {} }, plan });
  if (hoy < M.sumarDias(el, -1)) return sinDescontar('futuro');
  const planE = planDe(el, hoy);
  if (!planE || !plan) return sinDescontar('cargando');
  const sob = CG.sobrantes(E.diasArea, lunes, { planE, ctx: c, cfg: E.config }, hoy);
  return { nec: CG.descontar(base, sob), sob, plan };
}
// Aviso (limpio) de por qué se piden menos masas que las de la meta
function avisoCongelado(lunes, r) {
  const el = semanaElab(lunes), s = r.sob;
  if (s.estado === 'pasado') return '';
  if (s.estado === 'sinInventario') return `<div class="nota ojo">${ic('alerta')}<span>Sin inventario del congelador no se pueden descontar las masas que ya hay: se pide todo lo del plan. Anótenlo en la <a href="#bitacora">Bitácora</a>.</span></div>`;
  if (s.estado === 'futuro') return `<p class="ayuda">Desde el ${esc(M.fechaCorta(M.sumarDias(el, -1)))} (con el inventario del congelador) se descuentan solas las masas que sobren.</p>`;
  const con = r.nec.masas.filter(x => x.congeladas > 0);
  if (s.estado !== 'ok' || !con.length) return '';
  const cierre = M.fechaCorta(s.hasta);
  return `<div class="nota neutra aviso-congelado">${ic('copo')}<div>
      <span><b>Se piden menos masas porque ya hay congeladas.</b> ${esc(con.map(x => `${x.masa.nombre}: ${M.miles(x.meta)} del plan − ${M.miles(x.congeladas)} congeladas = ${M.miles(x.masas)}`).join(' · '))}.</span>
      <details class="desp"><summary>Cómo se calcula</summary>
        ${con.map(x => { const p = s.porMasa[x.masa.id]; return `<div class="calculo"><b>${esc(x.masa.nombre)}</b><span>${M.miles(p.congeladas)} en el congelador (${esc(cierre)}) − ${M.miles(p.elaboradas)} ya elaboradas para esta meta − ${M.miles(p.faltaDescongelar)} por descongelar para lo que falta formar la semana del ${esc(M.etiquetaSemana(el))} = <b>${M.miles(p.sobran)} de más</b></span></div>`; }).join('')}
        <p class="ayuda">Sale de la Bitácora (inventario, elaboré, descongelé, formé, merma congelada) y del plan de esa semana. Si algo no se anotó, el número no calza: hagan un inventario del congelador.</p>
      </details></div></div>`;
}
// "lun 5 al vie 9 oct": los días en que se elaboran las masas (PEM) de una meta
const MES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function etiquetaPem(lunesMeta) {
  const a = semanaElab(lunesMeta), b = M.sumarDias(a, 4), ma = Number(a.slice(5, 7)) - 1, mb = Number(b.slice(5, 7)) - 1;
  return `lun ${Number(a.slice(8))}${ma !== mb ? ' ' + MES_C[ma] : ''} al vie ${Number(b.slice(8))} ${MES_C[mb]}`;
}
// v0.12.1: en Metas manda la meta; en Masas manda el Plan de elaboración de masas (PEM) y la meta va abajo, más chica
function navMeta(vista = 'metas') {
  const l = E.lunesMeta;
  const titulo = vista === 'masas'
    ? `<div class="titulo-meta"><h2>PEM · ${esc(etiquetaPem(l))}</h2><span class="elab-semana">Para la meta del ${esc(M.etiquetaSemana(l))}</span></div>`
    : `<h2>Meta del ${esc(M.etiquetaSemana(l))}</h2>`;
  return `<div class="nav-fecha">
      <button type="button" class="btn-flecha" data-meta-sem="-7" aria-label="Semana anterior">${ic('izq')}</button>
      ${titulo}
      <button type="button" class="btn-flecha" data-meta-sem="7" aria-label="Semana siguiente">${ic('der')}</button>
      ${l !== metaProx() ? '<button type="button" class="btn-sec" data-meta-sem="prox">La próxima</button>' : ''}
    </div>`;
}
// Un número guardado por celda (meta o masas de un día); lo mal escrito queda marcado
function campoNum(id, tipo, rid, d, valor, etiqueta) {
  const mala = E.celdasMalas[E.lunesMeta + '|' + id];
  return `<label class="sr" for="${esc(id)}">${esc(etiqueta)}</label><input id="${esc(id)}" inputmode="numeric" data-num="${tipo}" data-rid="${esc(rid)}"${d !== null ? ` data-d="${d}"` : ''} value="${mala !== undefined ? esc(mala) : (M.num(valor) || '')}" class="${mala !== undefined ? 'error-celda' : ''}" autocomplete="off">`;
}
function valorGuardado(t) {
  const m = E.metas[E.lunesMeta] || {};
  return t.dataset.num === 'meta' ? M.num((m.productos || {})[t.dataset.rid]) : t.dataset.num === 'dejar' ? M.num(dejarEfectivo(E.lunesMeta)[t.dataset.rid]) : M.num(((m.elaboracion || {})[t.dataset.rid] || {})['d' + t.dataset.d]);
}
function guardarNumero(t) {
  const lunes = E.lunesMeta, key = lunes + '|' + t.id, texto = t.value, rid = t.dataset.rid;
  if (!/^\s*\d*\s*$/.test(texto) || Math.round(M.num(texto)) > 99999) { E.celdasMalas[key] = texto; t.classList.add('error-celda'); avisar(t.dataset.num !== 'elab' ? 'Escribe un número entero (piezas).' : 'Escribe un número entero (masas).', true); return; }
  delete E.celdasMalas[key]; t.classList.remove('error-celda'); t.classList.add('guardando');
  const n = Math.round(M.num(texto)), r = recetaPorId(rid);
  const datos = { area: E.area, lunes, nombres: { [rid]: r ? r.nombre : rid }, actualizado: { por: quien(), en: serverTimestamp() } };
  if (t.dataset.num === 'meta') datos.productos = { [rid]: n };
  else if (t.dataset.num === 'dejar') datos.dejar = { [rid]: n };
  else datos.elaboracion = { [rid]: { ['d' + t.dataset.d]: n } };
  // "Dejar" vale lo de la semana anterior mientras no lo cambien: al tocar la meta se guarda lo heredado, así pasa a la siguiente
  if (t.dataset.num !== 'elab') {
    const m0 = E.metas[lunes] || {}, her = dejarEfectivo(lunes);
    Object.entries(her).forEach(([id, v]) => { if (!((m0.dejar || {}).hasOwnProperty(id)) && !(datos.dejar && id in datos.dejar)) (datos.dejar = datos.dejar || {})[id] = M.num(v); });
  }
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
  const NM = necesidadesMeta(E.lunesMeta, m), nec = NM.nec;
  const sinMasa = E.recetas.filter(r => r.area === E.area && r.tipo !== 'sub_receta' && r.estado === 'consolidada' && !prods.some(p => p.receta.id === r.id));
  const enPrueba = B.productos(E.recetas, c).filter(p => p.receta.estado !== 'consolidada' && !(M.num(metas[p.receta.id]) > 0));
  const el = semanaElab(E.lunesMeta);
  const plan = NM.plan || {};
  const filas = prods.map(p => {
    const id = p.receta.id, n = M.num(metas[id]), x = plan[id] || { inicial: 0, fuente: 'previsto', dejar: 0, heredado: false, aFormar: n };
    return `<tr><td class="nombre">${esc(p.receta.nombre)}${p.receta.estado !== 'consolidada' ? ` <span class="estado">${esc(ESTADOS[p.receta.estado] || p.receta.estado)}</span>` : ''}<small>${esc(p.masa.nombre)} · 1 masa rinde ${M.unidades(1 / p.masas)}</small></td>
      <td>${campoNum('m-' + id, 'meta', id, null, n, 'Meta de ' + p.receta.nombre)}</td>
      <td class="num">${x.inicial ? `− ${M.miles(x.inicial)}` : '—'}<small>${x.fuente === 'real' ? 'congelado' : 'previsto'}</small></td>
      <td>${campoNum('d-' + id, 'dejar', id, null, x.dejar, 'Dejar para la próxima semana: ' + p.receta.nombre)}${x.heredado ? '<small>como la semana pasada</small>' : ''}</td>
      <td class="num"><b>${x.aFormar ? M.miles(x.aFormar) : '—'}</b></td>
      <td class="num">${x.aFormar ? M.unidades(x.aFormar * p.masas) : '—'}</td></tr>`;
  }).join('');
  const resumen = nec.masas.map(x => `<div class="caja">
      <span class="rotulo">${esc(x.masa.nombre)}</span>
      <span class="grande num">${M.miles(x.masas)} masas</span>
      ${x.congeladas ? `<span class="ayuda congeladas">${ic('copo')}${M.miles(x.meta)} del plan − ${M.miles(x.congeladas)} ya congeladas</span>` : ''}
      <span class="ayuda">${M.gramos(x.kg * 1000)} de masa${x.merma ? ` · incluye ${M.unidades(x.merma)} % de merma de laminado` : ''}${Math.abs((x.meta ?? x.masas) - x.exactas) > 0.001 ? ` · exactas ${M.unidades(x.exactas)}, se redondea a masas enteras` : ''}</span>
      <div class="lista-mini">${x.productos.map(p => `<div class="fila sub"><span>${esc(p.receta.nombre)} · ${M.miles(p.piezas)}</span><span>${M.unidades(p.masas)} masas</span></div>`).join('')}</div>
    </div>`).join('');
  return navMeta() + `
    <p class="ayuda"><b>Meta</b>: lo que sale en la semana. <b>Stock inicial</b>: los productos formados y congelados con que parte la semana (sale de la Bitácora el domingo antes; hasta entonces es lo que planearon dejar). <b>Dejar</b>: el sobre stock que quieren dejar para la próxima semana. <b>A formar</b> = meta − stock inicial + dejar; de ahí salen las masas del PEM (${esc(etiquetaPem(E.lunesMeta))}). Cada número se guarda solo.</p>
    ${nec.avisos.map(a => `<div class="nota ojo">${ic('alerta')}<span>${esc(a)}</span></div>`).join('')}
    <div class="tabla-caja"><table class="plan metas">
      <thead><tr><th scope="col">Producto</th><th scope="col">Meta</th><th scope="col">Stock inicial</th><th scope="col">Dejar próx. semana</th><th scope="col">A formar</th><th scope="col">Masas</th></tr></thead>
      <tbody>${filas || '<tr><td colspan="6" style="text-align:left;color:var(--suave);padding:18px 10px">No hay productos aprobados que lleven una masa base.</td></tr>'}</tbody>
    </table></div>
    ${resumen ? `<h2 class="titulo">Hay que elaborar</h2>${avisoCongelado(E.lunesMeta, NM)}<section class="resumen">${resumen}</section><p class="ayuda"><a href="#masas">Repartir en el PEM →</a></p>
    ${nec.masas.some(x => x.gPorEmpaste > 0) ? `<p class="ayuda">Los empastes no van en el PEM: se hacen la semana de la meta (${esc(M.etiquetaSemana(E.lunesMeta))}), según lo que se forma. Se anotan en la Bitácora → Empastes.</p>` : ''}` : ''}
    ${enPrueba.length ? `<p class="ayuda">En prueba (no se ofrecen para metas hasta que se aprueben): ${esc(enPrueba.map(p => p.receta.nombre).join(', '))}.</p>` : ''}
    ${sinMasa.length ? `<p class="ayuda">No entran a las metas porque no llevan una masa base: ${esc(sinMasa.map(r => r.nombre).join(', '))}.</p>` : ''}`;
}

function vistaMasas() {
  if (!E.cargado.recetas || !E.cargado.mps) return '<div class="vacio">Cargando…</div>';
  const m = asegurarMetas(E.lunesMeta);
  if (!m) return navMeta('masas') + '<div class="vacio">Cargando…</div>';
  if (m.sinPermiso) return navMeta('masas') + avisoPermiso();
  const NM = necesidadesMeta(E.lunesMeta, m), nec = NM.nec, elab = m.elaboracion || {};
  const el = semanaElab(E.lunesMeta), hoy = M.hoyTxt();
  const ids = [...new Set([...nec.masas.map(x => x.masa.id), ...Object.keys(elab).filter(id => B.sumaDias(elab[id]) > 0)])];
  const filas = ids.map(id => { const x = nec.masas.find(y => y.masa.id === id); return { id, masa: x ? x.masa : recetaPorId(id), nec: x }; }).filter(x => x.masa)
    .sort((a, b) => a.masa.nombre.localeCompare(b.masa.nombre, 'es'));
  const dias = [0, 1, 2, 3, 4];
  const porTandaDe = masa => B.masasPorTanda(masa, E.config), tpd = B.tandasPorDia(E.config);
  const cuerpo = filas.map(x => {
    const plan = elab[x.id] || {}, hecho = B.sumaDias(plan), necesarias = x.nec ? x.nec.masas : 0, dif = necesarias - hecho;
    const cubierta = x.nec && x.nec.congeladas > 0 && !necesarias;
    const estado = cubierta && !hecho ? `<span class="chip ok">Cubierta con lo congelado</span>` : !necesarias && !hecho ? '' : dif > 0 ? `<span class="chip ojo">Faltan ${M.miles(dif)}</span>` : dif < 0 ? `<span class="chip">Sobran ${M.miles(-dif)}</span>` : '<span class="chip ok">Completo</span>';
    return `<tr data-masa="${esc(x.id)}"><td class="nombre">${esc(x.masa.nombre)}<small>${M.miles(necesarias)} necesarias${x.nec && x.nec.congeladas ? ` (${M.miles(x.nec.meta)} del plan − ${M.miles(x.nec.congeladas)} congeladas)` : ''} · ${porTandaDe(x.masa)} por tanda</small></td>
      ${dias.map(d => `<td class="${M.sumarDias(el, d) === hoy ? 'hoy-col' : ''}">${campoNum(`e-${x.id}-${d}`, 'elab', x.id, d, plan['d' + d], `${x.masa.nombre} ${M.DIAS_CORTOS[d]}`)}</td>`).join('')}
      <td class="num"><b>${M.miles(hecho)}</b></td><td>${estado}<button type="button" class="btn-link" data-repartir="${esc(x.id)}" data-n="${necesarias}">Repartir parejo</button></td></tr>`;
  }).join('');
  // Por día: masas, tandas (masas enteras por tanda) y kilos. v0.14.0: sin empastes (se hacen la semana de la meta)
  const pie = dias.map(d => {
    let masas = 0, tandas = 0, kg = 0;
    filas.forEach(x => { const n = M.num((elab[x.id] || {})['d' + d]); masas += n; tandas += B.tandasMasas(n, porTandaDe(x.masa)).length; kg += n * B.pesoMasa(x.masa) / 1000; });
    return { masas, tandas, kg, pasa: tandas > tpd };
  });
  const cap = filas.length ? filas.map(x => `${esc(x.masa.nombre)}: ${porTandaDe(x.masa)} masas por tanda (${M.gramos(B.pesoMasa(x.masa))} c/u)`).join(' · ') : '';
  return navMeta('masas') + `
    <p class="ayuda">Reparte las masas de la meta en los días de elaboración: cada número se guarda solo. Los empastes no van aquí: se hacen la semana de la meta, según lo que se forma (Bitácora → Empastes).</p>
    ${nec.avisos.map(a => `<div class="nota ojo">${ic('alerta')}<span>${esc(a)}</span></div>`).join('')}
    ${filas.length ? avisoCongelado(E.lunesMeta, NM) : ''}
    ${!filas.length ? `<div class="vacio">${ic('meta')}<b>Sin metas para esa semana</b><a href="#metas">Poner las metas</a></div>` : `
    <div class="tabla-caja"><table class="plan masas">
      <thead><tr><th scope="col">Masa base</th>${dias.map(d => `<th scope="col" class="${M.sumarDias(el, d) === hoy ? 'hoy-col' : ''}">${M.DIAS_CORTOS[d]} ${Number(M.sumarDias(el, d).slice(8))}</th>`).join('')}<th scope="col">Total</th><th scope="col"><span class="sr">Estado</span></th></tr></thead>
      <tbody>${cuerpo}</tbody>
      <tfoot>
        <tr><td>Tandas</td>${pie.map(p => `<td class="num ${p.pasa ? 'pasa' : ''}">${p.tandas || ''}</td>`).join('')}<td></td><td class="ayuda">${tpd} por día</td></tr>
        <tr><td>Kilos de masa</td>${pie.map(p => `<td class="num">${p.kg ? M.unidades(p.kg) : ''}</td>`).join('')}<td class="num">${M.unidades(pie.reduce((s, p) => s + p.kg, 0))}</td><td></td></tr>
      </tfoot>
    </table></div>
    ${pie.some(p => p.pasa) ? `<div class="nota ojo">${ic('alerta')}<span>${esc(pie.map((p, d) => p.pasa ? `${M.DIAS_CORTOS[d]}: ${p.tandas} tandas` : '').filter(Boolean).join(' · '))}: más de las ${tpd} tandas de un día normal.</span></div>` : ''}
    <p class="ayuda">Amasadora: ${cap}. La capacidad y las tandas por día se cambian en Sistema Fën (Configuración de Producción).</p>`}`;
}

// Hoy de Bollería: las masas que tocan hoy (de la meta de la semana siguiente), sus elaboraciones previas, los insumos
// y (v0.14.0) los empastes de la semana en curso (se hacen la semana en que se laminan, no con las masas)
function vistaHoyBol() {
  if (!E.cargado.recetas || !E.cargado.mps) return '<div class="vacio">Cargando…</div>';
  const f = E.fecha, idx = M.indiceDia(f), lunesMeta = M.sumarDias(M.lunesDe(f), 7);
  const m = asegurarMetas(lunesMeta), dia = asegurarDia(f) || {};
  const nav = navDia(f);
  if (!m) return nav + '<div class="vacio">Cargando…</div>';
  if (m.sinPermiso) return nav + avisoPermiso();
  const c = ctx(), hechos = dia.hechos || {}, necA = necesidadesMeta(lunesMeta, m, f).nec;   // necA: con lo congelado descontado
  const hecho = k => hechos[k] && hechos[k].por ? hechos[k] : null;
  const masasHoy = B.masasBase(E.recetas, E.area).map(rs => ({ rs, n: M.num(((m.elaboracion || {})[rs.id] || {})['d' + idx]) })).filter(x => x.n > 0);
  E.tarjetas = {};
  const empSem = seccionEmpastesHoy(f, dia, hecho);
  const aviso = `<p class="ayuda">"Marcar terminada" en una masa la anota en la <a href="#bitacora">Bitácora</a> (masas elaboradas y congeladas). El formado, el horneado y los empastes se anotan allá.</p>`;
  if (!masasHoy.length) return nav + `<div class="vacio">${ic('capas')}<b>Sin masas programadas para este día</b><a href="#masas">Ir a Masas</a></div>` + empSem + aviso;
  // v0.12.0: como en Panadería, el aviso de que marcar terminada descuenta la bodega + "Marcar todo como hecho" (más abajo)
  const planDia = masasHoy.map(x => ({ receta: x.rs, unidades: x.n }));
  const el = M.elaboracionesDia(planDia, {}, c);
  const previas = el.subRecetas.map(s => tarjetaElab(s, null, dia, hecho, c)).join('');
  const masas = masasHoy.map(x => {
    const porTanda = B.masasPorTanda(x.rs, E.config);
    return tarjeta({ clave: 'masa_' + x.rs.id, idCard: x.rs.id, attr: 'data-masa-card', rid: x.rs.id, receta: x.rs, nombre: x.rs.nombre, rotulo: 'Masa base', unidad: 'un', un: 'masas', total: x.n, dia, hecho,
      claveHecho: 'masa_' + x.rs.id, escalar: t => M.escalar(x.rs, t, null, c), conPct: false, porTanda,
      detalle: `${M.miles(x.n)} ${x.n === 1 ? 'masa' : 'masas'} · ${M.gramos(x.n * B.pesoMasa(x.rs))}`, defecto: B.tandasMasas(x.n, porTanda), ajustable: false });
  }).join('');
  const ins = Object.entries(el.insumos).filter(([, g]) => g > 0.5).sort((a, b) => b[1] - a[1]);
  const cajaIns = ins.length ? `<div class="caja">
      <span class="rotulo">Insumos del día</span>
      <span class="grande num">${M.gramos(ins[0][1])}</span>
      <span class="ayuda">${esc(ins[0][0])}</span>
      <details class="desp"><summary>Ver todos (${ins.length})</summary><div class="lista-mini">${ins.map(([n, g]) => `<div class="fila sub"><span>${esc(n)}</span><span>${M.gramos(g)}</span></div>`).join('')}</div></details>
    </div>` : '';
  const total = masasHoy.reduce((s, x) => s + x.n, 0);
  const cajaMeta = `<div class="caja"><span class="rotulo">Para la meta del ${esc(M.etiquetaSemana(lunesMeta))}</span><span class="grande num">${M.miles(total)} ${total === 1 ? 'masa' : 'masas'} hoy</span>
      <div class="lista-mini">${necA.masas.map(x => { const hechas = B.sumaDias((m.elaboracion || {})[x.masa.id]); return `<div class="fila sub larga"><span>${esc(x.masa.nombre)}</span><span>${M.miles(hechas)} programadas de ${M.miles(x.masas)} necesarias${x.congeladas ? ` (${M.miles(x.congeladas)} ya congeladas)` : ''}</span></div>`; }).join('')}</div></div>`;
  const notas = dia.notas || {};
  // Lo que falta marcar: masas (van a la Bitácora y descuentan la bodega) y elaboraciones previas
  const pendientes = [...masasHoy.map(x => 'masa_' + x.rs.id), ...el.subRecetas.map(s => 'sub_' + s.id)].filter(k => !hecho(k));
  const avisoHecho = `<div class="nota neutra aviso-hecho">${ic('alerta')}<span><b>Marcar terminada descuenta la bodega.</b> Cada masa terminada pasa al congelador en la <a href="#bitacora">Bitácora</a> y descuenta sus materias primas (solo la masa: los empastes se anotan aparte, con "Hice empastes"); lo formado se anota allá. Al cerrar el día, que todo lo hecho quede marcado.</span>
      ${pendientes.length ? `<button type="button" class="btn-sec" data-todo-hecho="${esc(pendientes.join(','))}">${ic('check')}Marcar todo como hecho (${pendientes.length})</button>` : `<span class="chip-ok">${ic('ok')}Todo marcado</span>`}</div>`;
  return nav + `
    <section class="resumen" aria-label="Antes de empezar">${cajaMeta}${cajaIns}</section>
    ${avisoHecho}
    ${previas ? `<h2 class="titulo">Elaboraciones previas · ${el.subRecetas.length}</h2>${previas}` : ''}
    <h2 class="titulo">Masas del día · ${masasHoy.length}</h2>${masas}
    ${empSem}
    <section class="caja">
      <label class="rotulo" for="notas-dia">Notas del día (las ve la dupla)</label>
      <textarea id="notas-dia" rows="3" style="font: inherit; border: 1px solid var(--borde); border-radius: 10px; padding: 10px 12px; background: var(--suave-fondo)">${esc(notas.texto || '')}</textarea>
      ${notas.por ? `<span class="ayuda">Última nota de ${esc(notas.por)}</span>` : ''}
    </section>`;
}

// ═══════════════ Bollería: empastes de la semana (v0.14.0) ═══════════════
// Los empastes se hacen la semana en que se laminan (lunes a sábado; el domingo ya prepara la semana siguiente),
// según lo que hay que formar esa semana (planSemana). Cálculo en congelado.js (empastesSemana).
function empastesDeLaSemana(f) {
  const W = CG.semanaEmpastes(f), c = ctx();
  if (!E.cargado.diasArea) return null;
  const plan = planDe(W);
  if (!plan) return null;
  const r = CG.empastesSemana(E.diasArea, W, plan, c, f);
  const filas = Object.entries(r).map(([id, x]) => {
    const masa = recetaPorId(id), e = K.empGramosPorMasa(id, c);
    return { id, masa, nombre: masa ? masa.nombre : id, gPor: e ? e.g : 0, receta: e ? e.receta : null, ...x };
  }).filter(x => x.masa).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return { W, filas };
}
const etiquetaSemEmp = W => { const b = M.sumarDias(W, 5), ma = Number(W.slice(5, 7)) - 1, mb = Number(b.slice(5, 7)) - 1; return `lun ${Number(W.slice(8))}${ma !== mb ? ' ' + MES_C[ma] : ''} al sáb ${Number(b.slice(8))} ${MES_C[mb]}`; };
// Hoy de Bollería: una línea por masa ("faltan X · hay Y en el refri") que abre el panel, y la receta del empaste
// escalada a lo que falta, para pesarla ("Hice empastes" desde ahí parte con ese número)
function seccionEmpastesHoy(f, dia, hecho) {
  const R0 = empastesDeLaSemana(f);
  if (!R0) return '';
  if (!R0.filas.length) return '';
  const c = ctx();
  const lineas = R0.filas.map(x => `<button type="button" class="linea-emp" data-empastes="${esc(x.id)}" data-n="${x.faltan}">
      <span class="linea-emp-t"><b>Empastes de la semana${R0.filas.length > 1 ? ` · ${esc(x.nombre)}` : ''}:</b> ${x.faltan ? `faltan ${M.miles(x.faltan)}` : 'no falta ninguno'} <span class="ayuda">(hay ${M.unidades(Math.max(0, x.refri))} en el refri)</span></span>
      ${ic('der')}</button>`).join('');
  const recetas = R0.filas.filter(x => x.faltan > 0 && x.receta && x.gPor > 0).map(x => {
    const er = x.receta, g = Math.round(x.faltan * x.gPor);
    return `<details class="desp emp-receta"><summary>${ic('libro')}&nbsp;Receta del empaste para ${M.miles(x.faltan)} (${M.gramos(g)})</summary>${tarjeta({ clave: 'emp_' + x.id, idCard: x.id, attr: 'data-empaste-receta', rid: er.id, receta: er, nombre: er.nombre, rotulo: 'Empastes de ' + x.nombre, unidad: 'g', total: g, dia, hecho,
      claveHecho: 'emp_' + x.id, escalar: t => M.escalarSub({ id: er.mpId || er.id, nombre: er.nombre, recetaId: er.id, porUnidades: false }, t, null, c), conPct: false,
      detalle: `${M.miles(x.faltan)} de ${M.gramos(x.gPor)} · ${M.gramos(g)}`, ajustable: false,
      botonFinal: `<button type="button" class="btn" data-empastes="${esc(x.id)}" data-n="${x.faltan}">${ic('check')}Hice empastes</button>` })}</details>`;
  }).join('');
  return `<h2 class="titulo">Empastes · semana del ${esc(etiquetaSemEmp(R0.W))}</h2>
    <div class="lista-emp">${lineas}</div>${recetas}`;
}
// Panel "Empastes" (Bitácora y Hoy): por masa, lo de la semana, y el formulario "Hice empastes" (en el día elegido)
function dialogoEmpastes(masaSel, nSug) {
  const d = $('dialogo'), f = E.fecha, R0 = empastesDeLaSemana(f), hoy = M.hoyTxt();
  if (!R0) { avisar('Cargando… inténtalo de nuevo en un momento.', true); return; }
  const filas = R0.filas;
  if (!filas.length) { avisar('Ninguna masa base lleva empaste (revisa las recetas).', true); return; }
  const sel = filas.find(x => x.id === masaSel) || filas.find(x => x.faltan > 0) || filas[0];
  const enRefri = f === hoy ? 'En el refri ahora' : `En el refri al cierre del ${M.fechaCorta(f)}`;
  const fila = (t, v, cls = '') => `<div class="fila sub ${cls}"><span>${esc(t)}</span><span class="num">${v}</span></div>`;
  const cajas = filas.map(x => `<div class="caja caja-emp" data-emp-masa="${esc(x.id)}">
      <span class="rotulo">${esc(x.nombre)}${x.gPor ? ` · ${M.gramos(x.gPor)} por empaste` : ''}</span>
      <div class="lista-mini">
        ${fila('Necesarios esta semana', M.miles(x.necesarios))}
        ${fila('Ya usados al laminar', M.unidades(x.usados))}
        ${fila(enRefri, M.unidades(x.refri))}
        ${fila('Hechos esta semana', M.miles(x.hechos))}
        ${Object.keys(x.porDia).sort().map(k => fila('· ' + M.fechaCorta(k), M.miles(x.porDia[k]), 'dia-emp')).join('')}
        <div class="fila faltan-emp"><span><b>Faltan por hacer</b></span><span class="num"><b>${M.miles(x.faltan)}</b></span></div>
      </div>
    </div>`).join('');
  const v = nSug !== undefined && nSug !== '' ? Math.max(0, Math.round(M.num(nSug))) || '' : (sel.faltan || '');
  d.innerHTML = `<form method="dialog" class="dlg dlg-ancho">
      <h2>Empastes · semana del ${esc(etiquetaSemEmp(R0.W))}</h2>
      <details class="desp info"><summary>${ic('alerta')}&nbsp;Cómo se calcula</summary>
        <p class="ayuda">Los empastes se hacen la misma semana en que se laminan, según lo que hay que formar esa semana (las masas base se elaboran la semana anterior). El domingo ya cuenta para la semana que empieza el lunes.</p>
        <p class="ayuda"><b>Necesarios</b>: lo que hay que formar en la semana (Metas: meta − stock inicial + dejar), pasado a masas según la receta (1 empaste por masa). <b>Usados</b>: los de "Formé" desde el lunes. <b>En el refri</b>: el último inventario + hechos − usados. <b>Faltan</b> = necesarios − usados − en el refri.</p>
      </details>
      <section class="resumen">${cajas}</section>
      <h3 class="rotulo">Hice empastes · ${esc(M.fechaLarga(f))}</h3>
      ${filas.length > 1 ? `<div class="campo"><label for="emp-masa">Masa base</label><select id="emp-masa">${filas.map(x => `<option value="${esc(x.id)}" ${x.id === sel.id ? 'selected' : ''}>${esc(x.nombre)}</option>`).join('')}</select></div>` : `<input type="hidden" id="emp-masa" value="${esc(sel.id)}">`}
      <div class="filas-aj"><div class="fila-aj"><label for="emp-n">Empastes hechos${filas.length > 1 ? '' : ` (${esc(sel.nombre)})`}<small>Van al refri y se descuentan de la bodega (receta del empaste)</small></label><input id="emp-n" inputmode="numeric" value="${esc(String(v))}"><span class="gr" id="emp-g"></span></div></div>
      <div class="error" id="emp-error" role="alert"></div>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cerrar</button><button type="button" class="btn btn-fuerte" data-guardar="1">${ic('check')}Anotar</button></div>
    </form>`;
  const gramos = () => { const x = filas.find(y => y.id === $('emp-masa').value), n = M.num($('emp-n').value); $('emp-g').textContent = x && x.gPor && n > 0 ? M.gramos(n * x.gPor) : ''; };
  d.showModal(); gramos();
  d.onsubmit = ev => ev.preventDefault();
  d.oninput = () => { $('emp-error').textContent = ''; gramos(); }; d.onchange = gramos;
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (!b.dataset.guardar) return;
    const t = $('emp-n').value;
    if (!/^\s*\d+\s*$/.test(t) || !(Math.round(M.num(t)) > 0)) { $('emp-error').textContent = 'Escribe cuántos empastes (número entero mayor que 0).'; return; }
    const a = { tipo: 'empaste', masa: $('emp-masa').value, n: Math.round(M.num(t)), por: quien(), en: ahoraIso() };
    d.close();
    guardarSinEsperar(guardarDia(f, { bitacora: { [idAnot()]: a } }), 'Anotado: ' + M.miles(a.n) + ' empastes al refri.');
  };
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
  const nav = navDia(f);
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
// v0.12.1: cada anotación es un título y una línea por cosa (nombre a la izquierda, número a la derecha),
// como "Congelado al cierre"
function anotFilas(a) {
  const un = (n, s1, s2) => `${M.miles(n)} ${M.num(n) === 1 ? s1 : s2}`;
  if (a.tipo === 'inventario') {
    const filas = [];
    Object.entries(a.masas || {}).forEach(([id, n]) => filas.push([nombreDe(id), un(n, 'masa', 'masas')]));
    Object.entries(a.empastes || {}).forEach(([id, n]) => filas.push([`Empastes de ${nombreDe(id)}`, M.miles(n)]));
    Object.entries(a.productos || {}).forEach(([id, n]) => { if (M.num(n)) filas.push([nombreDe(id), M.miles(n)]); });
    return { titulo: 'Inventario del congelador', filas: filas.length ? filas : [['Vacío', '']] };
  }
  if (a.tipo === 'elaboro') return { titulo: `Elaboré masas → congelador${a.origen === 'hoy' ? ' (desde Hoy)' : ''}`,
    filas: [[nombreDe(a.masa), un(a.n, 'masa', 'masas')], ...(a.conEmpaste !== false ? [['Empastes (anotación antigua: con sus masas)', M.miles(a.n)]] : [])] };
  if (a.tipo === 'empaste') return { titulo: 'Hice empastes → refri', filas: [[`Empastes de ${nombreDe(a.masa)}`, M.miles(a.n)]] };
  if (a.tipo === 'descongelo') return { titulo: 'Descongelé masas',
    filas: [[nombreDe(a.masa), un(a.n, 'masa', 'masas')], ...(a.conEmpaste !== false ? [['Empastes (anotación antigua: salieron con sus masas)', M.miles(a.n)]] : [])] };
  if (a.tipo === 'formo') { const h = M.num(a.n) - M.num(a.congelar); return { titulo: 'Formé',
    filas: [[nombreDe(a.producto), M.miles(a.n)], ['Al congelador', M.miles(a.congelar)], ...(h ? [['Al horno hoy', M.miles(h)]] : []), ...(M.num(a.empastes) ? [['Empastes usados al laminar', M.unidades(a.empastes)]] : [])] }; }
  if (a.tipo === 'horneo') return { titulo: 'Horneé desde el congelador', filas: [[nombreDe(a.producto), M.miles(a.n)]] };
  return { titulo: a.tipo, filas: [] };
}

function vistaBitacora() {
  if (!E.cargado.recetas || !E.cargado.mps || !E.cargado.diasArea) return '<div class="vacio">Cargando…</div>';
  const f = E.fecha, lunes = M.lunesDe(f), m = asegurarMetas(lunes), dia = E.diasArea[f] || asegurarDia(f) || {};
  asegurarMetas(M.sumarDias(lunes, -7)); asegurarMetas(M.sumarDias(lunes, -14));   // para lo que quieren dejar (cierre del viernes)
  planDe(CG.semanaEmpastes(f));   // v0.14.0: deja listas las metas que usa el panel de Empastes
  const nav = navDia(f);
  const c = ctx(), st = CG.stock(E.diasArea, f), cfg = E.config || {};
  const delDia = Object.entries(dia.bitacora || {}).map(([id, a]) => ({ ...a, id })).sort((a, b) => String(a.en || '').localeCompare(String(b.en || '')));
  const botones = Object.entries(B.TIPOS).map(([k, t]) => `<button type="button" class="btn-sec" data-anotar="${k}">${ic(k === 'inventario' ? 'copo' : k === 'formo' || k === 'horneo' ? 'pan' : 'capas')}${esc(t)}</button>`).join('')
    + `<button type="button" class="btn-sec" data-empastes="1">${ic('capas')}Empastes</button>`;   // v0.14.0: panel de la semana + "Hice empastes"
  const lista = delDia.length ? `${listaAnot(delDia, a => `<div class="anot ${a.anulado ? 'anulada' : ''}">
      <div class="anot-cuerpo">${(f => `<b>${esc(f.titulo)}</b><div class="lista-mini">${f.filas.map(([n, v]) => `<div class="fila sub"><span>${esc(n)}</span><span>${esc(v)}</span></div>`).join('')}</div>`)(anotFilas(a))}<span class="ayuda">${esc(a.por || '')} · ${esc(horaDe(a.en))}${a.anulado ? ` · anulada por ${esc(a.anulado.por || '')}` : ''}</span></div>
      ${a.anulado ? '' : `<button type="button" class="btn-link" data-anular="${esc(a.id)}">Anular</button>`}
    </div>`)}` : '<p class="ayuda">Sin anotaciones este día.</p>';
  // Congelado al final del día
  const masas = B.masasBase(E.recetas, E.area).filter(r => M.num(st.masas[r.id]) || M.num(st.empastes[r.id]));
  const prods = productosBol().filter(r => M.num(st.productos[r.id]));
  const totMasas = Object.values(st.masas).reduce((s, n) => s + Math.max(0, n), 0);
  const totCajas = prods.reduce((s, r) => s + (B.cajas(st.productos[r.id], r.unidadesPorCaja) || 0), 0);
  const capM = M.num(cfg.capacidad_congelacion_masas), capP = M.num(cfg.capacidad_productos);
  const negativos = [...Object.entries(st.masas), ...Object.entries(st.productos)].filter(([, n]) => n < 0).map(([id]) => nombreDe(id))
    .concat(Object.entries(st.empastes).filter(([, n]) => n < -0.01).map(([id]) => 'empastes de ' + nombreDe(id)));
  const congelado = `<div class="caja">
      <span class="rotulo">Congelado al cierre del ${esc(M.fechaCorta(f))}</span>
      ${!st.conInventario ? `<div class="nota ojo">${ic('alerta')}<span>Falta el inventario inicial: cuenten el congelador y anótenlo con "Inventario del congelador". Desde ahí todo se mueve solo.</span></div>` : ''}
      <div class="lista-mini">
        ${masas.map(r => `<div class="fila sub"><span>${esc(r.nombre)}</span><span>${M.miles(st.masas[r.id] || 0)} masas · ${M.unidades(st.empastes[r.id] || 0)} empastes en el refri</span></div>`).join('')}
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
  const rend = CG.rendimiento(E.diasArea, lunes, c);
  const cajaRend = Object.keys(rend).filter(id => rend[id].masas > 0 && rend[id].esperadas > 0).map(id => {
    const x = rend[id], dif = x.esperadas - x.masas;
    return `<div class="fila sub"><span>${esc(nombreDe(id))}</span><span>${M.miles(x.masas)} masas descongeladas → piezas para ${M.unidades(x.esperadas)} masas${Math.abs(dif) >= 0.05 ? ` (${dif > 0 ? '+' : ''}${M.unidades(dif)})` : ''}</span></div>`;
  }).join('');
  return nav + `
    <div class="botones-bit">${botones}</div>
    <h2 class="titulo">Anotaciones del día</h2>${lista}
    <section class="resumen" style="margin-top:16px">${congelado}${avance}</section>
    ${cajaRend ? `<div class="caja" style="margin-top:14px"><span class="rotulo">Rendimiento real de la semana</span><div class="lista-mini">${cajaRend}</div><span class="ayuda">Las piezas formadas, pasadas a masas según lo que rinde cada receta, contra las masas descongeladas para esta semana (del domingo antes al sábado). Si salen menos piezas que masas descongeladas, la diferencia es merma o rendimiento menor.</span></div>` : ''}
    <div class="botones" style="margin-top:16px"><button type="button" class="btn-sec" data-cierre="1">${ic('imprimir')}Cierre del viernes (para imprimir)</button></div>`;
}

// ── Diálogo: anotar en la bitácora ──
function dialogoAnotar(tipo) {
  const d = $('dialogo'), f = E.fecha, st = CG.stock(E.diasArea, f);
  const masas = B.masasBase(E.recetas, E.area), prods = productosBol();
  const m = E.metas[M.sumarDias(M.lunesDe(f), 7)] || {}, idx = M.indiceDia(f);
  const sel = (id, lista, valor) => `<select id="${id}">${lista.map(r => `<option value="${esc(r.id)}" ${r.id === valor ? 'selected' : ''}>${esc(r.nombre)}</option>`).join('')}</select>`;
  const num = (id, etiqueta, v, ayuda) => `<div class="fila-aj"><label for="${id}">${esc(etiqueta)}${ayuda ? `<small>${esc(ayuda)}</small>` : ''}</label><input id="${id}" inputmode="numeric" value="${v === '' || v === undefined ? '' : esc(String(v))}"><span class="gr"></span></div>`;
  let cuerpo = '';
  if (tipo === 'inventario') {
    cuerpo = `<p class="ayuda">Cuenten lo que hay en el congelador. Reemplaza lo que la app tenía: desde aquí todo se mueve solo con las anotaciones.</p>
      <p class="ayuda"><b>Antes de contar, marquen como terminadas las masas de hoy</b> (y anoten lo descongelado): lo que se anote después del inventario se suma encima.</p>
      <div class="filas-aj">
        ${masas.map(r => num('inv-m-' + r.id, r.nombre + ' (masas)', M.num(st.masas[r.id]) || '', '') + num('inv-e-' + r.id, 'Empastes de ' + r.nombre, Math.round(M.num(st.empastes[r.id])) || '', 'Los que hay en el refri')).join('')}
        ${prods.map(r => num('inv-p-' + r.id, r.nombre, M.num(st.productos[r.id]) || '', r.unidadesPorCaja ? `${r.unidadesPorCaja} por caja` : '')).join('')}
      </div>`;
  } else if (tipo === 'elaboro' || tipo === 'descongelo') {
    const prog = masas.find(r => M.num(((m.elaboracion || {})[r.id] || {})['d' + idx]));
    const v = tipo === 'elaboro' && prog ? M.num(((m.elaboracion || {})[prog.id] || {})['d' + idx]) : '';
    cuerpo = `<div class="campo"><label for="an-masa">Masa base</label>${sel('an-masa', masas, prog ? prog.id : '')}</div>
      <div class="filas-aj">${num('an-n', tipo === 'elaboro' ? 'Masas elaboradas y congeladas' : 'Masas descongeladas', v, tipo === 'elaboro' ? 'Solo la masa: los empastes se hacen la semana en que se laminan (botón Empastes)' : 'El empaste no se descongela: se usa al laminar')}</div>
      ${tipo === 'descongelo' ? `<p class="ayuda" id="an-emp"></p>` : ''}`;
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
  const resto = () => {
    const ae = $('an-emp');
    if (ae) { const n = M.num($('an-n').value), hay = M.num(st.empastes[$('an-masa').value]); ae.textContent = n ? `Para laminar ${M.miles(n)} ${n === 1 ? 'masa' : 'masas'} necesitan ${M.miles(n)} ${n === 1 ? 'empaste' : 'empastes'}; en el refri hay ${M.unidades(hay)}.${hay < n ? ' ¡Faltan empastes!' : ''}` : ''; }
    const el = $('an-resto'); if (!el) return; const n = M.num($('an-n').value), cg = M.num($('an-cong').value); el.textContent = n ? `Al horno hoy: ${M.miles(Math.max(0, n - cg))}.` : '';
  };
  d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.oninput = () => resto();
  d.onchange = () => resto();
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
      // v0.13.0: el empaste no se descongela; se gasta al laminar (con lo formado). v0.14.0: tampoco se hace con la masa
      // (se hace la semana en que se lamina: "Hice empastes"), así que "Elaboré" ya no suma empastes ni los descuenta de la bodega
      a.conEmpaste = false;
    } else if (tipo === 'formo') {
      const n = entero('an-n'), cg = $('an-cong').value.trim() === '' ? 0 : entero('an-cong');
      if (!(n > 0)) return err('Escribe cuántas piezas formaron.'); if (isNaN(cg) || cg > n) return err('Las del congelador no pueden ser más que las formadas.');
      a = { tipo, producto: $('an-prod').value, n, congelar: cg };
      const em = CG.empastesDe(a.producto, n, ctx()); if (em) Object.assign(a, em);   // los empastes que se usaron al laminar
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
  const d = $('dialogo'), f = E.fecha, st = CG.stock(E.diasArea, f), lunes = M.lunesDe(f);
  const masas = B.masasBase(E.recetas, E.area), prods = productosBol();
  const m = E.metas[lunes] || {}, hor = B.horneado(E.diasArea, lunes), previo = ((E.diasArea[f] || {}).cierre) || {};
  // Sugerencia para el sábado: lo que falta de la meta, sin pasar de lo congelado
  const dejarW = dejarEfectivo(lunes);
  const sugSab = r => { const falta = M.num((m.productos || {})[r.id]) - M.num(hor[r.id]); return Math.max(0, Math.min(falta, M.num(st.productos[r.id]) - M.num(dejarW[r.id]))); };
  const val = (o, id, def) => o && o[id] !== undefined ? o[id] : def;
  const fila = (id, etiqueta, v, ayuda) => `<div class="fila-aj"><label for="${id}">${esc(etiqueta)}${ayuda ? `<small>${esc(ayuda)}</small>` : ''}</label><input id="${id}" inputmode="numeric" value="${M.num(v) || ''}"><span class="gr"></span></div>`;
  d.innerHTML = `<form method="dialog" class="dlg dlg-ancho">
      <h2>Cierre del ${esc(M.fechaLarga(f))}</h2>
      <p class="ayuda">El congelado sale de la bitácora. Lo del sábado y el domingo lo deciden ustedes (para el sábado se sugiere lo que falta de la meta, sin tocar lo que quieren dejar para la próxima semana).</p>
      <h3 class="rotulo">Hornear el sábado ${esc(M.fechaCorta(M.sumarDias(f, 1)))}</h3>
      <div class="filas-aj">${prods.map(r => fila('ci-s-' + r.id, r.nombre, val(previo.sabado, r.id, sugSab(r)), `Congelado: ${M.miles(st.productos[r.id] || 0)}${M.num(dejarW[r.id]) ? ` · dejar ${M.miles(dejarW[r.id])}` : ''}`)).join('')}</div>
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
      ${filas(masas, r => (M.num(st.masas[r.id]) || M.num(st.empastes[r.id])) ? `<tr><td>${esc(r.nombre)}</td><td>${M.miles(st.masas[r.id] || 0)} masas · ${M.unidades(st.empastes[r.id] || 0)} empastes en el refri</td></tr>` : '')}
      ${filas(prods, r => M.num(st.productos[r.id]) ? `<tr><td>${esc(r.nombre)}</td><td>${M.miles(st.productos[r.id])}${B.cajas(st.productos[r.id], r.unidadesPorCaja) !== null ? ` (${B.cajas(st.productos[r.id], r.unidadesPorCaja)} cajas)` : ''}</td></tr>` : '')}
    </tbody></table>
    <h2>Hornear el sábado ${esc(M.fechaCorta(M.sumarDias(f, 1)))}</h2>
    <table><tbody>${filas(prods, r => cierre.sabado[r.id] ? `<tr><td>${esc(r.nombre)}</td><td>${M.miles(cierre.sabado[r.id])}</td></tr>` : '')}</tbody></table>
    <h2>Descongelar el domingo ${esc(M.fechaCorta(M.sumarDias(f, 2)))} para el lunes</h2>
    <table><tbody>
      ${filas(masas, r => cierre.domingo.masas[r.id] ? `<tr><td>${esc(r.nombre)}</td><td>${M.miles(cierre.domingo.masas[r.id])} masas · el lunes laminar con ${M.miles(cierre.domingo.masas[r.id])} empastes</td></tr>` : '')}
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
  // "Deshacer la copia" se ofrece 3 días después de copiar; después ya hubo cambios que no conviene perder
  const deshacer = plan.antesDeCopiar && plan.antesDeCopiar.filas && Date.now() - new Date(plan.antesDeCopiar.en).getTime() < 3 * 864e5 ? plan.antesDeCopiar : null;
  return nav + `
    ${enRevision.length ? `<div class="nota ojo">${ic('alerta')}<span>${esc(enRevision.map(x => x.nombre).join(', '))}: la receta no está aprobada ahora (${esc(enRevision.map(x => ESTADOS[x.r.estado] || x.r.estado).join(', '))}). Su plan se mantiene.</span></div>` : ''}
    <div class="tabla-caja">
      <table class="plan">
        <thead><tr><th scope="col">Receta</th>${M.DIAS_CORTOS.map((d, i) => `<th scope="col" class="${i === hoyIdx ? 'hoy-col' : ''}">${d} ${Number(M.sumarDias(lunes, i).slice(8))}</th>`).join('')}<th scope="col">Total</th></tr></thead>
        <tbody>${lista.length ? lista.map(x => `<tr>
            <td class="nombre">${esc(x.nombre)}</td>
            ${M.DIAS_CORTOS.map((d, i) => { const v = M.num((filas[x.id] || {})['d' + i]); const idc = `c-${x.id}-${i}`, mala = E.celdasMalas[lunes + '|' + idc]; return `<td class="${i === hoyIdx ? 'hoy-col' : ''}"><label class="sr" for="${esc(idc)}">${esc(x.nombre)} ${d}</label><input id="${esc(idc)}" inputmode="numeric" data-celda="${esc(x.id)}" data-d="${i}" value="${mala !== undefined ? esc(mala) : (v || '')}" class="${mala !== undefined ? 'error-celda' : ''}" autocomplete="off"></td>`; }).join('')}
            <td class="num"><b>${M.miles(M.DIAS_CORTOS.reduce((s, _, i) => s + M.num((filas[x.id] || {})['d' + i]), 0))}</b></td>
          </tr>`).join('') : `<tr><td colspan="9" style="text-align:left;color:var(--suave);padding:18px 10px">Esta semana no tiene recetas planificadas. Agrega una abajo o copia otra semana.</td></tr>`}</tbody>
        ${lista.length ? `<tfoot><tr><td>Total</td>${totDia.map((t, i) => `<td class="num ${i === hoyIdx ? 'hoy-col' : ''}">${M.miles(t)}</td>`).join('')}<td class="num">${M.miles(totDia.reduce((s, x) => s + x, 0))}</td></tr></tfoot>` : ''}
      </table>
    </div>
    <div class="agregar">
      <div class="campo"><label for="agregar-receta">Agregar receta a esta semana</label>
        <select id="agregar-receta"><option value="">Elige una receta aprobada…</option>${disponibles.map(r => `<option value="${esc(r.id)}">${esc(r.nombre)}</option>`).join('')}</select></div>
      <button type="button" class="btn-sec" data-accion="agregar">Agregar</button>
      <button type="button" class="btn-sec" data-accion="copiar">${ic('copiar')}Copiar de otra semana</button>
      ${deshacer ? `<button type="button" class="btn-sec" data-accion="deshacer-copia">${ic('deshacer')}Deshacer la copia</button>` : ''}
    </div>
    ${deshacer ? `<p class="ayuda">Esta semana se copió de la del ${esc(M.etiquetaSemana(deshacer.desde))} (${esc(deshacer.por || '')} · ${esc(M.fechaCorta(String(deshacer.en || '').slice(0, 10) || M.hoyTxt()))} ${esc(horaDe(deshacer.en))}). "Deshacer la copia" la deja como estaba antes.</p>` : ''}
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
// v0.12.0: copiar desde cualquier semana (las 12 anteriores, o las siguientes) y deshacer la última copia.
// Antes de copiar se guarda cómo estaba la semana (antesDeCopiar.filas, como texto para que se reemplace entero).
const filasConNumeros = f => Object.fromEntries(Object.entries(f || {}).filter(([, d]) => Object.values(d || {}).some(v => M.num(v) > 0)));
const totalPlan = f => Object.values(f || {}).reduce((s, d) => s + Object.values(d || {}).reduce((a, v) => a + M.num(v), 0), 0);
async function leerPlan(lunes) {
  if (E.planes[lunes]) return E.planes[lunes];
  try { const sn = await getDoc(doc(db, 'planes', `${E.area}_${lunes}`)); return sn.exists() ? sn.data() : { filas: {} }; } catch (e) { return { filas: {}, error: true }; }
}
async function dialogoCopiar() {
  const lunes = E.lunesPlan, d = $('dialogo');
  const semanas = [...Array.from({ length: 12 }, (_, i) => M.sumarDias(lunes, -7 * (i + 1))), M.sumarDias(lunes, 7), M.sumarDias(lunes, 14)];
  d.innerHTML = `<form method="dialog" class="dlg"><h2>Copiar de otra semana</h2><p class="ayuda">Buscando los planes…</p></form>`; d.showModal();
  const planes = await Promise.all(semanas.map(leerPlan));
  const opciones = semanas.map((l, i) => ({ l, f: filasConNumeros(planes[i].filas), futura: l > lunes })).filter(o => Object.keys(o.f).length);
  const actual = E.planes[lunes] || {}, tiene = Object.keys(filasConNumeros(actual.filas)).length > 0;
  d.innerHTML = `<form method="dialog" class="dlg" id="f-copiar">
      <h2>Copiar a la semana ${esc(M.etiquetaSemana(lunes))}</h2>
      ${opciones.length ? `<p class="ayuda">Elige de qué semana traer los números. ${tiene ? '<b>Reemplaza lo que tiene esta semana</b>; si te equivocas, "Deshacer la copia" la deja como estaba.' : 'Después puedes ajustar cada número.'}</p>
      <div class="lista-semanas" role="radiogroup">${opciones.map((o, i) => `<label class="opcion-semana"><input type="radio" name="sem" value="${esc(o.l)}" ${i === 0 ? 'checked' : ''}>
          <span><span><b>${esc(M.etiquetaSemana(o.l))}</b>${o.l === M.sumarDias(lunes, -7) ? ' · la anterior' : o.l === M.sumarDias(lunes, -28) ? ' · hace 4 semanas' : o.futura ? ' · siguiente' : ''}</span><small>${Object.keys(o.f).length} ${Object.keys(o.f).length === 1 ? 'receta' : 'recetas'} · ${M.miles(totalPlan(o.f))} unidades</small></span></label>`).join('')}</div>`
      : `<p class="ayuda">Las 12 semanas anteriores no tienen nada planificado.</p>`}
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button>${opciones.length ? '<button type="button" class="btn btn-fuerte" data-guardar="1">Copiar</button>' : ''}</div>
    </form>`;
  d.onsubmit = ev => ev.preventDefault();
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (b.dataset.guardar) {
      const el = d.querySelector('input[name="sem"]:checked'); if (!el) return;
      const o = opciones.find(x => x.l === el.value); d.close();
      copiarSemana(lunes, o.l, o.f, planes[semanas.indexOf(o.l)]);
    }
  };
}
function copiarSemana(lunes, desde, filasPrev, prev) {
  const actual = E.planes[lunes] || {};
  // Celda por celda: lo de esta semana que no estaba en la otra queda en 0
  const filas = {};
  new Set([...Object.keys(actual.filas || {}), ...Object.keys(filasPrev)]).forEach(id => {
    filas[id] = {}; for (let i = 0; i < 7; i++) filas[id]['d' + i] = M.num(((filasPrev[id] || {})['d' + i]) || 0);
  });
  const nombres = {}; Object.keys(filas).forEach(id => { const r = E.recetas.find(x => x.id === id); nombres[id] = r ? r.nombre : (((prev || {}).nombres || {})[id] || (actual.nombres || {})[id] || id); });
  const antes = { filas: JSON.stringify(filasConNumeros(actual.filas)), desde, por: quien(), en: ahoraIso() };
  guardarSinEsperar(setDoc(doc(db, 'planes', `${E.area}_${lunes}`), { area: E.area, lunes, filas, nombres, antesDeCopiar: antes, planillaPendiente: true, actualizado: { por: quien(), en: serverTimestamp() } }, { merge: true }));
  avisar(`Copiada la semana del ${M.etiquetaSemana(desde)}. Revisa y ajusta lo que corresponda.`); programarPlanilla();
}
function deshacerCopia() {
  const lunes = E.lunesPlan, actual = E.planes[lunes] || {}, a = actual.antesDeCopiar;
  if (!a || !a.filas) return;
  if (!confirm('¿Dejar la semana como estaba antes de copiar? Se pierden también los números que cambiaron después de la copia.')) return;
  let antes = {}; try { antes = JSON.parse(a.filas) || {}; } catch (e) { avisar('No se pudo leer cómo estaba la semana.', true); return; }
  const filas = {};
  new Set([...Object.keys(actual.filas || {}), ...Object.keys(antes)]).forEach(id => {
    filas[id] = {}; for (let i = 0; i < 7; i++) filas[id]['d' + i] = M.num(((antes[id] || {})['d' + i]) || 0);
  });
  guardarSinEsperar(setDoc(doc(db, 'planes', `${E.area}_${lunes}`), { area: E.area, lunes, filas, antesDeCopiar: null, planillaPendiente: true, actualizado: { por: quien(), en: serverTimestamp() } }, { merge: true }), 'La semana quedó como antes de copiar.');
  programarPlanilla();
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
  // v0.16.3: las que tienen un cambio devuelto, arriba; después las consolidadas; las anuladas al final
  const dev = r => { const p = ED.propuestaAbierta(r.id); return p && p.estado === 'devuelta' ? 0 : 1; };
  const orden = r => r.estado === 'consolidada' ? 0 : r.estado === 'anulada' ? 2 : 1;
  const lista = E.recetas.filter(r => r.area === E.area && (!q || r.nombre.toLowerCase().includes(q)))
    .sort((a, b) => dev(a) - dev(b) || orden(a) - orden(b) || a.nombre.localeCompare(b.nombre, 'es'));
  return `${ED.vistaPropuestas()}${!AREAS[E.area].nueva ? `<div class="nota neutra">${ic('alerta')}<span>${esc(AREAS[E.area].nombre)} sigue planificando en la app actual por ahora. Aquí puedes consultar las recetas. <a href="${esc(C.APP_ANTIGUA)}">Abrir la app actual</a></span></div>` : ''}
    <div class="campo"><label for="buscar-receta">Buscar</label><input id="buscar-receta" value="${esc(E.buscar)}" placeholder="Nombre de la receta" autocomplete="off"></div>
    ${ED.AREAS_EDITAN.includes(E.area) ? '<h2 class="titulo">Recetas</h2>' : ''}
    <div class="lista-recetas">${lista.map(r => `<button type="button" class="item-receta" data-receta="${esc(r.id)}">
        <b>${esc(r.nombre)}</b>
        <small>${r.tipo === 'sub_receta' ? 'Sub receta · ' : ''}rinde ${M.unidades(M.porciones(r))} ${r.unidad === 'g' ? 'g' : 'un'}</small>
        ${chipsReceta(r)}
      </button>`).join('') || '<p class="ayuda">No hay recetas con ese nombre.</p>'}</div>`;
}
// v0.16.3: chip del estado de la receta + el de su propuesta abierta ("Consolidada" + "Cambio en revisión") y, si la devolvieron, el comentario
function chipsReceta(r) {
  const p = ED.propuestaAbierta(r.id);
  return `<span class="chips-est">${ED.chipEstado(r.estado || 'borrador')}${p ? ED.chipEstado(p.estado, true) : ''}</span>${p ? ED.lineaDevuelta(p) : ''}`;
}
function detalleReceta(r) {
  if (!r) { E.recetaVista = null; return vistaRecetas(); }
  const cant = E.cantidadVista ?? M.porciones(r), e = M.escalar(r, cant, null, ctx()), esPan = E.area === 'PAN';
  const pasos = (r.pasos || []).filter(Boolean);
  return `<div class="nav-fecha"><button type="button" class="btn-flecha" data-volver="1" aria-label="Volver a la lista">${ic('izq')}</button><h2>${esc(r.nombre)}</h2>
      ${chipsReceta(r)}
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
  if (ds.metaSem) { E.lunesMeta = ds.metaSem === 'prox' ? metaProx() : M.sumarDias(E.lunesMeta, Number(ds.metaSem)); pintar(); return; }
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
    // Bollería: terminar una masa del día la anota en la bitácora (+masas congeladas; v0.14.0: sin empastes); deshacer la anula
    if (E.area === 'BOL' && ds.hecho.startsWith('masa_')) {
      const rid = ds.hecho.slice(5), T = (E.tarjetas || {})['masa_' + rid];
      cambios.bitacora = { ['hoy_' + rid]: ds.valor === '1' ? { tipo: 'elaboro', masa: rid, n: T ? T.total : 0, conEmpaste: false, origen: 'hoy', por: quien(), en: ahoraIso(), anulado: null } : { anulado: { por: quien(), en: ahoraIso() } } };
    }
    guardarSinEsperar(guardarDia(E.fecha, cambios));
    return;
  }
  if (ds.anotar) { dialogoAnotar(ds.anotar); return; }
  if (ds.empastes) { dialogoEmpastes(ds.empastes, ds.n); return; }
  if (ds.todoHecho) {
    const ks = ds.todoHecho.split(',').filter(Boolean);
    if (!confirm(`¿Marcar como hecho todo lo que falta hoy (${ks.length})? ${E.area === 'BOL' ? 'Las masas pasan al congelador (Bitácora) y se descuentan de la bodega.' : 'Las recetas se descuentan de la bodega.'} Se puede deshacer una por una.`)) return;
    const h = {}, en = ahoraIso(), bit = {}; ks.forEach(k => { h[k] = { por: quien(), en }; });
    // Bollería: cada masa terminada se anota en la bitácora, igual que con "Marcar terminada"
    if (E.area === 'BOL') ks.filter(k => k.startsWith('masa_')).forEach(k => {
      const rid = k.slice(5), T = (E.tarjetas || {})[k];
      bit['hoy_' + rid] = { tipo: 'elaboro', masa: rid, n: T ? T.total : 0, conEmpaste: false, origen: 'hoy', por: quien(), en, anulado: null };
    });
    guardarSinEsperar(guardarDia(E.fecha, Object.keys(bit).length ? { hechos: h, bitacora: bit } : { hechos: h }), 'Todo marcado como hecho.');
    return;
  }
  if (ds.periodo) { E[ds.periodoDe] = ds.periodo; pintar(); return; }
  if (ds.mermaNueva) { dialogoMerma(); return; }
  if (ds.infoBod) { const p = $('bod-resp-info'), abrir = p.hidden; p.hidden = !abrir; b.setAttribute('aria-expanded', String(abrir)); return; }
  if (ds.bodega) { dialogoBodega(ds.bodega); return; }
  if (ds.turnoNuevo) { dialogoTurno(ds.turnoNuevo); return; }
  if (ds.calEditar) { dialogoCalibracion(); return; }
  if (ds.derramado) { dialogoDerramado(); return; }
  if (ds.anularReg) {
    const [campo, fecha, id] = ds.anularReg.split('|');
    if (!confirm('¿Anular esta anotación? Queda en el registro como anulada y deja de contar.')) return;
    guardarSinEsperar(guardarDia(fecha, { [campo]: { [id]: { anulado: { por: quien(), en: ahoraIso() } } }, ...(campo === 'bodega' ? { movIds: [id] } : {}), registrosPendientes: true }), 'Anotación anulada.');
    const b0 = campo === 'bodega' ? (((E.diasArea[fecha] || {}).bodega) || {})[id] : null;
    // v0.16.0: el último conteo es por bodega; v0.17.0: el documento de la bodega de esa anotación ('PROD' o sin campo = el de siempre)
    const b0d = b0 ? K.destinoMov('ADM', b0, mapaB()) : null;
    const kc = b0d ? b0d.docId : '';
    if (b0 && b0.tipo === 'conteo' && E.conteosmp[kc] && E.conteosmp[kc].id === id && E.conteosmp[kc].area === E.area)
      guardarSinEsperar(setDoc(doc(db, 'conteosmp', kc), { area: E.area, mp: b0.mp, ...(kc !== b0.mp ? { bodega: b0.bodega } : {}), fecha: E.conteosmp[kc].fecha, cantidad: E.conteosmp[kc].cantidad, anulado: true }, { merge: true }));
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
  if (ds.ordenarHoy) { dialogoOrdenarHoy(); return; }
  if (ds.ajustar) { dialogoAjuste(ds.ajustar); return; }
  if (ds.accion === 'agregar') {
    const id = $('agregar-receta').value; if (!id) { avisar('Elige una receta.', true); return; }
    (E.filasNuevas[E.lunesPlan] = E.filasNuevas[E.lunesPlan] || []).push(id); pintar();
    const el = $(`c-${id}-0`); if (el) el.focus();
    return;
  }
  if (ds.accion === 'copiar') { dialogoCopiar(); return; }
  if (ds.accion === 'deshacer-copia') { deshacerCopia(); return; }
  if (ds.receta) { E.recetaVista = ds.receta; E.cantidadVista = null; pintar(); return; }
  if (ds.volver) { E.recetaVista = null; pintar(); return; }
});
// Lo abierto de "Anuladas" se mantiene aunque la pantalla se repinte
$('principal').addEventListener('toggle', ev => { if (ev.target.classList && ev.target.classList.contains('anuladas')) E.verAnuladas = ev.target.open; }, true);
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
// v0.12.2: en todas las listas de anotaciones (Bitácora, Merma, Bitácora de turno, Bodega) las anuladas van
// abajo, en un desplegable cerrado; siguen tachadas y sin botón
function listaAnot(lista, fila) {
  const vig = lista.filter(a => !a.anulado), anu = lista.filter(a => a.anulado);
  return `${vig.length ? `<div class="lista-bit">${vig.map(fila).join('')}</div>` : '<p class="ayuda">Todo lo de aquí está anulado.</p>'}
    ${anu.length ? `<details class="desp anuladas"${E.verAnuladas ? ' open' : ''}><summary>Anuladas (${anu.length})</summary><div class="lista-bit">${anu.map(fila).join('')}</div></details>` : ''}`;
}
function lineaAnot(campo, a, texto, detalle) {
  return `<div class="anot ${a.anulado ? 'anulada' : ''}">
      <div><b>${texto}</b><span class="ayuda">${detalle}${a.anulado ? ` · anulada por ${esc(a.anulado.por || '')}` : ''}</span></div>
      ${a.anulado ? '' : `<button type="button" class="btn-link" data-anular-reg="${esc(campo)}|${esc(a.fecha)}|${esc(a.id)}">Anular</button>`}
    </div>`;
}
function vistaMerma() {
  if (!E.cargado.recetas || !E.cargado.mps || !E.cargado.diasArea) return '<div class="vacio">Cargando…</div>';
  // v0.15.0: Cafetería ve solo hoy (lo de otros días lo ve Administración en Sistema Fën)
  const soloHoy = E.area === 'CAF';
  const per = soloHoy ? R.periodo('hoy') : R.periodo(E.periodoMerma), lista = R.delPeriodo(E.diasArea, 'merma', per), resumen = R.resumenMerma(lista);
  const rango = soloHoy ? 'hoy' : per.desde === per.hasta ? M.fechaCorta(per.desde) : `${M.fechaCorta(per.desde)} al ${M.fechaCorta(per.hasta)}`;
  return `
    <div class="cab-seccion">
      <p class="ayuda">Anoten lo que se pierde: productos, preparaciones o materias primas, con el motivo. Administración lo ve valorizado en Sistema Fën.</p>
      <button type="button" class="btn btn-fuerte" data-merma-nueva="1">${ic('merma')}Anotar merma</button>
    </div>
    ${soloHoy ? `<p class="ayuda">Aquí se ve lo de hoy. Si se olvidaron de anotar algo de un día anterior (hasta ${DIAS_ATRAS_MERMA} días), al anotar cambien la fecha.</p>` : chipsPeriodo('periodoMerma', E.periodoMerma, ['hoy', 'semana', 'semana_ant', 'mes', 'mes_ant'])}
    <div class="caja">
      <span class="rotulo">Lo perdido · ${esc(rango)}</span>
      ${resumen.length ? `<div class="lista-mini">${resumen.map(x => `<div class="fila sub"><span>${esc(x.nombre)}${x.tipo === 'mp' ? ' <small class="ayuda">(materia prima)</small>' : ''}</span><span>${esc(R.cantidadTexto(x.cantidad, x.unidad))}${x.veces > 1 ? ` · ${x.veces} veces` : ''}</span></div>`).join('')}</div>` : '<span class="ayuda">Nada anotado en este período.</span>'}
    </div>
    <h2 class="titulo">Anotaciones</h2>
    ${lista.length ? `${listaAnot(lista, a => lineaAnot('merma', a,
      `${esc(a.nombre)} · ${esc(R.cantidadTexto(a.cantidad, a.unidad))}`,
      `${esc(R.MOTIVOS[a.motivo] || a.motivo || '')}${a.congelado ? ' · se perdió congelado' : ''}${a.nota ? ' · ' + esc(a.nota) : ''} · ${esc((a.barista && a.barista.nombre) || a.por || '')} · ${esc(M.fechaCorta(a.fecha))} ${esc(horaDe(a.en))}`))}` : `<p class="ayuda">Sin anotaciones${soloHoy ? ' hoy' : ''}.</p>`}
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
// v0.15.0: Cafetería puede anotar la merma en un día anterior (hasta 7 días atrás, nunca en el futuro)
const DIAS_ATRAS_MERMA = CF.DIAS_ATRAS_MERMA;
function dialogoMerma() {
  const d = $('dialogo'), items = itemsMerma(), conFecha = E.area === 'CAF', hoyM = M.hoyTxt(), minM = M.sumarDias(hoyM, -DIAS_ATRAS_MERMA);
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
      <h2>Anotar merma${conFecha ? '' : ' · hoy'}</h2>
      <div class="campo"><label for="mm-buscar">¿Qué se perdió?</label><input id="mm-buscar" autocomplete="off" placeholder="Buscar producto, preparación o materia prima"></div>
      <div class="mm-lista" id="mm-lista" role="group" aria-label="Opciones"></div>
      <p class="mm-elegido"><b id="mm-elegido"></b></p>
      <div class="fila-aj"><label for="mm-cant">Cantidad</label><input id="mm-cant" inputmode="decimal" autocomplete="off"><span class="gr" id="mm-u"></span></div>
      ${conFecha ? `<div class="campo campo-fecha"><label for="mm-fecha">Fecha</label><input id="mm-fecha" type="date" value="${esc(hoyM)}" min="${esc(minM)}" max="${esc(hoyM)}"><small class="ayuda">Hoy, o hasta ${DIAS_ATRAS_MERMA} días atrás si se les olvidó anotar.</small></div>` : ''}
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
    let fecha = hoyM;
    if (conFecha) {
      fecha = String($('mm-fecha').value || '').trim();
      const mal = CF.validarFechaMerma(fecha, hoyM); if (mal) return err(mal);
    }
    const cong = $('mm-cong').checked;
    const a = { tipo: elegido.tipo, item: elegido.x.id, nombre: elegido.x.nombre, sub: !!elegido.sub, cantidad: n, unidad: u, motivo, nota: $('mm-nota').value.trim().slice(0, 200), por: quien(), en: ahoraIso() };
    if (cong) { a.congelado = true; a.congeladoDe = masas.includes(elegido.x.id) ? 'masa' : 'producto'; }
    d.close();
    guardarSinEsperar(guardarDia(fecha, { merma: { [idAnot()]: a }, registrosPendientes: true }), fecha === hoyM ? 'Merma anotada.' : `Merma anotada en el ${M.fechaCorta(fecha)} (aquí se ve solo hoy).`);
    programarRegistros();
  };
}

// ═══════════════ Cafetería: bitácora de turno ═══════════════
// Calibraciones (shots × gramos por shot), café botado y pruebas de receta, en gramos de café.
// Queda a nombre de quien entró con su PIN; si anota por otra persona de Cafetería, la elige.
// v0.15.0: solo hoy (sin cambiar de día). Arriba, la calibración diaria automática (Editar = el número real del día)
// y "Derramado" (preparaciones que se botaron: merma de receta con derramado: true, una anotación por preparación).
const gPorShot = () => K.gPorShotCaf(E.config);
const TXT_TURNO = { calibracion: 'Calibración extra', merma: 'Café botado', prueba_receta: 'Prueba de receta' };
// La primera vez que Cafetería abre la v0.15.0 deja la fecha de inicio de la calibración automática en el día de hoy
// (y la arrastra a los días siguientes): Sistema Fën no cuenta días automáticos antes de esa fecha (consumo.js)
function marcarInicioCalibracion() {
  const h = M.hoyTxt(), d = E.diasArea[h];
  if (E.area !== 'CAF' || !E.persona || (d && d.calibracionDesde) || E.inicioCalMarcado === h) return;
  E.inicioCalMarcado = h;
  const ini = Object.values(E.diasArea).map(x => x && x.calibracionDesde).filter(v => typeof v === 'string' && v <= h).sort()[0] || h;
  guardarSinEsperar(guardarDia(h, { calibracionDesde: ini }));
}
function vistaTurno() {
  if (!E.cargado.diasArea) return '<div class="vacio">Cargando…</div>';
  marcarInicioCalibracion();
  const hoy = M.hoyTxt(), per = R.periodo('hoy', hoy), lista = R.delPeriodo(E.diasArea, 'turno', per), t = R.totalesCafe(lista);
  const cal = K.calibracionDelDia(hoy, E.diasArea[hoy], E.config), ed = cal.editada;
  const derr = R.delPeriodo(E.diasArea, 'merma', per).filter(a => a.derramado).map(a => ({ ...a, campo: 'merma' }));
  const nDerr = derr.filter(a => !a.anulado).reduce((s, a) => s + (a.unidad === 'un' ? M.num(a.cantidad) : 1), 0);
  const todas = [...lista.map(a => ({ ...a, campo: 'turno' })), ...derr].sort((a, b) => String(b.en || '').localeCompare(String(a.en || '')));
  const tiles = [['calibracion', 'Calibración extra'], ['merma', 'Café botado'], ['prueba_receta', 'Pruebas de receta']].map(([k, n]) =>
    `<div class="caja cifra"><span class="rotulo">${n}</span><b>${esc(M.gramos(t[k]))}</b>${k === 'calibracion' && t.shots ? `<span class="ayuda">${M.miles(t.shots)} shots</span>` : ''}</div>`).join('');
  const shotsTxt = n => `${M.miles(n)} ${M.num(n) === 1 ? 'shot' : 'shots'}`;
  const hist = ed ? [...(ed.historial || [])].reverse() : [];
  const fila = a => a.campo === 'merma'
    ? lineaAnot('merma', a, `Derramado · ${esc(a.nombre)} · ${esc(R.cantidadTexto(a.cantidad, a.unidad))}`,
      `${esc((a.barista && a.barista.nombre) || a.por || '')}${a.notaTurno ? ' · ' + esc(a.notaTurno) : ''} · ${esc(horaDe(a.en))}`)
    : lineaAnot('turno', a,
      `${esc(TXT_TURNO[a.tipo] || R.TIPOS_CAF[a.tipo] || a.tipo)} · ${a.tipo === 'calibracion' ? `${shotsTxt(a.shots)} × ${esc(M.unidades(a.gPorShot))} g = ` : ''}${esc(M.gramos(a.gramos))}`,
      `${esc((a.barista && a.barista.nombre) || a.por || '')}${a.nota ? ' · ' + esc(a.nota) : ''} · ${esc(horaDe(a.en))}`);
  return `
    <div class="nav-fecha nav-dia nav-turno"><h2>${esc(M.fechaLarga(hoy))} <span class="chip-hoy">Hoy</span></h2></div>
    <section class="caja cal-diaria" aria-labelledby="cal-diaria-t">
      <div class="cal-fila">
        <div><b id="cal-diaria-t">Calibración diaria: ${esc(shotsTxt(cal.shots))}</b> <span class="ayuda">${ed ? `(editada por ${esc(ed.por || '')}${ed.en ? ' a las ' + esc(horaDe(ed.en)) : ''})` : '(automática)'} · ${esc(M.gramos(cal.gramos))} de café</span></div>
        <button type="button" class="btn-sec" data-cal-editar="1">${ic('ajuste')}Editar</button>
      </div>
      <details class="desp info"><summary>${ic('info')}&nbsp;Cómo funciona</summary>
        <p class="ayuda">Cada día que Cafetería vende en la caja se cuentan solos ${esc(shotsTxt(K.shotsCalibracionDef(E.config)))} de calibración (${esc(M.unidades(gPorShot()))} g por shot) y se descuentan del café de la bodega. Si hoy calibraron otra cantidad, toquen "Editar" y pongan el número real (0 si no se calibró, por ejemplo si estuvo cerrado). Lo anterior queda guardado. Si calibran de nuevo durante el día (cambio de molienda, de café), anótenlo con "Calibración extra": se suma aparte.</p>
        ${hist.length ? `<p class="ayuda">Antes: ${hist.map(h => `${esc(shotsTxt(h.shots))} (${h.auto ? 'automática' : esc(h.por || '') + ' ' + esc(horaDe(h.en))})`).join(' · ')}</p>` : ''}
      </details>
    </section>
    <div class="botones-bit">${Object.keys(R.TIPOS_CAF).map(k => `<button type="button" class="btn-sec" data-turno-nuevo="${k}">${ic(k === 'calibracion' ? 'cafe' : k === 'merma' ? 'merma' : 'libro')}${esc(TXT_TURNO[k] || R.TIPOS_CAF[k])}</button>`).join('')}<button type="button" class="btn-sec" data-derramado="1">${ic('gota')}Derramado</button></div>
    <section class="resumen resumen-cafe">${tiles}<div class="caja cifra"><span class="rotulo">Derramado</span><b>${esc(M.miles(nDerr))}</b><span class="ayuda">${nDerr === 1 ? 'preparación' : 'preparaciones'}</span></div><div class="caja cifra total"><span class="rotulo">Total de café</span><b>${esc(M.gramos(t.total + cal.gramos))}</b><span class="ayuda">con la calibración diaria · ${esc(M.unidades(gPorShot()))} g por shot</span></div></section>
    <h2 class="titulo">Anotaciones de hoy</h2>
    ${todas.length ? listaAnot(todas, fila) : '<p class="ayuda">Sin anotaciones hoy.</p>'}
    ${avisoCopia()}`;
}
// Editar la calibración diaria de hoy: el número real (0 = no se calibró). Lo anterior pasa al historial.
function dialogoCalibracion() {
  const d = $('dialogo'), hoy = M.hoyTxt(), cal = K.calibracionDelDia(hoy, E.diasArea[hoy], E.config), ed = cal.editada;
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>Calibración diaria · hoy</h2>
      <p class="ayuda">Ahora: ${esc(M.miles(cal.shots))} shots ${ed ? `(editada por ${esc(ed.por || '')})` : '(automática)'}. Escriban cuántos shots de calibración se hicieron hoy en realidad. 0 si no se calibró.</p>
      <div class="filas-aj"><div class="fila-aj"><label for="cd-shots">Shots</label><input id="cd-shots" inputmode="numeric" value="${esc(String(cal.shots))}" autocomplete="off"><span class="gr"></span></div></div>
      <p class="ayuda" id="cd-total"></p>
      <div class="error" id="cd-error" role="alert"></div>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">Guardar</button></div>
    </form>`;
  const gps = cal.gPorShot;
  const pintarTotal = () => { const n = $('cd-shots').value.trim(); $('cd-total').textContent = /^\d+$/.test(n) ? `= ${M.gramos(Number(n) * gps)} de café (${M.unidades(gps)} g por shot).` : ''; };
  pintarTotal(); d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.onchange = null;
  d.oninput = () => { $('cd-error').textContent = ''; pintarTotal(); };
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (!b.dataset.guardar) return;
    const n = $('cd-shots').value.trim();
    if (!/^\d+$/.test(n) || Number(n) > 200) { $('cd-error').textContent = 'Escribe cuántos shots (número entero, 0 si no se calibró).'; return; }
    d.close();
    // v0.16.0: registrosPendientes → el script la copia a CAF_registros (una fila por día; si se vuelve a editar, se corrige)
    guardarSinEsperar(guardarDia(hoy, { calibracionDiaria: CF.nuevaCalibracion(ed, cal.shots, Number(n), gps, quien(), ahoraIso()), registrosPendientes: true }), `Calibración diaria: ${M.miles(Number(n))} shots.`);
    programarRegistros();
  };
}
// Derramado (accidente): una o más preparaciones de Cafetería, con cuántas de cada una. Cada una queda como merma de
// receta (motivo "Derrame o error", derramado: true): Sistema Fën la valoriza y la bodega descuenta la preparación entera.
function dialogoDerramado() {
  const d = $('dialogo'), hoy = M.hoyTxt();
  const items = E.recetas.filter(r => r.area === 'CAF' && r.estado !== 'anulada').sort((a, b) => (a.tipo === 'sub_receta') - (b.tipo === 'sub_receta') || a.nombre.localeCompare(b.nombre, 'es'));
  const personas = personasDelArea(), yo = E.persona || {};
  const opciones = personas.some(p => p.id === yo.email) ? personas : [{ id: yo.email || '', nombre: yo.nombre || '' }, ...personas];
  const elegidos = [];   // [{ r, cant }]
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>Derramado · hoy</h2>
      <p class="ayuda">Preparaciones que se derramaron o se botaron por un accidente. Se descuenta todo lo que llevan (café, leche, vaso…) y Administración lo ve valorizado.</p>
      <div class="campo"><label for="dr-barista">Barista</label><select id="dr-barista">${opciones.map(p => `<option value="${esc(p.id)}" ${p.id === yo.email ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>
      <div class="campo"><label for="dr-buscar">¿Qué se derramó?</label><input id="dr-buscar" autocomplete="off" placeholder="Buscar preparación"></div>
      <div class="mm-lista" id="dr-lista" role="group" aria-label="Preparaciones"></div>
      <div id="dr-elegidos"></div>
      <div class="campo"><label for="dr-nota">Nota (opcional)</label><input id="dr-nota" maxlength="200" autocomplete="off" placeholder="Ej: se cayó la bandeja"></div>
      <div class="error" id="dr-error" role="alert"></div>
      <div class="dlg-pie"><button type="button" class="btn-sec" data-cerrar="1">Cancelar</button><button type="button" class="btn btn-fuerte" data-guardar="1">Anotar</button></div>
    </form>`;
  const lista = () => {
    const q = norm($('dr-buscar').value);
    const vis = items.filter(r => !q || norm(r.nombre).includes(q)).slice(0, 30);
    $('dr-lista').innerHTML = vis.length ? vis.map(r => `<button type="button" class="mm-op" data-dr="${esc(r.id)}" aria-pressed="${elegidos.some(x => x.r.id === r.id)}">${esc(r.nombre)}</button>`).join('')
      : `<p class="ayuda">${items.length ? 'No hay nada con ese nombre.' : 'Cafetería todavía no tiene recetas aprobadas.'}</p>`;
  };
  const pintarElegidos = () => {
    $('dr-elegidos').innerHTML = elegidos.length ? `<div class="filas-aj">${elegidos.map((x, k) => `<div class="fila-aj dr-fila"><label for="dr-c-${k}">${esc(x.r.nombre)}</label><input id="dr-c-${k}" data-dr-cant="${k}" inputmode="decimal" value="${esc(String(x.cant).replace('.', ','))}" autocomplete="off"><span class="gr">${R.unidadDe('receta', x.r) === 'g' ? 'g' : 'un'}</span><button type="button" class="btn-x" data-dr-quitar="${k}" aria-label="Quitar ${esc(x.r.nombre)}">×</button></div>`).join('')}</div>`
      : '<p class="ayuda">Elijan una o más preparaciones de la lista.</p>';
  };
  lista(); pintarElegidos(); d.showModal();
  d.onsubmit = ev => ev.preventDefault();
  d.onchange = null;
  d.oninput = ev => {
    $('dr-error').textContent = '';
    if (ev.target.id === 'dr-buscar') lista();
    if (ev.target.dataset.drCant !== undefined) { const x = elegidos[Number(ev.target.dataset.drCant)]; if (x) x.cant = ev.target.value; }
  };
  d.onclick = ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.cerrar) { d.close(); return; }
    if (b.dataset.dr) {
      const k = elegidos.findIndex(x => x.r.id === b.dataset.dr);
      if (k >= 0) elegidos.splice(k, 1); else { const r = items.find(x => x.id === b.dataset.dr); if (r) elegidos.push({ r, cant: 1 }); }
      lista(); pintarElegidos();
      const ult = $('dr-c-' + (elegidos.length - 1)); if (k < 0 && ult) ult.focus();
      return;
    }
    if (b.dataset.drQuitar !== undefined) { elegidos.splice(Number(b.dataset.drQuitar), 1); lista(); pintarElegidos(); return; }
    if (!b.dataset.guardar) return;
    const err = t => { $('dr-error').textContent = t; };
    if (!elegidos.length) return err('Elige qué se derramó.');
    for (const x of elegidos) {
      const t = String(x.cant).trim();
      if (!/^\d+([.,]\d+)?$/.test(t) || !(M.num(t) > 0)) return err(`Escribe cuántas de "${x.r.nombre}" (un número mayor que 0).`);
    }
    const sel = $('dr-barista'), p = opciones.find(x => x.id === sel.value) || { id: '', nombre: '' };
    const merma = CF.entradasDerramado(elegidos.map(x => ({ receta: x.r, cantidad: String(x.cant).trim() })),
      { barista: { email: p.id, nombre: p.nombre }, nota: $('dr-nota').value, por: quien(), en: ahoraIso(), grupo: idAnot() });
    d.close();
    guardarSinEsperar(guardarDia(hoy, { merma, registrosPendientes: true }), elegidos.length === 1 ? 'Derramado anotado.' : `Derramado anotado (${elegidos.length} preparaciones).`);
    programarRegistros();
  };
}
function dialogoTurno(tipo) {
  const d = $('dialogo'), cal = tipo === 'calibracion', gps = gPorShot();
  const personas = personasDelArea(), yo = E.persona || {};
  const opciones = personas.some(p => p.id === yo.email) ? personas : [{ id: yo.email || '', nombre: yo.nombre || '' }, ...personas];
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>${esc(TXT_TURNO[tipo] || R.TIPOS_CAF[tipo])} · hoy</h2>
      ${cal ? '<p class="ayuda">Para calibraciones además de la diaria (cambio de molienda, de café…). La diaria se cuenta sola.</p>' : ''}
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
// v0.16.0: BODEGAS SEPARADAS. Cada área ve y mueve solo SU bodega (config/bodegas; por defecto Panadería, Bollería y
// Pastelería → Producción, Cafetería → Cafetería). Lo que cuenta un área de Producción vale para las tres. Se anota en el
// día de hoy del área (dias.bodega, con bodega: 'CAF' o 'PROD') y se copia a la planilla (MP_stock_movimientos).
// El stock lo calcula Sistema Fën (stockmp/{id}.estado; id = idStock(bodega, mp)); la tablet le suma lo contado o
// recibido después de ese cálculo (stockAhora) para avisar al tiro si queda bajo el mínimo.
// v0.17.0: BODEGAS POR ÁREA RESPONSABLE (cuando Sistema Fën las confirma: config/bodegas.modo = 'responsable'). Cada área
// ve, cuenta y recibe solo las materias primas de las que es responsable (la harina, en Panadería, aunque la use Bollería).
// El documento de stock es el de siempre (stockmp/{mpId}) en la responsable; en otra bodega, {BODEGA}__{mpId} (K.idStockEn).
// Lo nuevo se anota con la bodega del área ('PAN', 'BOL'…) y cada guardado declara qué anotaciones toca (movIds, reglas v1.8.0).
const bodegaArea = () => K.bodegaDe(E.area, E.mapa);
const mapaB = () => E.mapa || K.mapaBodegas(null);
const idEn = (mpId, bod = bodegaArea()) => K.idStockEn(bod, mpId, mapaB());
const smDe = (m, bod = bodegaArea()) => E.stockmp[idEn(m.id, bod)];
const ctrl = m => K.controlEn(bodegaArea(), m, smDe(m), mapaB());
function criticas() {
  return E.mps.filter(m => (m.estado || 'activa') === 'activa' && m.tipo !== 'sub_receta' && ctrl(m).critica)
    .sort((a, b) => (ED.habilitada(b, E.area) - ED.habilitada(a, E.area)) || a.nombre.localeCompare(b.nombre, 'es'));
}
// Lo de la bodega de esta área que hay ahora (o null) y si está bajo el mínimo
function ahoraDe(m) {
  const bod = bodegaArea(), sm = smDe(m) || {}, c = ctrl(m);
  const llegadas = Object.values(E.diasArea).flatMap(d => Object.values((d && d.bodega) || {})).filter(a => a && a.tipo === 'llegada' && a.mp === m.id && K.bodegaMov(E.area, a, mapaB()) === bod);
  const conteo = conteoDe(m.id);
  const a = K.stockAhora(sm.estado, conteo, llegadas);
  return { ...(a || {}), sinDatos: !a, bajo: !!a && K.bajoMinimo(a.hay, c.seguridad), c };
}
// Las de la bodega de esta área bajo el mínimo ahora: [{ m, hay, minimo, unidad }]
function bajosAhora() {
  if (!E.cargado.mps || !E.cargado.stockmp) return [];
  return criticas().map(m => ({ m, x: ahoraDe(m) })).filter(o => o.x.bajo).map(o => ({ m: o.m, hay: o.x.hay, minimo: o.x.c.seguridad, unidad: o.x.c.unidad, env: o.x.c.envase }));
}
// Hoy / Bitácora de turno: una línea chica con lo que está bajo el mínimo (sin costos), que lleva a Bodega
function lineaBodegaHoy() {
  const b = bajosAhora(); if (!b.length) return '';
  avisarStock(b);
  return `<a class="linea-bodega" href="#bodega">${ic('alerta')}<span>Bodega: ${b.map(o => `<b>${esc(o.m.nombre)}</b> bajo el mínimo (hay ${esc(K.textoEnv(o.hay, o.unidad, o.env))})`).join(' · ')}</span></a>`;
}
// El último conteo (conteosmp) de una materia prima en la bodega de esta área: el documento manda (v0.17.0: {mpId} en la
// responsable, aunque lo haya contado otra área antes de confirmar). En otra bodega (CAF__…), que diga esa bodega.
function conteoDe(mpId) {
  const id = idEn(mpId), c = E.conteosmp[id];
  if (!c) return null;
  if (id !== String(mpId) && (c.bodega || K.BODEGA_PRINCIPAL) !== bodegaArea()) return null;
  return c;
}
// Correo a Administración y a las jefas de esta bodega (script v2.9.0, stock_alerta): el script manda uno por día,
// bodega y materia prima. Aquí se recuerda lo ya pedido hoy en el equipo, para no llamarlo a cada rato.
const K_ALERTAS = 'fen_cocina_alertas_stock';
E.alertando = false;
function avisarStock(bajos) {
  if (E.alertando || !E.usuario || !(bajos || []).length || navigator.onLine === false) return;
  const hoy = M.hoyTxt(), bod = bodegaArea();
  let hechas = {}; try { hechas = JSON.parse(localStorage.getItem(K_ALERTAS) || '{}') || {}; } catch (e) { hechas = {}; }
  const nuevas = bajos.filter(o => !hechas[K.claveAlerta(hoy, bod, o.m.id)]);
  if (!nuevas.length) return;
  E.alertando = true;
  llamarScript({ action: 'stock_alerta', area: E.area, bodega: bod, fecha: hoy, alertas: nuevas.map(o => ({ mp: o.m.id, hay: Math.round(o.hay) })) })
    .then(r => {
      if (!r || r.ok !== true) return;
      const limpio = {}; Object.entries(hechas).forEach(([k, v]) => { if (k.slice(0, 10) >= M.sumarDias(hoy, -3)) limpio[k] = v; });
      nuevas.forEach(o => { limpio[K.claveAlerta(hoy, bod, o.m.id)] = 1; });
      try { localStorage.setItem(K_ALERTAS, JSON.stringify(limpio)); } catch (e) {}
    })
    .catch(() => {})
    .finally(() => { E.alertando = false; });
}
function vistaBodega() {
  if (!E.cargado.mps || !E.cargado.diasArea || !E.cargado.stockmp) return '<div class="vacio">Cargando…</div>';
  const cr = criticas(), hoy = M.hoyTxt(), bod = bodegaArea(), nomB = K.nombreBodega(bod, E.mapa), resp = K.esResponsable(mapaB());
  const otrasAreas = K.areasDeBodega(bod, E.mapa).filter(a => a !== E.area && AREAS[a]).map(a => AREAS[a].nombre);
  // v0.17.0: las anotaciones de esta área (las de antes de confirmar también, aunque hoy sean de otra bodega: es su historia)
  const per = { desde: M.sumarDias(hoy, -13), hasta: hoy }, movs = R.delPeriodo(E.diasArea, 'bodega', per).filter(a => resp || (a.bodega || K.BODEGA_PRINCIPAL) === bod);
  // Lo que calculó Sistema Fën (stock teórico y alertas), más lo contado o recibido después
  const est = m => (smDe(m) || {}).estado || null;
  const ahora = {}; cr.forEach(m => { ahora[m.id] = ahoraDe(m); });
  const bajos = cr.filter(m => ahora[m.id].bajo), pronto = cr.filter(m => { const e = est(m); return !ahora[m.id].bajo && e && e.contado && e.bajoDesde; });
  if (bajos.length) avisarStock(bajos.map(m => ({ m, hay: ahora[m.id].hay, minimo: ahora[m.id].c.seguridad, unidad: ahora[m.id].c.unidad })));
  const fila = m => {
    const c = ahora[m.id].c, e = est(m), a = ahora[m.id];
    const txt = a.sinDatos ? (!e ? 'Sin calcular todavía' : 'Falta un conteo') : `${K.textoEnv(a.hay, c.unidad, c.envase)}${a.desde === 'calculo' && e.alcanza !== null && e.alcanza !== undefined ? ` · alcanza para ~${M.unidades(e.alcanza)} ${M.num(e.alcanza) === 1 ? 'día' : 'días'}` : a.desde === 'conteo' ? ' · recién contado' : ''}`;
    const uc = ultimoConteo(m.id);
    return `<div class="fila sub fila-bod"><span>${esc(m.nombre)}${!ED.habilitada(m, E.area) && !K.esResponsable(mapaB()) ? ' <small class="ayuda">(otra área)</small>' : ''}${uc ? `<small class="ayuda bloque">Contada ${esc(uc.texto)}</small>` : ''}</span><span class="${a.bajo || (e && e.bajoDesde) ? 'txt-ojo' : ''}">${esc(txt)}${c.seguridad ? ` · mínimo ${esc(K.texto(c.seguridad, c.unidad))}` : ''}</span></div>`;
  };
  const calculado = cr.map(est).filter(Boolean).map(e => e.en).sort().pop();
  return `
    ${bajos.length ? `<div class="nota ojo banner-bodega" role="alert">${ic('alerta')}<span><b>Bajo el mínimo en la bodega ${esc(nomB)}:</b> ${bajos.map(m => `<b>${esc(m.nombre)}</b> (hay ${esc(K.textoEnv(ahora[m.id].hay, ahora[m.id].c.unidad, ahora[m.id].c.envase))}, mínimo ${esc(K.texto(ahora[m.id].c.seguridad, ahora[m.id].c.unidad))})`).join(' · ')}. Administración ya recibe el aviso por correo; avísenle igual si no viene un pedido.</span></div>` : ''}
    <div class="cab-seccion">
      <p class="ayuda">${resp && E.area !== 'CAF'
        ? `Bodega <b>${esc(nomB)}</b>: las materias primas de las que ${esc(AREAS[E.area].nombre)} es responsable. Aquí se cuentan y se recibe lo que llega. El consumo se descuenta solo: lo que marca como hecho cualquier área que las use. <button type="button" class="btn-i btn-i-linea" data-info-bod="1" aria-expanded="false" aria-controls="bod-resp-info" aria-label="Qué es esto">${ic('info')}</button>`
        : `Bodega <b>${esc(nomB)}</b>${otrasAreas.length ? ` (la comparten ${esc(AREAS[E.area].nombre)}, ${esc(otrasAreas.join(' y '))}: lo que entra y lo que cuentan aquí vale para todas)` : ' (solo de esta área)'}. El consumo se descuenta solo: lo que marcan como hecho${E.area === 'CAF' ? ', lo vendido en la caja, la calibración diaria, el café de la bitácora y lo derramado' : ''}.`}</p>
      ${resp && E.area !== 'CAF' ? `<p class="ayuda info-texto" id="bod-resp-info" hidden>Administración decidió qué área está a cargo de cada materia prima crítica. Aquí aparecen solo las de ${esc(AREAS[E.area].nombre)}: las cuentan, anotan lo que llega y reciben el aviso por correo cuando quedan bajo el mínimo. Su stock es uno solo y baja también con lo que usan las otras áreas (por ejemplo, la harina de Panadería baja con lo que usan Bollería y Pastelería). Si falta alguna que ustedes cuidan, pídanle a Administración que la pase a ${esc(AREAS[E.area].nombre)}.</p>` : ''}
      <div class="botones-bit"><button type="button" class="btn btn-fuerte" data-bodega="llegada">${ic('bodega')}Llegó mercadería</button><button type="button" class="btn-sec" data-bodega="conteo">${ic('pasos')}Conteo de bodega</button></div>
    </div>
    ${pronto.length ? `<div class="nota ojo">${ic('alerta')}<span>${pronto.map(m => `<b>${esc(m.nombre)}</b> queda bajo el mínimo el ${esc(M.fechaLarga(est(m).bajoDesde).toLowerCase())}`).join(' · ')}. Avísale a Administración si no viene un pedido.</span></div>` : ''}
    <div class="caja">
      <span class="rotulo">Materias primas críticas · bodega ${esc(nomB)}</span>
      ${cr.length ? `<div class="lista-mini">${cr.map(fila).join('')}</div>` : `<span class="ayuda">${resp && E.area !== 'CAF' ? `Administración todavía no deja materias primas críticas a cargo de ${esc(AREAS[E.area].nombre)}.` : 'Administración todavía no marca materias primas críticas en esta bodega.'}</span>`}
      ${calculado ? `<span class="ayuda">Calculado en Sistema Fën: ${esc(M.fechaCorta(M.hoyTxt(new Date(calculado))))} ${esc(horaDe(calculado))}.</span>` : ''}
    </div>
    <h2 class="titulo">Llegadas y conteos de ${esc(AREAS[E.area].nombre)} (14 días)</h2>
    ${movs.length ? `${listaAnot(movs, a => lineaAnot('bodega', a,
      `${a.tipo === 'conteo' ? 'Conteo' : 'Llegó'}: ${esc(a.nombre)} · ${esc(K.texto(a.cantidad, a.unidad))}${a.detalle ? ` (${esc(M.unidades(a.detalle.envases))} ${esc(K.envases(a.detalle.envase, a.detalle.envases))}${a.detalle.sueltos ? ' + ' + esc(K.texto(a.detalle.sueltos, a.unidad)) : ''})` : ''}`,
      `${a.nota ? esc(a.nota) + ' · ' : ''}${esc(a.por || '')} · ${esc(M.fechaCorta(a.fecha))} ${esc(horaDe(a.en))}`))}` : '<p class="ayuda">Sin llegadas ni conteos.</p>'}
    ${avisoCopia()}`;
}
// Último conteo de una materia prima en la bodega de esta área (de cualquier área de esa bodega): { texto, hoyOtra }
function ultimoConteo(mpId) {
  const c = conteoDe(mpId); if (!c || c.anulado || !c.fecha) return null;
  const hoy = M.hoyTxt(), area = AREAS[c.area] ? AREAS[c.area].nombre : c.area;
  return {
    texto: `${c.fecha === hoy ? 'hoy' : M.fechaCorta(c.fecha)} ${horaDe(c.en)} · ${area}${c.por ? ' (' + c.por + ')' : ''} · ${K.texto(c.cantidad, c.unidad)}`,
    hoyOtra: c.fecha === hoy && c.area !== E.area ? `${area} ya la contó hoy a las ${horaDe(c.en)}` : ''
  };
}
function dialogoBodega(tipo) {
  const d = $('dialogo'), cr = criticas(), conteo = tipo === 'conteo';
  if (!cr.length) { avisar('Administración todavía no marca materias primas críticas en esta bodega (Sistema Fën → Producción → Bodega).', true); return; }
  const bod = bodegaArea();
  const campo = m => {
    const u = K.unidadMp(m), uc = conteo ? ultimoConteo(m.id) : null;
    const notas = [!ED.habilitada(m, E.area) && !K.esResponsable(mapaB()) ? 'De otra área' : '', uc ? 'Último conteo: ' + uc.texto : ''].filter(Boolean);
    const env = ctrl(m).envase;
    const etiqueta = `<label for="bo-${esc(m.id)}">${esc(m.nombre)}${env ? `<small>En ${esc(K.envases(env.nombre, 2))} de ${esc(K.texto(env.tamano, u))} + lo suelto</small>` : ''}${notas.map(n => `<small>${esc(n)}</small>`).join('')}${uc && uc.hoyOtra ? `<small class="txt-ojo" data-ya-contada="${esc(m.id)}">${esc(uc.hoyOtra)}: si la cuentan de nuevo, vale la última.</small>` : ''}</label>`;
    if (!env) return `<div class="fila-aj">${etiqueta}<input id="bo-${esc(m.id)}" data-bo="${esc(m.id)}" inputmode="decimal" autocomplete="off"><span class="gr">${K.unidadEntrada(u)}</span></div>`;
    return `<div class="fila-aj fila-env">${etiqueta}<div class="env-campos">
        <input id="bo-${esc(m.id)}" data-bo="${esc(m.id)}" inputmode="decimal" autocomplete="off" aria-label="${esc(K.envases(env.nombre, 2))}"><span class="gr">${esc(K.envases(env.nombre, 2))}</span>
        <span class="mas">+</span>
        <input id="bo-${esc(m.id)}-s" data-bo-suelto="${esc(m.id)}" inputmode="decimal" autocomplete="off" aria-label="${esc(K.unidadEntrada(u))} sueltos"><span class="gr">${K.unidadEntrada(u)} sueltos</span>
      </div><span class="gr env-total" id="bo-${esc(m.id)}-t"></span></div>`;
  };
  d.innerHTML = `<form method="dialog" class="dlg">
      <h2>${conteo ? 'Conteo de bodega' : 'Llegó mercadería'} · ${esc(K.nombreBodega(bod, E.mapa))} · hoy</h2>
      <p class="ayuda">${conteo ? `Cuenten al terminar la producción del día${E.area === 'CAF' ? ' (en Cafetería, después de cerrar la caja)' : ''}: el conteo vale como cierre de hoy, así que lo hecho hoy ya está incluido y desde mañana se descuenta solo. Escriban en sacos, kg, litros o unidades, según diga. Las que no cuenten, déjenlas vacías: siguen con su conteo anterior.` : 'Escriban lo que llegó (en sacos, kg, litros o unidades, según diga). Lo demás, vacío.'}</p>
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
    const u = K.unidadMp(m), env = ctrl(m).envase;
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
      const u = K.unidadMp(m), a = { tipo, mp: m.id, nombre: m.nombre, bodega: bod, ...(K.esResponsable(mapaB()) ? { stock: idEn(m.id, bod) } : {}), cantidad: Math.round(r.total * 100) / 100, unidad: u, nota, por: quien(), en: ahoraIso() };
      if (r.env) a.detalle = { envase: r.env.nombre, tamano: r.env.tamano, envases: r.envases, sueltos: Math.round(r.sueltos * 100) / 100 };
      entradas[idAnot()] = a;
    }
    if (!Object.keys(entradas).length) { $('bo-error').textContent = conteo ? 'Escribe al menos un conteo.' : 'Escribe lo que llegó.'; return; }
    d.close();
    const hoy = M.hoyTxt();
    // v0.17.0: cada guardado declara las anotaciones que toca (movIds; las reglas v1.8.0 revisan que sean de esta área), de a 30
    const ids = Object.keys(entradas);
    for (let i = 0; i < ids.length; i += 30) {
      const parte = Object.fromEntries(ids.slice(i, i + 30).map(k => [k, entradas[k]]));
      guardarSinEsperar(guardarDia(hoy, { bodega: parte, movIds: Object.keys(parte), registrosPendientes: true }), conteo ? 'Conteo guardado.' : 'Llegada anotada.');
    }
    // El último conteo de cada una, para que lo vean las otras áreas
    // v0.16.0: por bodega (conteosmp/{mpId} en Producción, conteosmp/CAF__{mpId} en Cafetería; reglas v1.7.0)
    // v0.17.0: en la bodega responsable, conteosmp/{mpId} (el de siempre); reglas v1.8.0: solo el área responsable
    if (conteo) Object.entries(entradas).forEach(([id, a]) => guardarSinEsperar(setDoc(doc(db, 'conteosmp', idEn(a.mp, bod)), { mp: a.mp, nombre: a.nombre, bodega: bod, area: E.area, fecha: hoy, id, cantidad: a.cantidad, unidad: a.unidad, por: a.por, en: a.en, anulado: false })));
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
