import * as Admin from 'firebase-admin';
import * as express from 'express';
import firebaseConfig  from "./config";

// Initialize Firebase
export const admin = Admin.initializeApp(firebaseConfig);
export const storage = admin.storage();
export const db = admin.firestore();

// Initialisation Express
export const app = express()



