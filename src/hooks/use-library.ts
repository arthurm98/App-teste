import { useContext } from 'react';
import { LibraryContext } from '@/context/library-provider';

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary deve ser usado dentro de um LibraryProvider');
  }
  return context;
};
