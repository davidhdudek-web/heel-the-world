// HTW Commission Lead Handler
// Receives: { name, email, phone, path, message }
// → Adds contact to Brevo HTW list (14)
// → Sends path-specific welcome email to the customer (HTW CI)
// → Sends notification email to David with full lead details

const BREVO_API = 'https://api.brevo.com/v3';
const LIST_ID = 14; // HTW Commission Leads list
const NOTIFY_EMAIL = 'david@heeltheworld.ch';
// TODO: Nach Verifizierung in Brevo (Senders & Domains) auf
// { name: 'David H. Dudek — HEEL THE WORLD', email: 'david@heeltheworld.ch' } umstellen,
// damit DKIM/DMARC der Domain greifen.
const SENDER = { name: 'David H. Dudek — HEEL THE WORLD', email: 'david@heeltheworld.ch' };
const SITE = 'https://heeltheworld.ch';

const PATH_LABELS = {
  individual: 'Individual Creation',
  collection: 'From Existing Model',
  label: 'Your Own Label',
  press: 'Press & Media',
  collaboration: 'Collaboration',
  speaking: 'Speaking / Appearance',
  general: 'General Inquiry'
};

const SUBJECTS = {
  individual: 'Your Heel the World Commission.',
  collection: 'Your Heel the World Commission.',
  label: 'Your Own Label — Heel the World.',
  press: 'Your Heel the World Inquiry.',
  collaboration: 'Your Heel the World Inquiry.',
  speaking: 'Your Heel the World Inquiry.',
  general: 'Your Heel the World Inquiry.'
};

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

  const { name = '', email, phone = '', path = 'general', message = '', sketchImage = '' } = body;

  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  const pathLabel = PATH_LABELS[path] || path;

  // extract raw base64 from a data URL like "data:image/png;base64,AAAA..."
  let sketchAttachment = null;
  if (sketchImage && sketchImage.startsWith('data:image')) {
    const match = sketchImage.match(/^data:image\/(\w+);base64,(.+)$/);
    if (match) {
      sketchAttachment = { name: `sketch-${Date.now()}.${match[1]}`, content: match[2] };
    }
  }

  try {
    // 1. Create/update contact in Brevo
    const contactRes = await fetch(`${BREVO_API}/contacts`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: name,
          SMS: phone,
          HTW_PATH: pathLabel,
          HTW_MESSAGE: message
        },
        listIds: [LIST_ID],
        updateEnabled: true
      })
    });
    const contactData = await contactRes.json().catch(() => ({}));

    // 2. Welcome email to the customer (path-specific)
    const welcomeRes = await fetch(`${BREVO_API}/smtp/email`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email, name: name || email }],
        subject: SUBJECTS[path] || SUBJECTS.general,
        htmlContent: getWelcomeEmail(name, path, pathLabel),
        tags: ['htw-commission', 'welcome', `path-${path}`]
      })
    });
    const welcomeData = await welcomeRes.json().catch(() => ({}));

    // 3. Notification email to David
    const notifyPayload = {
      sender: SENDER,
      to: [{ email: NOTIFY_EMAIL, name: 'David' }],
      replyTo: { email, name: name || email },
      subject: `Neue HTW-Anfrage: ${name || email} (${pathLabel})`,
      htmlContent: getNotifyEmail({ name, email, phone, pathLabel, message, hasSketch: !!sketchAttachment }),
      tags: ['htw-commission', 'internal-notify']
    };
    if (sketchAttachment) {
      notifyPayload.attachment = [sketchAttachment];
    }
    const notifyRes = await fetch(`${BREVO_API}/smtp/email`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(notifyPayload)
    });
    const notifyData = await notifyRes.json().catch(() => ({}));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, contact: contactData, welcome: welcomeData, notify: notifyData })
    };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

// ---------------------------------------------------------------------------
// Welcome email — HTW CI, path-specific
// Dark #0a0a0a · HTW Grün #74A573 (Jade + 15% Apfelgrün) · Serif body (Cormorant fallback Georgia)
// Table-based, inline styles only. No product image — the type carries it.
// Note: Gmail may recalculate the dark palette to a light one; both renderings
// are intentional. Do not fight the inversion with hacks.
// ---------------------------------------------------------------------------
function getWelcomeEmail(name, path, pathLabel) {
  const greeting = name ? escapeHtml(name.split(' ')[0]) : null;
  const pl = escapeHtml(pathLabel);

  const label = (text) =>
    `<p style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:4px;color:#74A573;margin:0 0 10px;">${text}</p>`;

  const serif = (text, extra = '') =>
    `<p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;line-height:1.75;color:#f0ece4;margin:0 0 8px;${extra}">${text}</p>`;

  const section = (lbl, text) =>
    `<tr><td style="padding:0 26px 26px;">${label(lbl)}${serif(text)}</td></tr>`;

  const priceBlock = `
    <tr><td style="padding:8px 26px 34px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td height="1" bgcolor="#2a2a28" style="background-color:#2a2a28;font-size:0;line-height:1px;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:22px 0;">
          <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:19px;line-height:1.6;color:#f0ece4;">CHF&nbsp;2&rsquo;600 &mdash; a deposit secures your pair before the first cut is made.</span>
        </td></tr>
        <tr><td height="1" bgcolor="#2a2a28" style="background-color:#2a2a28;font-size:0;line-height:1px;">&nbsp;</td></tr>
      </table>
    </td></tr>`;

  const commissionIntro = serif(`I&rsquo;ve received your inquiry &mdash; <span style="color:#74A573;">${pl}</span>. This is how a commission unfolds.`);

  const VARIANTS = {
    commission: {
      preheader: 'A conversation. A pair. A box. We begin when you are ready.',
      intro: commissionIntro,
      sections:
        section('THE&nbsp;CONVERSATION', 'Approximately thirty minutes. We speak about your foot, your occasion, your material preference &mdash; or I propose something, if you prefer to leave the choice to me.') +
        section('THE&nbsp;MANUFACTORY', 'Three to six weeks in Switzerland and Germany. Made by hand.') +
        section('THE&nbsp;BOX', 'Unbleached cardboard, metal rivets, satin lining &mdash; and a leather charm cut from the same hide as your heel.') +
        priceBlock,
      close: 'Simply reply to this email. I respond personally.'
    },
    label: {
      preheader: 'Your name on the box. Let us talk about it.',
      intro: serif(`I&rsquo;ve received your inquiry &mdash; <span style="color:#74A573;">${pl}</span>. That is a longer conversation, and my favorite one.`),
      sections:
        section('THE&nbsp;IDEA', 'Your name, your signature, your customer. We begin with what your label should say &mdash; before any leather is chosen.') +
        section('THE&nbsp;FOUNDATION', 'Lasts, materials, construction, workshop &mdash; set up for your label, in Switzerland and Germany.') +
        section('THE&nbsp;FIRST&nbsp;COLLECTION', 'From first sketch to finished boxes. You present it. I build it.'),
      close: 'Reply and tell me where you stand &mdash; an idea, a sketchbook, or a business plan. I respond personally.'
    },
    press: {
      preheader: 'Images, background, interviews — I respond personally.',
      intro: serif(`Thank you for your interest in Heel the World &mdash; <span style="color:#74A573;">${pl}</span>.`),
      sections:
        section('THE&nbsp;STORY', 'Refugee, electrician, soldier, carpenter. Husband and father. And since 2009 &mdash; a builder of heels: Berlin runways, theatre stages, television. Based in Switzerland. The whole story takes longer than a paragraph.') +
        section('THE&nbsp;MATERIAL', 'Nanai salmon leather and other unusual hides. The palette is public &mdash; the process is not.'),
      close: 'Images, background, interviews &mdash; simply reply to this email. I respond personally.'
    },
    speaking: {
      preheader: 'Craft and brand — keynote, panel, or conversation.',
      intro: serif(`Thank you for your inquiry &mdash; <span style="color:#74A573;">${pl}</span>.`),
      sections:
        section('THE&nbsp;SUBJECT', 'The road between two workshops &mdash; carpentry and couture. What building things by hand teaches about building brands. Keynote, panel, or conversation.'),
      close: 'Reply with your occasion and your date. I respond personally.'
    },
    collaboration: {
      preheader: 'Stages, stories, brands — tell me what you have in mind.',
      intro: serif(`Thank you for your inquiry &mdash; <span style="color:#74A573;">${pl}</span>.`),
      sections:
        section('THE&nbsp;COMPANY&nbsp;WE&nbsp;KEEP', 'Heel the World has grown through collaboration &mdash; theatre stages, television, runways, ballrooms. If you have a stage, a story or a brand in mind, I want to hear it.'),
      close: 'Simply reply to this email. I respond personally.'
    },
    general: {
      preheader: 'Received. I respond personally.',
      intro: serif('Thank you for reaching out.'),
      sections:
        section('WHERE&nbsp;IT&nbsp;BEGINS', 'Tell me what brings you to Heel the World &mdash; a pair of your own, a story, an idea. Whatever it is, it starts the same way: with a conversation.'),
      close: 'Simply reply to this email. I respond personally.'
    }
  };

  const variantKey = (path === 'individual' || path === 'collection') ? 'commission'
    : VARIANTS[path] ? path : 'general';
  const v = VARIANTS[variantKey];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(SUBJECTS[path] || SUBJECTS.general)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;" bgcolor="#0a0a0a">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${v.preheader}&nbsp;&#8199;&#8199;&#8199;&#8199;&#8199;&#8199;&#8199;&#8199;&#8199;&#8199;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;">
<tr><td align="center" style="padding:52px 14px 40px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- Wordmark -->
    <tr><td align="center" style="padding:0 26px 14px;">
      <a href="${SITE}" style="text-decoration:none;">
        <span style="font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:7px;color:#f0ece4;">HEEL&nbsp;&middot;&nbsp;THE&nbsp;&middot;&nbsp;WORLD</span>
      </a>
      <br>
      <span style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;color:#8a8378;">BY&nbsp;DAVID&nbsp;H.&nbsp;DUDEK</span>
    </td></tr>

    <!-- Mint hairline -->
    <tr><td align="center" style="padding:14px 26px 42px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td width="34" height="1" bgcolor="#74A573" style="background-color:#74A573;font-size:0;line-height:1px;">&nbsp;</td>
      </tr></table>
    </td></tr>

    <!-- Greeting + intro -->
    <tr><td style="padding:0 26px 30px;">
      ${greeting ? serif(`Dear ${greeting},`, 'margin-bottom:20px;') : ''}
      ${v.intro}
    </td></tr>

    ${v.sections}

    <!-- Close + signature -->
    <tr><td style="padding:6px 26px 44px;">
      ${serif(v.close, 'margin-bottom:26px;')}
      <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;color:#f0ece4;margin:0;">&mdash; David H. Dudek</p>
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;color:#8a8378;margin:8px 0 0;">HEEL&nbsp;THE&nbsp;WORLD</p>
    </td></tr>

    <!-- Footer -->
    <tr><td align="center" style="padding:26px 26px 0;border-top:1px solid #2a2a28;">
      <a href="${SITE}" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#8a8378;text-decoration:none;">heeltheworld.ch</a>
      <span style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:#8a8378;">&nbsp;&middot;&nbsp;</span>
      <a href="https://instagram.com/heeltheworld" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#8a8378;text-decoration:none;">@heeltheworld</a>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
}

function getNotifyEmail({ name, email, phone, pathLabel, message, hasSketch }) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
<h2 style="margin-bottom:16px;">Neue HTW-Anfrage</h2>
<table style="width:100%;border-collapse:collapse;font-size:14px;">
<tr><td style="padding:6px 0;color:#888;width:120px;">Name</td><td style="padding:6px 0;">${escapeHtml(name) || '&mdash;'}</td></tr>
<tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}">${email}</a></td></tr>
<tr><td style="padding:6px 0;color:#888;">Telefon</td><td style="padding:6px 0;">${escapeHtml(phone) || '&mdash;'}</td></tr>
<tr><td style="padding:6px 0;color:#888;">Path</td><td style="padding:6px 0;">${escapeHtml(pathLabel)}</td></tr>
</table>
<p style="margin-top:16px;color:#888;">Nachricht:</p>
<p style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:6px;">${escapeHtml(message) || '(keine)'}</p>
${hasSketch ? '<p style="margin-top:16px;padding:10px 14px;background:#e8fbf5;border:1px solid #74A573;border-radius:6px;font-size:13px;">&#9998; Diese Anfrage enth&auml;lt eine handgezeichnete Skizze &mdash; siehe Anhang dieser E-Mail.</p>' : ''}
<p style="margin-top:24px;font-size:12px;color:#aaa;">Automatisch von heeltheworld.ch &mdash; Kontakt wurde in Brevo Liste 14 (HTW Commission Leads) angelegt und hat eine Willkommensmail erhalten.</p>
</body></html>`;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Exported for local preview/testing only — Netlify ignores this.
exports._getWelcomeEmail = getWelcomeEmail;
