// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCwrQOYOY6cnTRCtblbh6GJcySzzHEw_vo",
  authDomain: "nttb-kamp-dropping.firebaseapp.com",
  projectId: "nttb-kamp-dropping",
  storageBucket: "nttb-kamp-dropping.firebasestorage.app",
  messagingSenderId: "878956598499",
  appId: "1:878956598499:web:afccee79533be49a4761d6",
  measurementId: "G-7L2DBLEBNF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
