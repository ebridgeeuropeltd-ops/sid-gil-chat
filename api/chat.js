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
Use the core profile data above to answer questions about Sid Gil, eBridge Europe Ltd, or company services accurately in Sid's polite first-person voice.`;

  // Format messages into DeepSeek / OpenAI compatible schema
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...(messages || []).filter(m => m.role !== 'system')
  ];

  try {
    // Call DeepSeek's chat completions API endpoint
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: formattedMessages,
        stream: false
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
              content: `DeepSeek Error (${response.status}): ${errorMsg}`
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
