// This configuration is now read from environment variables.
// This makes the app more portable and secure, ready for deployment on platforms like Vercel.

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfig = config;

// Check if all required environment variables are set and non-empty.
export const isFirebaseAvailable =
  !!config.apiKey &&
  !!config.authDomain &&
  !!config.projectId &&
  !!config.appId;
