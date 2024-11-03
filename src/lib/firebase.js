import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCnAAri5EHfJ-kfob0YwEc-CCN3bZBQiTg",
  authDomain: "audio-library-1cc83.firebaseapp.com",
  projectId: "audio-library-1cc83",
  storageBucket: "audio-library-1cc83.firebasestorage.app",
  messagingSenderId: "883957649476",
  appId: "1:883957649476:web:fa875c3209ec0cf9712c11",
  measurementId: "G-0SBLRDXWF6"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);