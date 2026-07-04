// HTW Commission Lead Handler
// Receives: { name, email, phone, path, message }
// → Adds contact to Brevo HTW list (14)
// → Sends welcome email to the customer
// → Sends notification email to David with full lead details

const BREVO_API = 'https://api.brevo.com/v3';
const LIST_ID = 14; // HTW Commission Leads list
const NOTIFY_EMAIL = 'david@heeltheworld.ch';
const SENDER = { name: 'David H. Dudek — HEEL THE WORLD', email: 'davidhdudek@icloud.com' };

const PATH_LABELS = {
  individual: 'Individual Creation',
  collection: 'From Existing Model',
  label: 'Your Own Label',
  press: 'Press & Media',
  collaboration: 'Collaboration',
  speaking: 'Speaking / Appearance',
  general: 'General Inquiry'
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

  const { name = '', email, phone = '', path = 'general', message = '' } = body;

  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email required' }) };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  const pathLabel = PATH_LABELS[path] || path;

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

    // 2. Welcome email to the customer
    const welcomeRes = await fetch(`${BREVO_API}/smtp/email`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email, name: name || email }],
        subject: 'Your Heel the World Commission.',
        htmlContent: getWelcomeEmail(name, pathLabel),
        tags: ['htw-commission', 'welcome']
      })
    });
    const welcomeData = await welcomeRes.json().catch(() => ({}));

    // 3. Notification email to David
    const notifyRes = await fetch(`${BREVO_API}/smtp/email`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: NOTIFY_EMAIL, name: 'David' }],
        replyTo: { email, name: name || email },
        subject: `Neue HTW-Anfrage: ${name || email} (${pathLabel})`,
        htmlContent: getNotifyEmail({ name, email, phone, pathLabel, message }),
        tags: ['htw-commission', 'internal-notify']
      })
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

function getWelcomeEmail(name, pathLabel) {
  const greeting = name ? name.split(' ')[0] : null;
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#fff;color:#111;">
<p style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#888;margin-bottom:32px;">HEEL THE WORLD · by David H. Dudek</p>
${greeting ? `<p>Dear ${greeting},</p>` : '<p>Dear,</p>'}
<p>I've received your inquiry regarding <strong>${pathLabel}</strong>.</p>
<p>A Heel the World commission begins with a conversation — approximately 30 minutes. We discuss your foot, your occasion, your material preference — or I propose something if you prefer to leave the choice to me.</p>
<p>Then three to six weeks in a workshop in Germany, Switzerland or Italy — second generation, fair wages. Then the box arrives: unbleached cardboard, metal rivets, satin lining, a leather charm cut from the same hide as your heel.</p>
<p style="margin:32px 0;">CHF 2.600 — a deposit secures your pair before the first cut is made.</p>
<p>Simply reply to this email. I respond personally.</p>
<p style="margin-top:40px;">— David H. Dudek<br><span style="color:#888;font-size:12px;">HEEL THE WORLD</span></p>
</body></html>`;
}

function getNotifyEmail({ name, email, phone, pathLabel, message }) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
<h2 style="margin-bottom:16px;">Neue HTW-Anfrage</h2>
<table style="width:100%;border-collapse:collapse;font-size:14px;">
<tr><td style="padding:6px 0;color:#888;width:120px;">Name</td><td style="padding:6px 0;">${escapeHtml(name) || '—'}</td></tr>
<tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}">${email}</a></td></tr>
<tr><td style="padding:6px 0;color:#888;">Telefon</td><td style="padding:6px 0;">${escapeHtml(phone) || '—'}</td></tr>
<tr><td style="padding:6px 0;color:#888;">Path</td><td style="padding:6px 0;">${escapeHtml(pathLabel)}</td></tr>
</table>
<p style="margin-top:16px;color:#888;">Nachricht:</p>
<p style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:6px;">${escapeHtml(message) || '(keine)'}</p>
<p style="margin-top:24px;font-size:12px;color:#aaa;">Automatisch von heeltheworld.ch — Kontakt wurde in Brevo Liste 14 (HTW Commission Leads) angelegt und hat eine Willkommensmail erhalten.</p>
</body></html>`;
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
