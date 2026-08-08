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
2. When asked about real-time events, current weather, or general web facts, use the provided live search data to give a clear, direct answer in Sid's polite executive voice.`;

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...(messages || []).filter(m => m.role !== 'system')
  ];

  try {
    // OpenRouter endpoint with free DeepSeek + built-in online web search
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY}`,
        'HTTP-Referer': 'https://ebridgeeurope.com', 
        'X-Title': 'Sid Gil Digital Twin'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat:free:online',
        messages: formattedMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || JSON.stringify(data);
      return res.status(200).json({
        choices: [
          {
            message: {
              role: 'assistant',
              content: `OpenRouter Error (${response.status}): ${errorMsg}`
            }
          }
        ]
      });
    }

    const replyText = data.choices?.[0]?.message?.content || "I couldn't process that request right now.";

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
            content: `Server Error: ${error.message}`
          }
        }
      ]
    });
  }
}
