export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'API key no configurada en el servidor' });
  }

  try {
    const body = req.body;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error('Groq API error:', data);
      return res.status(groqRes.status).json(data);
    }

    // ── Extraer y limpiar bloques antes de devolver al cliente ──
    const rawContent = data?.choices?.[0]?.message?.content || '';

    // 1. Extraer todos los bloques [CODECAR_DATA]...[/CODECAR_DATA]
    const dataBlockRe = /\[CODECAR_DATA\]([\s\S]*?)\[\/CODECAR_DATA\]/g;
    const extractedData = {};
    let match;
    while ((match = dataBlockRe.exec(rawContent)) !== null) {
      const jsonStr = match[1].trim();
      try {
        const obj = JSON.parse(jsonStr);
        Object.keys(obj).forEach(k => {
          const v = obj[k] == null ? '' : String(obj[k]).trim();
          if (v && v !== 'sin_' + k && v !== 'sin ' + k) extractedData[k] = v;
        });
      } catch (e) {
        // JSON mal formado — intentar extraer con regex campo a campo
        const fieldRe = /"(\w+)"\s*:\s*"([^"]*)"/g;
        let fm;
        while ((fm = fieldRe.exec(jsonStr)) !== null) {
          const v = fm[2].trim();
          if (v && !v.startsWith('sin_') && !v.startsWith('sin ')) {
            extractedData[fm[1]] = v;
          }
        }
      }
    }

    // 2. Detectar marcador de lead listo
    const isLeadReady = rawContent.includes('[CODECAR_LEAD_READY]');

    // 3. Limpiar el texto visible — quitar bloques y marcadores
    let cleanContent = rawContent
      .replace(/\[CODECAR_DATA\][\s\S]*?\[\/CODECAR_DATA\]/g, '')
      .replace(/\[CODECAR_LEAD_READY\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 4. Reemplazar el content en la respuesta de Groq
    data.choices[0].message.content = cleanContent;

    // 5. Inyectar campos extra en la respuesta
    data._cc = {
      extractedData,
      isLeadReady,
    };

    return res.status(200).json(data);
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
