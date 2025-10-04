
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';


export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error("Firebase Permission Error:", error.message);
      
      toast({
          variant: "destructive",
          title: "Erro de Permissão",
          description: "Você não tem permissão para realizar esta ação. Verifique as regras de segurança do Firestore.",
      });

      // We are showing a toast instead of crashing the app.
      // If you want to crash the app, uncomment the line below.
      // throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
