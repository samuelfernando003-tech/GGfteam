// firebase-config.js - Configuração central do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, where, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8RZRRiEJFvOcb6ubisI6TTbMv9V_zT-8",
  authDomain: "ggfteam.firebaseapp.com",
  projectId: "ggfteam",
  storageBucket: "ggfteam.firebasestorage.app",
  messagingSenderId: "912869295775",
  appId: "1:912869295775:web:d9cb902a9ae089cad9c4aa",
  measurementId: "G-0Z2RP0XEBC"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Coleções do Firestore
const COLLECTIONS = {
  CONFIG: 'config',
  PRODUCTS: 'products',
  FAQ: 'faq',
  ADS: 'ads'
};

// Exporta as instâncias e funções
export { 
  app, db, storage, auth, analytics, 
  COLLECTIONS, Timestamp,
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, 
  query, orderBy, where, addDoc,
  ref, uploadBytes, getDownloadURL, deleteObject,
  signInWithEmailAndPassword, signOut, onAuthStateChanged
};
