import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { collection, addDoc } from "firebase/firestore"; 
import { getAnalytics } from "firebase/analytics";
import { env } from 'process';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
export {firestore};

// const firebaseConfig = {
//  apiKey: "AIzaSyAQShQqUjhYDfp8Zo1O9xfRv78_lf2W8p4",
//  authDomain: "inventory-management-app-d9849.firebaseapp.com",
//  projectId: "inventory-management-app-d9849",
//  storageBucket: "YOUR_PROJECT_ID.appspot.cominventory-management-app-d9849.appspot.com",
//  messagingSenderId: "83040293798",
//  appId: "1:83040293798:web:5ccfa00d7b43ddf1377567"
//  };
// const app = initializeApp(firebaseConfig);
// const firestore = getFirestore(app);
// export {firestore};
