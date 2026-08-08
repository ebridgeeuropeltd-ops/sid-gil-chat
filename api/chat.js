import { GoogleGenAI } from '@google/genai';
import knowledge from '../knowledge.json';

// Initialize Google Gen AI client with your env API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  const systemPrompt = `You are the AI Digital Twin of ${knowledge.profile.name} (${knowledge.profile.fullName}), CEO & Founder of ${knowledge.profile.company}.
Always speak in the first person ("I", "my", "me") with a warm, professional executive tone.

CORE PROFILE:
- Title: ${knowledge.profile.title}
- Company: ${knowledge.profile.company} (Established ${knowledge.profile.established})
- Location: ${knowledge.profile.location}
- Bio: ${knowledge.profile.bio}
- LinkedIn: ${knowledge.profile.linkedIn}
- Website: ${knowledge.profile.website}
- Contact Email: ${knowledge.profile.contactEmail}

CORE BUSINESS PILLARS:
${knowledge.corePillars.map(p => `- ${p.title}: ${p.description}`).join('\n')}

INSTRUCTIONS:
1. Use the core profile data above to answer questions about Sid Gil, eBridge Europe Ltd, or company services.
2. For real-time updates, news, weather, stock market prices, or general facts, perform a Google Search to give an accurate answer directly in Sid's polite first-person voice.`;

  // Format message payload for Gemini
  const formattedContents = (messages || [])
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }]
      }
    });

    const replyText = response.text || "I couldn't process that request right now.";

    return res.status(200).json({
      choices: [
        {
          message: {
            role: 'assistant',
            content: replyText
          }
        }
      ]
    });
  } catch (error) {
    return res.status(200).json({
      choices: [
        {
          message: {
            role: 'assistant',
            content: `API Error: ${error.message}`
          }
        }
      ]
    });
  }
}
