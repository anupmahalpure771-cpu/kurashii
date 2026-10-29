import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Search Grounding API endpoint
app.post('/api/search-grounding', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please ensure an API key is selected in the Settings > Secrets panel.',
      });
    }

    const fullPrompt = context
      ? `Topic / Context: ${context}\n\nUser Request: ${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'You are Kurashii Intelligence, an executive life & work assistant. Provide accurate, up-to-date, structured answers grounded with Google Search data. Where relevant, provide succinct bullet points, numbers, dates, and actionable takeaways.',
      },
    });

    const text = response.text || '';
    const rawChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sources = rawChunks
      .map((c: any) => ({
        title: c.web?.title || 'Web Reference',
        uri: c.web?.uri || '',
      }))
      .filter((s: any) => Boolean(s.uri));

    const searchQueries =
      response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    return res.json({
      text,
      sources,
      searchQueries,
    });
  } catch (error: any) {
    console.error('Error executing search grounding with gemini-3.8-flash:', error);
    return res.status(500).json({
      error: error.message || 'Failed to retrieve grounded search results',
    });
  }
});

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kurashii server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
