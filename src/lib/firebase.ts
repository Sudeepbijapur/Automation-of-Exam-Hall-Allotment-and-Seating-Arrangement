import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhQOv1rm-71MXaPjvtBqqI84V7jEevt9k",
  authDomain: "collageproject-2fc3f.firebaseapp.com",
  projectId: "collageproject-2fc3f",
  storageBucket: "collageproject-2fc3f.firebasestorage.app",
  messagingSenderId: "734688717362",
  appId: "1:734688717362:web:0d64673e4e909dccda6a2b",
  measurementId: "G-73GD4020GN"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code == 'unimplemented') {
    console.warn('Firestore persistence failed: The current browser does not support all of the features required to enable persistence.');
  }
});

export { app, auth, db };
