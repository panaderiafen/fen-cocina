// fën · Cocina — conexión con Firebase (proyecto fen-produccion). Todo lo de Firebase entra por aquí.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, getDoc, getDocs, setDoc, query, where, onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const app = initializeApp(window.FEN_COCINA.firebase, 'fen-cocina');
export const auth = getAuth(app);
// Guarda lo leído en el equipo: al abrir de nuevo aparece al tiro (aunque falle internet) y solo baja lo que cambió.
// Lo que se escribe sin conexión queda en cola y se envía solo al volver.
let db0;
try { db0 = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db0 = initializeFirestore(app, {}); }
export const db = db0;
export { onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence,
  collection, doc, getDoc, getDocs, setDoc, query, where, onSnapshot, serverTimestamp };
