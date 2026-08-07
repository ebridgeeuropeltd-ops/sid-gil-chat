export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { model, messages } = req.body;
  const token = process.env.HF_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Server configuration error: HF_TOKEN is missing.' });
  }

  try {
    // New Hugging Face router endpoint for LLM chat completions
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'meta-llama/Llama-3.2-1B-Instruct',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
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
