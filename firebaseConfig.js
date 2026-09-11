import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAdPHwhUXsJXC7gDNrvUoHSYCxp2yMRuyM",
  authDomain: "fateh27-b3c8a.firebaseapp.com",
  projectId: "fateh27-b3c8a",
  storageBucket: "fateh27-b3c8a.firebasestorage.app",
  messagingSenderId: "507211323482",
  appId: "1:507211323482:web:a037b03646951c91702063"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
