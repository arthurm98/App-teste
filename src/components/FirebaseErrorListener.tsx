'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';


export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Em um ambiente de desenvolvimento, queremos ver o erro completo para depuração.
      // Lançar o erro aqui acionará a sobreposição de erro do Next.js, 
      // exibindo os "logs ricos e detalhados" que você solicitou.
      console.error("Firebase Permission Error Detected:", error);

      // Para o "teste de estresse nuclear": lançamos o erro para torná-lo impossível de ignorar.
      // Isso fornece o log detalhado diretamente na tela durante o desenvolvimento.
      throw error;
      
      /*
      // Implementação alternativa para produção (não trava o app):
      toast({
          variant: "destructive",
          title: "Erro de Permissão do Firestore",
          description: "Uma operação foi bloqueada pelas regras de segurança. Verifique o console para detalhes.",
      });
      */
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // Este componente não renderiza nada.
}
