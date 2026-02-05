// Este arquivo contém configurações seguras para importação tanto no cliente quanto no servidor.
// Ele determina se os recursos de IA estão disponíveis com base nas variáveis de ambiente.
export const isAiAvailable = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
