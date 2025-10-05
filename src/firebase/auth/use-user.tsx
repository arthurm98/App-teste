
'use client';
import { useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, User, Auth } from 'firebase/auth';
import { FirebaseContext, FirebaseContextState } from '@/firebase/provider';

// This custom hook centralizes the logic for listening to auth state changes.
export const useUser = (): { user: User | null; isUserLoading: boolean; userError: Error | null } => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
      throw new Error('useUser must be used within a FirebaseProvider.');
  }

  // Directly return the auth state from the context.
  // The FirebaseProvider is now the single source of truth for auth state.
  return {
      user: context.user,
      isUserLoading: context.isUserLoading,
      userError: context.userError,
  };
};
