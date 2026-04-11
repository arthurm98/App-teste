// This configuration is now read from environment variables.
// This makes the app more portable and secure, ready for deployment on platforms like Vercel.

const fallbackFirebaseConfig = {
  projectId: 'demo-project',
  appId: 'demo-app-id',
  apiKey: 'demo-api-key',
  authDomain: 'demo-project.firebaseapp.com',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '000000000000',
};

export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? fallbackFirebaseConfig.projectId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? fallbackFirebaseConfig.appId,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? fallbackFirebaseConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? fallbackFirebaseConfig.authDomain,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? fallbackFirebaseConfig.storageBucket,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? fallbackFirebaseConfig.messagingSenderId,
};
