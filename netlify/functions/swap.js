// HTW Bild-Tausch — Claude Haiku generiert Caption / Grok / Hook / Hashtags
// Benötigt: ANTHROPIC_API_KEY in Netlify → Site Settings → Environment Variables

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const PILLAR = {
  A: 'SÄULE A — KUNSTWERK: Der High Heel als Skulptur. Studio, Material-Detail, Macro-Close-ups. Emotionale Inszenierung des Handwerks.',
  B: 'SÄULE B — EMOTION: Die Frau, die ihn trägt. Lifestyle, Begierde, Zugehörigkeit. Hermès-Register.',
  C: 'SÄULE C — ATELIER: Werkstatt, Hände, Lederzuschnitt, Manufaktur. Das Handwerk als Beweis.'
};

const CAMERA = {
  A: 'Locked-off extreme macro, single LED sweep links nach rechts, 8 Sek',
  B: 'Dutch tilt floor shot 12-Grad, slow push-in 15cm über 8 Sek',
  C: 'Cinematic depth close-up, rack-focus Hintergrund zu Schuh über 3 Sek, hält 5 Sek'
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY fehlt — Netlify → Site Settings → Environment Variables → ANTHROPIC_API_KEY setzen' })
    };
  }

  let body;
  try { body = JSON.parse(event.body); } catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const { photoBase64, mediaType = 'image/jpeg', col, type, city = '', lang = 'EN', saeule = 'A' } = body;

  if (!photoBase64) return { statusCode: 400, headers, body: JSON.stringify({ error: 'photoBase64 required' }) };

  const prompt = `Du bist der Social Media Texter für HEEL THE WORLD — Luxury Unikat High Heels aus organischen Exotikledern (Lachs, Tilapia, Waran, Strauß, Ray). Preis: CHF 4.000+. Gründer: David H. Dudek. Seit 2008. Marke: Green Glamor.

Target-Market: ${city || 'International'}
Sprache für Captions: ${lang}
Kollektion: ${col}
${PILLAR[saeule] || PILLAR.A}

SCHRITT 1: Analysiere das Foto. Beschreibe den Schuh exakt — Farbe, Material, Textur, Riemen, Absatz-Form und -Höhe, Plattform, Piping, Details.

SCHRITT 2: Generiere basierend auf dem Schuh im Foto:

1. DREI CAPTIONS auf ${lang} (jede endet mit "— HEEL THE WORLD · by David H. Dudek"):
   Caption A: Sachlich-informativ, Material im Fokus, Fakten über das Leder
   Caption B: Emotional, die Frau die ihn trägt, Begierde und Zugehörigkeit
   Caption C: Handwerk und Provenienz, Geschichte, Manufaktur-Detail

2. GROK VIDEO PROMPT: "8-sec Reel, 9:16 vertical. ${CAMERA[saeule] || CAMERA.A}. [Beschreibe hier den EXAKTEN Schuh aus dem Foto mit ALLEN visuellen Details: Farbe, Material, jeder Riemen, Absatz-Form, Plattform, Piping, Textur]. CRITICAL: Reproduce this exact shoe from the reference photo — match silhouette, strap count, heel shape, platform, color precisely. Do NOT invent a different shoe. No kitchen, bedroom, restaurant or generic domestic space. No monsters or CGI distortion. No text overlay except HEEL THE WORLD — exact spelling only."

3. HOOK: Text-Overlay für Reel-Einstieg. Max 5 Wörter. Auf ${lang}. Provokant oder imperativ.

4. FIRST COMMENT: 8-12 Hashtags auf Englisch. Immer zuerst: #heeltheworld

Antworte AUSSCHLIESSLICH als valides JSON ohne Markdown-Backticks:
{"captions":["caption_a_text","caption_b_text","caption_c_text"],"grok":"grok_prompt_text","hook":"hook_text","firstComment":"#heeltheworld ..."}`;

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: photoBase64 } },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return { statusCode: response.status, headers, body: JSON.stringify({ error: 'Anthropic API Fehler: ' + errText.slice(0, 200) }) };
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Kein JSON in Antwort', raw: text.slice(0, 300) }) };
    }

    const result = JSON.parse(match[0]);
    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
