import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post('/api/start-story', async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image is required' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: image, mimeType: mimeType || 'image/jpeg' } },
            { text: 'Analyze the mood and scene of this image, and then ghostwrite an engaging opening paragraph to a story set in that world. Set the scene clearly.' }
          ]
        },
        config: {
          systemInstruction: 'You are an expert creative writer and ghostwriter. Do not include analysis text in your output, just output the opening paragraph directly. Never write "Here is an opening paragraph" or similar meta-text.'
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to start story' });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { contents } = req.body;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: contents,
        config: {
           systemInstruction: 'You are an AI co-author helping the user write a story. Stay in character as a collaborative creative writer. Provide suggestions, continue the story, or answer questions about the narrative world based on the context.'
        }
      });
      
      res.json({ text: response.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to chat' });
    }
  });

  app.post('/api/tts', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
         return res.status(400).json({ error: 'Text is required' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audio) {
        res.json({ audio });
      } else {
         res.status(500).json({ error: 'No audio generated' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate speech' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
