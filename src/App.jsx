import { useState, useRef, useEffect } from "react";
import {
  Sparkles, Copy, Check, Heart, RefreshCw, Languages, Moon, Sun,
  Star, History, Trash2, ClipboardCopy, SlidersHorizontal,
} from "lucide-react";

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

const SPICE = [
  { level: 1, label: "Mild", note: "safe for a first message" },
  { level: 2, label: "Medium", note: "flirty, a little cheeky" },
  { level: 3, label: "Spicy", note: "confident, borderline bold" },
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

const PLATFORMS = [
  { id: "general", label: "General" },
  { id: "tinder", label: "Tinder" },
  { id: "bumble", label: "Bumble" },
  { id: "hinge", label: "Hinge" },
  { id: "instagram", label: "Instagram" },
];

const COUNTS = [5, 10, 15];

function buildPrompt({ context, style, spice, lang, platform, count, creativity, emoji }) {
  const styleObj = STYLES.find((s) => s.id === style);
  const spiceObj = SPICE.find((s) => s.level === spice);
  const langObj = LANGS.find((l) => l.id === lang);

  const langInstruction =
    lang === "hi"
      ? "Write in natural, everyday Hindi (Devanagari script) — the way a real person texts, not textbook Hindi."
      : lang === "hinglish"
      ? "Write in Hinglish (Hindi mixed with English, Roman script) — the way people actually text friends."
      : `Write in natural, conversational ${langObj.label}, the way a native speaker actually texts.`;

  const platformNote =
    platform === "general"
      ? ""
      : `\nPlatform context: this is for ${PLATFORMS.find((p) => p.id === platform).label}. Match the norms of that platform (Hinge favors referencing a specific prompt/photo; Tinder/Bumble openers are punchier; Instagram DMs can reference a post or story).`;

  const creativityNote =
    creativity >= 80
      ? "Be unconventional and surprising — avoid the obvious angle, take a creative left turn."
      : creativity >= 40
      ? "Balance originality with what reliably lands — creative but not weird."
      : "Keep it safe, clear, and reliably charming rather than experimental.";

  const emojiNote = emoji
    ? "You may use 1 tasteful emoji per line at most, only where it genuinely adds warmth."
    : "Do not use any emojis.";

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

Write ${count} distinct short message drafts (each under 25 words) that fit the situation and tone. Make them specific and personal to the details given — reference the actual context rather than reciting a generic pickup line. Vary the approach across all ${count} (questions, observations, genuine compliments, callback jokes, lightly bold lines) and make sure no two lines feel repetitive or use the same structure. Aim for lines that sound like a genuinely clever, warm real person — never cheesy, never robotic, never a "recited line."

Respond ONLY with valid JSON, no markdown fences, no preamble:
{"lines": ["line 1", "line 2", ...]}`;
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
    </span>
  );
}

export default function RizzAIPro() {
  const [context, setContext] = useState("");
  const [style, setStyle] = useState("witty");
  const [spice, setSpice] = useState(2);
  const [lang, setLang] = useState("hinglish");
  const [platform, setPlatform] = useState("general");
  const [count, setCount] = useState(10);
  const [creativity, setCreativity] = useState(50);
  const [emoji, setEmoji] = useState(true);
  const [theme, setTheme] = useState("pink"); // pink | dark

  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTuning, setShowTuning] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    if (lines.length && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [lines]);

  const generate = async () => {
    if (!context.trim()) {
      setError("Pehle situation toh batao — kuch likho upar box mein.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, style, spice, lang, platform, count, creativity, emoji }),
      });
      if (!res.ok) throw new Error("request failed");
      const parsed = await res.json();
      if (!parsed.lines || !Array.isArray(parsed.lines)) throw new Error("bad shape");
      setLines(parsed.lines);
      setHistory((h) => [
        { id: Date.now(), context, style, lang, lines: parsed.lines, time: new Date().toLocaleTimeString() },
        ...h,
      ].slice(0, 20));
    } catch (e) {
      setError("Kuch gadbad ho gayi, dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const copyAll = () => {
    navigator.clipboard?.writeText(lines.map((l, i) => `${i + 1}. ${l}`).join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
  };

  const toggleFavorite = (line) => {
    setFavorites((f) =>
      f.includes(line) ? f.filter((l) => l !== line) : [...f, line]
    );
  };

  const spiceObj = SPICE.find((s) => s.level === spice);
  const isPink = theme === "pink";

  const bg = isPink
    ? "radial-gradient(ellipse at top, #6B0F2A 0%, #3D0819 55%, #200410 100%)"
    : "radial-gradient(ellipse at top, #1A1A2E 0%, #12121C 55%, #0A0A10 100%)";
  const accent = isPink ? "#FF3D77" : "#7C5CFF";
  const accentSoft = isPink ? "rgba(255,61,119,0.18)" : "rgba(124,92,255,0.18)";
  const border = isPink ? "rgba(255,107,157,0.35)" : "rgba(124,92,255,0.3)";

  return (
    <div
      className="min-h-screen w-full flex justify-center px-4 py-8"
      style={{ background: bg, fontFamily: "'Space Grotesk', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@500;700&display=swap');
        @keyframes floatIn { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
        @keyframes pulseHeart { 0%,100% { transform: scale(1);} 50% { transform: scale(1.15);} }
        .line-card { animation: floatIn 0.35s ease both; font-family: 'Noto Sans Devanagari', 'Space Grotesk', sans-serif; }
        .heart-pulse { animation: pulseHeart 1.8s ease-in-out infinite; }
        .glass { backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
        input[type="range"] {
          -webkit-appearance: none; height: 5px; border-radius: 999px;
          background: linear-gradient(90deg, ${accent} 0%, ${accent} var(--pct), rgba(255,255,255,0.2) var(--pct));
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
          background: #fff; border: 3px solid ${accent}; cursor: pointer; margin-top: -7px;
          box-shadow: 0 0 12px ${accentSoft};
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${accent}; border-radius: 4px; }
      `}</style>

      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase font-bold" style={{ color: accent }}>
            <Heart size={13} className="heart-pulse" fill={accent} strokeWidth={0} />
            rizz ai <span className="opacity-60">pro</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setTheme(isPink ? "dark" : "pink")} className="p-2 rounded-full glass" style={{ background: "rgba(255,255,255,0.08)" }}>
              {isPink ? <Moon size={15} className="text-white" /> : <Sun size={15} className="text-white" />}
            </button>
            <button onClick={() => { setShowFavorites(!showFavorites); setShowHistory(false); }} className="p-2 rounded-full glass relative" style={{ background: "rgba(255,255,255,0.08)" }}>
              <Star size={15} className="text-white" fill={showFavorites ? "#FFD84D" : "none"} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold" style={{ background: accent, color: "#fff" }}>
                  {favorites.length}
                </span>
              )}
            </button>
            <button onClick={() => { setShowHistory(!showHistory); setShowFavorites(false); }} className="p-2 rounded-full glass" style={{ background: "rgba(255,255,255,0.08)" }}>
              <History size={15} className="text-white" />
            </button>
          </div>
        </div>

        {/* Favorites panel */}
        {showFavorites && (
          <div className="rounded-2xl p-4 mb-4 glass" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${border}` }}>
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-1.5"><Star size={14} fill="#FFD84D" /> Favorites</h3>
            {favorites.length === 0 ? (
              <p className="text-white/40 text-sm">Koi favorite nahi hai abhi — line ke saath star icon tap karo.</p>
            ) : (
              <div className="space-y-2">
                {favorites.map((f, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-white text-sm rounded-lg px-3 py-2" style={{ background: accentSoft }}>
                    <span>{f}</span>
                    <button onClick={() => toggleFavorite(f)}><Trash2 size={14} className="text-white/50" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History panel */}
        {showHistory && (
          <div className="rounded-2xl p-4 mb-4 glass max-h-72 overflow-y-auto" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${border}` }}>
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-1.5"><History size={14} /> History</h3>
            {history.length === 0 ? (
              <p className="text-white/40 text-sm">Abhi tak koi generation nahi hui.</p>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="text-sm">
                    <p className="text-white/40 text-[11px] mb-1">{h.time} · {h.style} · {h.lang}</p>
                    <p className="text-white/70 text-xs italic mb-1 truncate">"{h.context}"</p>
                    <div className="space-y-1">
                      {h.lines.slice(0, 2).map((l, i) => (
                        <p key={i} className="text-white text-xs">• {l}</p>
                      ))}
                      {h.lines.length > 2 && <p className="text-white/30 text-xs">+{h.lines.length - 2} more</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <h1 className="text-4xl leading-tight text-white font-bold text-center mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          Say the <span className="italic" style={{ color: accent }}>right</span> thing
        </h1>
        <p className="text-white/60 text-sm text-center mb-5 font-medium">
          Situation batao, main tumhare liye lines likh dunga.
        </p>

        {/* Main input card */}
        <div className="rounded-2xl p-5 mb-5 glass" style={{ background: "rgba(255,255,255,0.06)", border: `1.5px solid ${border}` }}>
          {/* language + platform row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Languages size={14} className="text-white/50" />
            {LANGS.map((l) => (
              <button key={l.id} onClick={() => setLang(l.id)} className="px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                style={{ background: lang === l.id ? accent : "transparent", color: "#fff", border: `1px solid ${lang === l.id ? accent : "rgba(255,255,255,0.25)"}` }}>
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {PLATFORMS.map((p) => (
              <button key={p.id} onClick={() => setPlatform(p.id)} className="px-2.5 py-1 rounded-full text-xs font-semibold transition-colors"
                style={{ background: platform === p.id ? "rgba(255,255,255,0.18)" : "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                {p.label}
              </button>
            ))}
          </div>

          <label className="block text-xs uppercase tracking-wider text-white/50 mb-2 font-bold">What's the situation?</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. Uska bio bolta hai wo vet hai aur abhi marathon complete kiya. Ek ghante pehle match hua."
            rows={3}
            className="w-full bg-transparent text-white placeholder:text-white/35 outline-none resize-none text-[15px] leading-relaxed font-medium"
          />

          <div className="flex flex-wrap gap-2 mt-4">
            {STYLES.map((s) => (
              <button key={s.id} onClick={() => setStyle(s.id)} className="px-3 py-1.5 rounded-full text-sm font-bold transition-colors"
                style={{ background: style === s.id ? accent : "rgba(255,255,255,0.1)", color: "#fff", boxShadow: style === s.id ? `0 0 14px ${accentSoft}` : "none" }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* spice */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-white/50 font-bold">Spice level</span>
              <span className="text-white/80 text-sm font-bold">{spiceObj.label}</span>
            </div>
            <input type="range" min={1} max={3} step={1} value={spice} onChange={(e) => setSpice(Number(e.target.value))}
              style={{ "--pct": `${((spice - 1) / 2) * 100}%`, width: "100%" }} />
            <p className="text-[11px] text-white/40 mt-1 font-medium">{spiceObj.note}</p>
          </div>

          {/* advanced tuning toggle */}
          <button onClick={() => setShowTuning(!showTuning)} className="flex items-center gap-1.5 text-white/50 text-xs font-semibold mt-4">
            <SlidersHorizontal size={13} /> {showTuning ? "Hide" : "Show"} advanced tuning
          </button>

          {showTuning && (
            <div className="mt-3 space-y-4 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase tracking-wider text-white/50 font-bold">Creativity</span>
                  <span className="text-white/70 text-xs">{creativity}%</span>
                </div>
                <input type="range" min={0} max={100} step={10} value={creativity} onChange={(e) => setCreativity(Number(e.target.value))}
                  style={{ "--pct": `${creativity}%`, width: "100%" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/50 font-bold">How many lines</span>
                <div className="flex gap-1.5">
                  {COUNTS.map((c) => (
                    <button key={c} onClick={() => setCount(c)} className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: count === c ? accent : "rgba(255,255,255,0.1)", color: "#fff" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/50 font-bold">Emojis</span>
                <button onClick={() => setEmoji(!emoji)} className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: emoji ? accent : "rgba(255,255,255,0.1)", color: "#fff" }}>
                  {emoji ? "On" : "Off"}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-[#FFB3C9] text-sm mt-3 font-semibold">{error}</p>}

          <button onClick={generate} disabled={loading}
            className="w-full mt-5 rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold text-base transition-transform active:scale-[0.98] disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${accent}, ${isPink ? "#C81558" : "#4B32C3"})`, color: "#fff", boxShadow: `0 4px 20px ${accentSoft}` }}>
            {loading ? (<>Soch raha hoon <TypingDots /></>) : lines.length ? (<><RefreshCw size={17} /> Generate More</>) : (<><Sparkles size={17} /> Lines banao</>)}
          </button>
        </div>

        {/* Results */}
        {lines.length > 0 && (
          <div ref={resultRef}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-white/40 text-xs font-semibold">{lines.length} lines</span>
              <button onClick={copyAll} className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white">
                {copiedAll ? <Check size={13} /> : <ClipboardCopy size={13} />} Copy all
              </button>
            </div>
            <div className="space-y-2.5">
              {lines.map((line, idx) => (
                <div key={idx} className="line-card rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-start justify-between gap-3"
                  style={{ background: `linear-gradient(135deg, ${accentSoft}, rgba(0,0,0,0.1))`, border: `1.5px solid ${border}`, animationDelay: `${idx * 60}ms` }}>
                  <p className="text-white text-[15px] leading-relaxed font-semibold flex-1">{line}</p>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => toggleFavorite(line)} aria-label="Toggle favorite">
                      <Star
                        size={16}
                        fill={favorites.includes(line) ? "#FFD84D" : "none"}
                        color={favorites.includes(line) ? "#FFD84D" : "#ffffff80"}
                      />
                    </button>
                    <button onClick={() => copy(line, idx)} className="text-white/50 hover:text-white">
                      {copiedIdx === idx ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] text-white/35 pt-3 font-medium">
              Bhejne se pehle thoda apna touch de do — sabse acchi lines wahi hoti hain jo tumhari khud ki lage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
