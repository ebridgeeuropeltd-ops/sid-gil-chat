import knowledge from '../knowledge.json';

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

  const formattedContents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  try {
    // Endpoint updated to gemini-3.1-pro-preview
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: formattedContents,
          tools: [
            { google_search: {} }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that request right now.";

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
    return res.status(500).json({ error: error.message });
  }
}
