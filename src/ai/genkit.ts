
'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import { isAiAvailable } from './config';

export const ai = genkit({
    plugins: [
        isAiAvailable ? googleAI() : undefined,
    ].filter(p => p !== undefined),
});
