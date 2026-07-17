// Netlify Function — deployed automatically at /.netlify/functions/generate
// Your ANTHROPIC_API_KEY lives only here on the server, never in the browser.

const STYLES = [
  { id: "witty", label: "Witty", blurb: "clever wordplay, a little smug" },
  { id: "sweet", label: "Sweet", blurb: "warm, sincere, low-key charming" },
  { id: "romantic", label: "Romantic", blurb: "tender, poetic, heartfelt" },
  { id: "savage", label: "Savage", blurb: "cocky one-liners, teasing confidence" },
  { id: "playful", label: "Playful", blurb: "light banter, fun energy" },
  { id: "flirty", label: "Flirty", blurb: "unmistakably interested, charming tension" },
  { id: "deep", label: "Deep", blurb: "thoughtful, a little vulnerable, genuine" },
  { id: "softboy", label: "Soft Boy", blurb: "gentle, sincere, emotionally open" },
  { id: "confident", label: "Confident", blurb: "direct, sure of himself, no games" },
  { id: "funny", label: "Funny", blurb: "genuinely makes them laugh out loud" },
  { id: "introvert", label: "Introvert", blurb: "quiet charm, understated, dry humor" },
  { id: "mystery", label: "Mystery", blurb: "intriguing, a little unpredictable, leaves them curious" },
];

const LANGS = [
  { id: "en", label: "English" },
  { id: "hinglish", label: "Hinglish" },
  { id: "hi", label: "हिंदी" },
  { id: "es", label: "Español" },
  { id: "fr", label: "Français" },
  { id: "pt", label: "Português" },
  { id: "ar", label: "العربية" },
  { id: "id", label: "Indonesia" },
  { id: "tr", label: "Türkçe" },
  { id: "de", label: "Deutsch" },
];

const PLATFORMS = {
  general: "General",
  tinder: "Tinder",
  bumble: "Bumble",
  hinge: "Hinge",
  instagram: "Instagram",
};

const SPICE_NOTES = {
  1: { label: "Mild", note: "safe for a first message" },
  2: { label: "Medium", note: "flirty, a little cheeky" },
  3: { label: "Spicy", note: "confident, borderline bold" },
};

function buildPrompt({ context, style, spice, lang, platform, count, creativity, emoji }) {
  const styleObj = STYLES.find((s) => s.id === style) || STYLES[0];
  const spiceObj = SPICE_NOTES[spice] || SPICE_NOTES[2];
  const langObj = LANGS.find((l) => l.id === lang);

  const langInstruction =
    lang === "hi"
      ? "Write in natural, everyday Hindi (Devanagari script) — the way a real person texts, not textbook Hindi."
      : lang === "hinglish"
      ? "Write in Hinglish (Hindi mixed with English, Roman script) — the way people actually text friends."
      : `Write in natural, conversational ${langObj ? langObj.label : "English"}, the way a native speaker actually texts.`;

  const platformLabel = PLATFORMS[platform] || "General";
  const platformNote =
    platform === "general" || !platform
      ? ""
      : `\nPlatform context: this is for ${platformLabel}. Match the norms of that platform (Hinge favors referencing a specific prompt/photo; Tinder/Bumble openers are punchier; Instagram DMs can reference a post or story).`;

  const creativityNote =
    creativity >= 80
      ? "Be unconventional and surprising — avoid the obvious angle, take a creative left turn."
      : creativity >= 40
      ? "Balance originality with what reliably lands — creative but not weird."
      : "Keep it safe, clear, and reliably charming rather than experimental.";

  const emojiNote = emoji
    ? "You may use 1 tasteful emoji per line at most, only where it genuinely adds warmth."
    : "Do not use any emojis.";

  const n = count || 10;

  return `You help someone write a message to send to a person they're interested in — a dating app opener, a reply to keep a conversation going, or a text to send a crush. You are NOT playing the role of either person in the conversation; you are a writing assistant producing draft lines for the user to consider and personalize.

Situation from the user:
"""
${context}
"""

Tone: ${styleObj.label} — ${styleObj.blurb}.
Spice level: ${spiceObj.label} (${spiceObj.note}). Never crude, never explicit, never anything that could make someone uncomfortable if a stranger said it. Respectful even when bold.
Language: ${langInstruction}
${platformNote}
Creativity: ${creativityNote}
Emoji: ${emojiNote}

Write ${n} distinct short message drafts (each under 25 words) that fit the situation and tone. Make them specific and personal to the details given — reference the actual context rather than reciting a generic pickup line. Vary the approach across all ${n} (questions, observations, genuine compliments, callback jokes, lightly bold lines) and make sure no two lines feel repetitive or use the same structure. Aim for lines that sound like a genuinely clever, warm real person — never cheesy, never robotic, never a "recited line."

Respond ONLY with valid JSON, no markdown fences, no preamble:
{"lines": ["line 1", "line 2", ...]}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { context } = body;
  if (!context || typeof context !== "string" || !context.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing context" }) };
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        messages: [{ role: "user", content: buildPrompt(body) }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("Anthropic API error:", errText);
      return { statusCode: 502, body: JSON.stringify({ error: "Upstream API error" }) };
    }

    const data = await anthropicRes.json();
    const raw = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(raw);
    if (!parsed.lines || !Array.isArray(parsed.lines)) {
      return { statusCode: 502, body: JSON.stringify({ error: "Unexpected model output" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ lines: parsed.lines }) };
  } catch (err) {
    console.error("Generate error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Something went wrong" }) };
  }
};
