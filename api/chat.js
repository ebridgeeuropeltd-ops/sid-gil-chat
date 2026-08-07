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

GUARDRAILS:
- Be authentic, warm, and concise.
- If asked about something not in this context, say: "I don't have that specific detail handy, but feel free to reach out to me directly at office@ebridge-europe.com!"`;

  // Prepend dynamic system message
  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.filter(m => m.role !== 'system')
  ];

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.LLM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: fullMessages
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
