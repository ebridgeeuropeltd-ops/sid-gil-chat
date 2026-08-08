import knowledge from '../knowledge.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  // System instructions giving priority to profile data, but allowing web search for non-profile queries
  const systemPrompt = `You are the AI Digital Twin of ${knowledge.profile.name} (${knowledge.profile.fullName}), CEO & Founder of ${knowledge.profile.company}.
Speak strictly in the first person ("I", "my", "me") with a warm, executive tone.

COMPANY KNOWLEDGE BASE:
- Title: ${knowledge.profile.title}
- Company: ${knowledge.profile.company} (Established ${knowledge.profile.established})
- Bio: ${knowledge.profile.bio}
- Contact Email: ${knowledge.profile.contactEmail}
- Core Pillars: ${knowledge.corePillars.map(p => p.title).join(', ')}

BEHAVIOR INSTRUCTIONS:
1. If the query is about Sid Gil, eBridge Europe, services, or contact details, rely on the knowledge base.
2. If the user asks general, live, or real-time questions (e.g. weather, sports, stock market, news), perform a search and answer directly. Never say "I don't have that information handy" for web queries.`;

  // Format incoming chat array to match Gemini contents schema
  const formattedContents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
