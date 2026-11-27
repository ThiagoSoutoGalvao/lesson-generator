/**
 * Emails inside a Reading Text (Aurora Business, 2026-11-27). Readings are saved as plain paragraphs, so an email
 * thread used to run together on screen. Two shapes are recognised, with no change to the saved content:
 *   1. a paragraph that IS an email: "From: …\nTo: …\nSubject: …\n\nDear …\nbody…\n\nsignature"
 *      (the header may also come on one line: "From: A To: B Subject: C Dear …");
 *   2. a story paragraph that QUOTES an email: … Here is my email: "Subject line: X. Hi Leandro, … Thanks, Valentina."
 * Pure functions, no React, so they can be tested with node.
 */

const HEADER = /^(From|To|Cc|Date|Subject(?: line)?):\s*(.*)$/i;
const GREETING = /^(Dear|Hi|Hello|Hey|Good (?:morning|afternoon|evening))\b[^.!?\n]{0,60}?[,!]?$/i;
const SIGN_OFF = /^(Best regards|Kind regards|Warm regards|Regards|Best wishes|Best|Many thanks|Thanks(?: again| a lot)?|Thank you(?: again)?|Cheers|See you(?: soon| then| on \w+)?|Yours(?: sincerely| faithfully)?|Talk soon|All the best)\s*[,.!]?$/i;

// "… ten more boxes. Thanks, Valentina." — a sign-off and a name at the very end of a run-on email.
const INLINE_END = /\s*\b(Best regards|Kind regards|Warm regards|Regards|Best wishes|Warm wishes|Many thanks|Thanks|Thank you|Cheers|See you soon|Talk soon|Speak soon|All the best),?\s+([A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+)?)\.?$/u;

/**
 * "Dear Marcos, I am writing…" → ["Dear Marcos,", "I am writing…"]. A greeting to several people
 * ("Dear Fabrício, Manuela and Ivan, thank you…") runs to the comma before a lower-case word or "I";
 * otherwise it is the shortest "Hi Name," / "Hi Name!".
 */
function splitGreeting(t) {
    const m = t.match(/^((?:Dear|Hi|Hello|Hey)\b[^.!?\n]{0,60}?,)\s+(?=[a-z]|I\b|I['’])/)
        ?? t.match(/^((?:Dear|Hi|Hello|Hey)\s[^,.!?\n]{1,40}[,!])\s*/);
    return m ? [m[1], t.slice(m[0].length)] : ['', t];
}

const key = h => { const k = h.toLowerCase(); return k.startsWith('subject') ? 'subject' : k; };

/** Shape 1: the whole paragraph is one email. Returns null when it isn't. */
export function parseEmail(text) {
    let t = String(text ?? '').replace(/\r/g, '').trim();
    if (!/^(From|To|Subject):/i.test(t)) return null;
    // A one-line header: put each field on its own line, and the greeting after it.
    if (!/\n/.test(t.split(/\b(?:Dear|Hi|Hello)\b/)[0])) {
        t = t.replace(/\s+(?=(?:To|Cc|Date|Subject):\s)/g, '\n').replace(/\s+(?=(?:Dear|Hi|Hello)\b)/, '\n\n');
    }
    const lines = t.split('\n');
    const email = { from: '', to: '', cc: '', date: '', subject: '', greeting: '', body: [], signOff: '', signature: '' };
    let i = 0;
    for (; i < lines.length; i++) {
        const m = lines[i].trim().match(HEADER);
        if (!m) break;
        // "Subject:\nRE: …" — a value on the next line
        let v = m[2].trim();
        if (!v && lines[i + 1] && !HEADER.test(lines[i + 1].trim()) && lines[i + 1].trim()) v = lines[++i].trim();
        email[key(m[1])] = v;
    }
    if (!email.from && !email.subject) return null;
    const rest = lines.slice(i).join('\n').trim();
    const blocks = rest.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    if (!blocks.length) return email;

    // Greeting: the first line of the first block.
    const first = blocks[0].split('\n');
    if (GREETING.test(first[0].trim())) { email.greeting = first.shift().trim(); }
    else { // "Dear Ms Mendes Thank you for…" on one line
        const g = first[0].match(/^((?:Dear|Hi|Hello)\s+(?:(?:Mr|Ms|Mrs|Dr)\.?\s+)?[A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+)?,?)\s+(?=[A-Z])/u);
        if (g && first[0].length > g[1].length + 20) { email.greeting = g[1]; first[0] = first[0].slice(g[0].length); }
    }
    blocks[0] = first.join('\n').trim();
    if (!blocks[0]) blocks.shift();

    // Sign-off + signature: a sign-off line ("Best regards,") and what follows, or a short closing block of names.
    const last = blocks.length ? blocks[blocks.length - 1].split('\n') : [];
    const so = last.findIndex(l => SIGN_OFF.test(l.trim()));
    if (so >= 0) {
        email.signOff = last[so].trim();
        email.signature = last.slice(so + 1).join('\n').trim();
        const before = last.slice(0, so).join('\n').trim();
        if (before) blocks[blocks.length - 1] = before; else blocks.pop();
    } else if (blocks.length > 1 && last.length <= 6 && last.every(l => l.trim().length <= 90 && !/[.!?]\s+[A-Z]/.test(l))) {
        email.signature = blocks.pop();
    }
    email.body = blocks.flatMap(b => b.split('\n')).map(l => l.trim()).filter(Boolean);
    const end = !email.signOff && email.body.length ? email.body[email.body.length - 1].match(INLINE_END) : null;
    if (end && end.index > 0) {
        email.signOff = `${end[1]},`; email.signature = end[2];
        email.body[email.body.length - 1] = email.body[email.body.length - 1].slice(0, end.index).trim();
    }
    return email;
}

/** Shape 2: email text quoted inside a sentence → { subject, greeting, body, signOff, signature } or null. */
export function parseQuotedEmail(inner) {
    let t = String(inner ?? '').trim();
    const s = t.match(/^Subject(?: line)?:\s*(.+?[.!?])\s+/i);
    // Without a subject, a quote is an email only when it is long and opens with a greeting or ends "Best regards, Name".
    if (!s && !(t.length >= 60 && (/^(Dear|Hi|Hello)\s/.test(t) || INLINE_END.test(t)))) return null;
    const email = { from: '', to: '', cc: '', date: '', subject: s ? s[1].replace(/\.$/, '') : '', greeting: '', body: [], signOff: '', signature: '' };
    if (s) t = t.slice(s[0].length);
    [email.greeting, t] = splitGreeting(t);
    if (!s && !email.greeting && !INLINE_END.test(t)) return null;
    const end = t.match(INLINE_END);
    if (end) { email.signOff = `${end[1]},`; email.signature = end[2]; t = t.slice(0, end.index); }
    email.body = t.trim() ? [t.trim()] : [];
    return email;
}

/** Shape 2 splitter: a paragraph → [{ text }, { email }, { text }…], or null when it quotes no email. */
export function splitQuotedEmails(text) {
    const t = String(text ?? '');
    const re = /[“"]([^"“”]{20,})[”"]/g;
    const out = [];
    let at = 0, found = false;
    for (const m of t.matchAll(re)) {
        const email = parseQuotedEmail(m[1]);
        if (!email) continue;
        found = true;
        const before = t.slice(at, m.index).trim();
        if (before) out.push({ text: before });
        out.push({ email });
        at = m.index + m[0].length;
    }
    if (!found) return null;
    const after = t.slice(at).trim();
    if (after) out.push({ text: after });
    return out;
}

/**
 * Shape 3: the whole reading is ONE email written as paragraphs — the first opens with a greeting (after an optional
 * "Subject: …" line), the last ends with a sign-off and a name. Returns one email, or null.
 */
export function parseLetter(paragraphs) {
    const ps = (paragraphs ?? []).map(p => String(p ?? '').replace(/\r/g, '').trim()).filter(Boolean);
    if (ps.length < 2) return null;
    let first = ps[0], subject = '';
    const s = first.match(/^Subject:\s*(.+)\n/i);
    if (s) { subject = s[1].trim(); first = first.slice(s[0].length).trim(); }
    const [greeting, rest] = splitGreeting(first);
    const end = ps[ps.length - 1].match(INLINE_END);
    if (!greeting || !end || end.index === 0) return null;
    const body = [rest, ...ps.slice(1, -1), ps[ps.length - 1].slice(0, end.index)]
        .flatMap(b => b.split(/\n\s*\n/)).map(b => b.trim()).filter(Boolean);
    return { from: '', to: '', cc: '', date: '', subject, greeting, body, signOff: `${end[1]},`, signature: end[2] };
}
