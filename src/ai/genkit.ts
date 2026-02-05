import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { isAiAvailable } from './config';

if (!isAiAvailable) {
    console.warn(
        'Chave da API do Gemini não encontrada. As funcionalidades de IA serão desativadas. Para ativá-las, adicione a GEMINI_API_KEY ao seu arquivo .env e reinicie o servidor. Você pode obter uma chave em https://aistudio.google.com/app/apikey'
    );
}

export const ai = genkit({
  plugins: isAiAvailable ? [googleAI()] : [],
  model: isAiAvailable ? 'googleai/gemini-2.5-flash' : undefined,
});
