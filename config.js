// ═══════════════════════════════════════════════
//  fën · Cocina (app de las jefas) — configuración  v0.4.0
//  (i) La configuración web de Firebase no es secreta: solo dice cuál es el
//  proyecto (fen-produccion). Lo que protege los datos son las reglas de
//  fen-produccion y la cuenta de cada área (cuentas/{uid}).
//  La dirección del Apps Script de Producción tampoco es secreta: el script
//  revisa la sesión de Firebase en cada pedido.
// ═══════════════════════════════════════════════
window.FEN_COCINA = {
  VERSION: '0.4.0',
  // Proyecto fen-produccion (no es secreto: solo dice cuál es el proyecto)
  firebase: {
    apiKey: 'AIzaSyC1Ea_zVHgPLu3Ij58JRcAQtWHnXIM6MeU',
    authDomain: 'fen-produccion.firebaseapp.com',
    projectId: 'fen-produccion',
    storageBucket: 'fen-produccion.firebasestorage.app',
    messagingSenderId: '848731856981',
    appId: '1:848731856981:web:6dee7dada2116b1ec4f4dc'
  },
  // Apps Script de Producción (revisa el PIN con Asistencia y copia los planes a la planilla)
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw-D1gOezUuFEhhqXQ69zYR0Sp4Bekg3CHhy3lEMzB8CV9kp6ty0iXTreyq5aULmz5L8g/exec',
  // App actual de Producción (las áreas que aún no pasan a la nueva)
  APP_ANTIGUA: 'https://panaderiafen.github.io/fen-produccion/',
  HORAS_PIN: 12,        // la persona queda recordada en el equipo estas horas
  KG_SACO: 25           // la harina del día se muestra en sacos de este peso
};
