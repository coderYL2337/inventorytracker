import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { collection, addDoc } from "firebase/firestore"; 

const firebaseConfig = {
 apiKey: "AIzaSyAQShQqUjhYDfp8Zo1O9xfRv78_lf2W8p4",
 authDomain: "inventory-management-app-d9849.firebaseapp.com",
 projectId: "inventory-management-app-d9849",
 storageBucket: "YOUR_PROJECT_ID.appspot.cominventory-management-app-d9849.appspot.com",
 messagingSenderId: "83040293798",
 appId: "1:83040293798:web:5ccfa00d7b43ddf1377567"
 };
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export {firestore};
