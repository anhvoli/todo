import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase project "game-972ba" — config provided by the user.
const firebaseConfig = {
	apiKey: 'AIzaSyAD8qbSz5Ovqn6xM9sbxVBsMHozg-7bR80',
	authDomain: 'game-972ba.firebaseapp.com',
	projectId: 'game-972ba',
	storageBucket: 'game-972ba.firebasestorage.app',
	messagingSenderId: '957391379193',
	appId: '1:957391379193:web:093fab6d63fefeeb7da028',
	measurementId: 'G-GF4J1LDYLE'
};

// Initialize Firebase (no Analytics — not needed for this app).
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
