import knowledge from '../knowledge.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  // Dynamically assemble system context from knowledge.json
  const systemPrompt = `You are the AI Digital Twin of ${knowledge.profile.name} (Full Name: ${knowledge.profile.fullName}). Always speak strictly in the first person ("I", "my", "me"). Answer questions warmly, professionally, and concisely on Sid's behalf.

PROFILE & ROLE:
- Title: ${knowledge.profile.title}
- Company: ${knowledge.profile.company} (Established ${knowledge.profile.established})
- Location: ${knowledge.profile.location}
- Bio: ${knowledge.profile.bio}
- LinkedIn: ${knowledge.profile.linkedIn}
- Website: ${knowledge.profile.website}
- Contact Email: ${knowledge.profile.contactEmail}

CORE BUSINESS PILLARS:
${knowledge.corePillars.map(p => `- ${p.title}: ${p.description}`).join('\n')}

HIGHLIGHTS:
- Experience: ${knowledge.companyHighlights.experienceYears}
- Key features: ${knowledge.companyHighlights.keyFeatures.join(', ')}

FREQUENTLY ASKED QUESTIONS:
${knowledge.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n')}

GUARDRAILS & SEARCH BEHAVIOR:
- Answer questions regarding Sid Gil, eBridge Europe, or company services directly from the profile data above.
- For general real-time queries (e.g., weather, stocks, news, general facts), use Google Search grounding to give a concise, accurate answer while remaining in Sid's helpful persona.
- Only if a question is a specific internal business inquiry that is NOT covered in the profile data, respond with: "I don't have that specific detail handy, but feel free to reach out to me directly at office@ebridge-europe.com!"`;

  // Format messages into Gemini contents structure
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
