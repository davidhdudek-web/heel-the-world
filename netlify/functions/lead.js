// HTW Commission Lead Handler
// Receives: { name, email, lang, city, material }
// → Adds to Brevo HTW list → triggers 3-email welcome sequence

const BREVO_API = 'https://api.brevo.com/v3';
const LIST_ID = 14; // HTW Commission Leads list

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { name, email, lang = 'EN', city = '', material = '' } = body;

  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  try {
    // 1. Create/update contact in Brevo with HTW attributes
    const contactRes = await fetch(`${BREVO_API}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: name || '',
          HTW_LANG: lang,
          HTW_CITY: city,
          HTW_MATERIAL: material
        },
        listIds: [LIST_ID],
        updateEnabled: true
      })
    });

    const contactData = await contactRes.json().catch(() => ({}));

    // 2. Send immediate welcome email (transactional)
    const subject = getSubject(lang);
    const htmlContent = getWelcomeEmail(name, lang, city, material);

    const emailRes = await fetch(`${BREVO_API}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'David H. Dudek — HEEL THE WORLD', email: 'davidhdudek@icloud.com' },
        to: [{ email, name: name || email }],
        subject,
        htmlContent,
        tags: ['htw-commission', 'welcome']
      })
    });

    const emailData = await emailRes.json().catch(() => ({}));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, contact: contactData, email: emailData })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

function getSubject(lang) {
  const subjects = {
    EN: 'Your Heel the World Commission.',
    FR: 'Votre commission Heel the World.',
    IT: 'La vostra commissione Heel the World.',
    DE: 'Ihre Heel the World Commission.',
    ES: 'Su encargo Heel the World.'
  };
  return subjects[lang] || subjects.EN;
}

function getWelcomeEmail(name, lang, city, material) {
  const greeting = name ? name.split(' ')[0] : null;

  if (lang === 'DE') {
    return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fff;color:#111;">
<p style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#888;margin-bottom:32px;">HEEL THE WORLD · by David H. Dudek</p>
${greeting ? `<p>Liebe ${greeting},</p>` : '<p>Guten Tag,</p>'}
<p>ich habe Ihre Anfrage erhalten.</p>
<p>Eine Commission bei Heel the World beginnt mit einem Gespräch — ca. 30 Minuten. Wir sprechen über Ihren Fuß, Ihre Occasion, Ihre Materialwahl${material ? ` (ich sehe, Sie interessieren sich für ${material})` : ''} — oder ich schlage etwas vor, wenn Sie mir die Entscheidung überlassen möchten.</p>
<p>Dann folgen drei bis sechs Wochen in einer Manufaktur in Deutschland, Schweiz oder Italien — zweite Generation, faire Löhne. Dann kommt die Schachtel: ungefärbte Pappe, Metallnieten, Seidenauskleidung, ein Schildkrötenanhänger aus demselben Leder wie Ihr Schuh.</p>
<p style="margin:32px 0;">CHF 4.000 — 80 % sichern Ihr Paar vor dem ersten Schnitt.</p>
<p>Schreiben Sie mir einfach zurück. Ich antworte persönlich.</p>
<p style="margin-top:40px;">— David H. Dudek<br><span style="color:#888;font-size:12px;">HEEL THE WORLD</span></p>
</body></html>`;
  }

  if (lang === 'FR') {
    return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fff;color:#111;">
<p style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#888;margin-bottom:32px;">HEEL THE WORLD · by David H. Dudek</p>
${greeting ? `<p>Chère ${greeting},</p>` : '<p>Madame,</p>'}
<p>J'ai bien reçu votre demande.</p>
<p>Une commission Heel the World commence par une conversation — environ 30 minutes. Nous parlons de votre pied, de votre occasion, de votre choix de matière${material ? ` (je vois que vous vous intéressez au ${material})` : ''} — ou je vous propose quelque chose si vous me laissez décider.</p>
<p>Ensuite, trois à six semaines dans un atelier en Allemagne, en Suisse ou en Italie — deuxième génération, salaires équitables. Puis vient la boîte : carton non traité, rivets métalliques, satin, un pendentif en cuir découpé dans la même peau que votre chaussure.</p>
<p style="margin:32px 0;">CHF 4.000 — 80 % sécurisent votre paire avant le premier coup de couteau.</p>
<p>Répondez simplement à cet e-mail. Je réponds personnellement.</p>
<p style="margin-top:40px;">— David H. Dudek<br><span style="color:#888;font-size:12px;">HEEL THE WORLD</span></p>
</body></html>`;
  }

  if (lang === 'IT') {
    return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fff;color:#111;">
<p style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#888;margin-bottom:32px;">HEEL THE WORLD · by David H. Dudek</p>
${greeting ? `<p>Cara ${greeting},</p>` : '<p>Gentile,</p>'}
<p>Ho ricevuto la sua richiesta.</p>
<p>Una commissione Heel the World inizia con una conversazione — circa 30 minuti. Parliamo del suo piede, dell'occasione, della sua scelta di materiale${material ? ` (vedo che è interessata al ${material})` : ''} — oppure le propongo io qualcosa.</p>
<p>Poi tre-sei settimane in un laboratorio artigianale in Germania, Svizzera o Italia — seconda generazione, salari equi. Poi arriva la scatola: cartone non trattato, rivetti metallici, raso, un ciondolo in cuoio tagliato dalla stessa pelle del suo tacco.</p>
<p style="margin:32px 0;">CHF 4.000 — l'80% assicura il suo paio prima del primo taglio.</p>
<p>Mi risponda direttamente. Rispondo personalmente.</p>
<p style="margin-top:40px;">— David H. Dudek<br><span style="color:#888;font-size:12px;">HEEL THE WORLD</span></p>
</body></html>`;
  }

  if (lang === 'ES') {
    return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fff;color:#111;">
<p style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#888;margin-bottom:32px;">HEEL THE WORLD · by David H. Dudek</p>
${greeting ? `<p>Estimada ${greeting},</p>` : '<p>Estimada,</p>'}
<p>He recibido su consulta.</p>
<p>Un encargo Heel the World empieza con una conversación — unos 30 minutos. Hablamos de su pie, su ocasión, su elección de material${material ? ` (veo que le interesa el ${material})` : ''} — o le propongo algo si me deja decidir.</p>
<p>Luego, tres a seis semanas en un taller artesanal en Alemania, Suiza o Italia — segunda generación, salarios justos. Después llega la caja: cartón sin tratar, remaches metálicos, satén, un colgante de cuero cortado de la misma piel que su tacón.</p>
<p style="margin:32px 0;">CHF 4.000 — el 80% asegura su par antes del primer corte.</p>
<p>Respóndame directamente. Respondo en persona.</p>
<p style="margin-top:40px;">— David H. Dudek<br><span style="color:#888;font-size:12px;">HEEL THE WORLD</span></p>
</body></html>`;
  }

  // Default: EN
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fff;color:#111;">
<p style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#888;margin-bottom:32px;">HEEL THE WORLD · by David H. Dudek</p>
${greeting ? `<p>Dear ${greeting},</p>` : '<p>Dear,</p>'}
<p>I've received your inquiry.</p>
<p>A Heel the World commission begins with a conversation — approximately 30 minutes. We discuss your foot, your occasion, your material preference${material ? ` (I see you're interested in ${material})` : ''} — or I propose something if you prefer to leave the choice to me.</p>
<p>Then three to six weeks in a workshop in Germany, Switzerland or Italy — second generation, fair wages. Then the box arrives: unbleached cardboard, metal rivets, satin lining, a leather charm cut from the same hide as your heel.</p>
<p style="margin:32px 0;">CHF 4.000 — 80% secures your pair before the first cut is made.</p>
<p>Simply reply to this email. I respond personally.</p>
<p style="margin-top:40px;">— David H. Dudek<br><span style="color:#888;font-size:12px;">HEEL THE WORLD</span></p>
</body></html>`;
}
