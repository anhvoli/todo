import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

// Redirect to /login when there is no signed-in Firebase user.
// (Replaces the old localStorage 'AuthToken' check for the dead backend.)
export const authMiddleWare = (history) => {
	if (!history) return;
	const unsub = onAuthStateChanged(auth, (user) => {
		if (!user) {
			history.push('/login');
		}
		unsub();
	});
};

// Turn a Firebase Auth error into a message we can show in the UI.
export const friendlyAuthError = (error) => {
	if (!error) return 'Something went wrong. Please try again.';
	switch (error.code) {
		case 'auth/invalid-email':
			return 'Invalid email address.';
		case 'auth/user-disabled':
			return 'This account has been disabled.';
		case 'auth/user-not-found':
			return 'No account found with this email.';
		case 'auth/wrong-password':
			return 'Wrong password, please try again.';
		case 'auth/invalid-credential':
			return 'Wrong email or password, please try again.';
		case 'auth/email-already-in-use':
			return 'This email is already registered. Try signing in instead.';
		case 'auth/weak-password':
			return 'Password should be at least 6 characters.';
		case 'auth/operation-not-allowed':
			return 'Email/password sign-in is not enabled for this Firebase project. Enable it in Firebase Console > Authentication > Sign-in method > Email/Password.';
		case 'auth/network-request-failed':
			return 'Network error. Please check your connection and try again.';
		default:
			return error.message || 'Something went wrong. Please try again.';
	}
};

// Turn a Firestore error into a message we can show in the UI.
export const friendlyFirestoreError = (error) => {
	if (!error) return 'Something went wrong. Please try again.';
	if (error.code === 'permission-denied') {
		return 'Firestore permission denied. Check the Firestore security rules in Firebase Console.';
	}
	if (error.code === 'unavailable') {
		return 'Cannot reach Firestore. The Firestore API may not be enabled for this project — create a database in Firebase Console > Firestore Database.';
	}
	return error.message || 'Something went wrong. Please try again.';
};
