// src/services/memory.js
// Simple short-term memory service for PolyLingo (frontend).
// - ring buffer of recent turns (polylingo_shortterm)
// - key facts store (polylingo_facts)
// - small heuristic extractor for name, languages, mood keywords
// No external deps. Use as: import memory from '../services/memory';

const SHORT_KEY = "polylingo_shortterm";
const FACTS_KEY = "polylingo_facts";

const defaultMaxTurns = 8;

function nowIso() {
  return new Date().toISOString();
}

const heuristics = {
  // Rough name pattern: "My name is X", "I'm X", "I am X"
  namePatterns: [
    /\bmy name is ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/i,
    /\bi am ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/i,
    /\bi'm ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/i,
    /\bthis is ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/i,
  ],
  // language hints
  languageKeywords: {
    ja: ["nihongo", "japanese", "こんにちは", "こんばんは", "おはよう"],
    en: ["english", "en", "hi", "hello", "hey"],
    fi: ["finnish", "suomi", "hei"],
    es: ["español", "es", "hola"],
    tl: ["tagalog", "filipino", "kamusta"],
    da: ["danish", "dansk"],
    nl: ["dutch", "nederlands"],
  },
  // mood keywords mapping to simple moods
  moodKeywords: {
    joy: ["happy", "glad", "good", "great", "joy", "excited", "😊", "😀", "😄"],
    sadness: ["sad", "down", "depressed", "unhappy", "😔", "😢"],
    anger: ["angry", "mad", "furious", "annoyed", "😡"],
    fear: ["scared", "fear", "anxious", "nervous"],
    neutral: ["ok", "okay", "fine", "alright"],
  },
};

// Utilities
function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn("memory readJson parse err", e);
    return fallback;
  }
}
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("memory writeJson err", e);
  }
}

const memory = {
  _maxTurns: defaultMaxTurns,

  // initialization: not strictly required since module is lazy
  init({ maxTurns } = {}) {
    if (typeof maxTurns === "number" && maxTurns > 0) this._maxTurns = maxTurns;
    // ensure keys exist
    const st = readJson(SHORT_KEY, []);
    const facts = readJson(FACTS_KEY, {});
    // re-write to sanitize
    writeJson(SHORT_KEY, st.slice(0, this._maxTurns));
    writeJson(FACTS_KEY, facts);
  },

  // Add a turn object: { role: 'user'|'bot', text: string, lang?, emotion? }
  addTurn(turn) {
    if (!turn || !turn.role || !turn.text) return;
    const stored = readJson(SHORT_KEY, []);
    const item = {
      id: Date.now(),
      role: turn.role,
      text: turn.text,
      lang: turn.lang || null,
      emotion: turn.emotion || null,
      time: nowIso(),
    };
    // push and keep last N
    stored.push(item);
    const trimmed = stored.slice(-this._maxTurns);
    writeJson(SHORT_KEY, trimmed);

    // If this was a user turn, run quick fact extraction
    if (turn.role === "user") {
      const facts = this.getFacts();
      const extracted = this._extractFactsFromText(turn.text);
      // merge extracted facts (do not overwrite non-empty known facts with empty ones)
      for (const k of Object.keys(extracted)) {
        const v = extracted[k];
        if (v == null) continue;
        // simple merge rules: if facts[k] empty -> set, else for arrays merge
        if (!facts[k]) {
          facts[k] = v;
        } else if (Array.isArray(facts[k]) && Array.isArray(v)) {
          // merge unique
          const set = new Set([...facts[k], ...v]);
          facts[k] = Array.from(set);
        } else {
          // keep existing (do not clobber) OR update if new value is more specific
          // here we keep existing unless empty
        }
      }
      writeJson(FACTS_KEY, facts);
    }
  },

  // Return short-term array (oldest -> newest)
  getShortTerm() {
    return readJson(SHORT_KEY, []);
  },

  // Facts object
  getFacts() {
    return readJson(FACTS_KEY, {});
  },

  // manual fact update
  updateFact(key, value) {
    const facts = this.getFacts();
    facts[key] = value;
    writeJson(FACTS_KEY, facts);
  },

  // clear all memory (shortterm + facts)
  clear() {
    writeJson(SHORT_KEY, []);
    writeJson(FACTS_KEY, {});
  },

  // export snapshot object for debugging
  export() {
    return {
      shortterm: this.getShortTerm(),
      facts: this.getFacts(),
    };
  },

  // change size of ring buffer
  setMaxTurns(n) {
    if (typeof n !== "number" || n <= 0) return;
    this._maxTurns = n;
    const stored = readJson(SHORT_KEY, []).slice(-this._maxTurns);
    writeJson(SHORT_KEY, stored);
  },

  // Simple heuristics extractor
  _extractFactsFromText(text = "") {
    const out = {
      user_name: null,
      preferred_lang: null,
      mood: null,
      likes: null,
      last_topic: null,
    };

    const normalized = text.toString();

    // 1) Name detection
    for (const r of heuristics.namePatterns) {
      const m = normalized.match(r);
      if (m && m[1]) {
        // Title-case the name
        const name = m[1].split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        out.user_name = name;
        break;
      }
    }

    // 2) language hint detection (first matching language)
    const lower = normalized.toLowerCase();
    for (const [code, kws] of Object.entries(heuristics.languageKeywords)) {
      for (const kw of kws) {
        if (lower.includes(kw.toLowerCase())) {
          out.preferred_lang = code;
          break;
        }
      }
      if (out.preferred_lang) break;
    }

    // 3) mood detection (pick first matching mood)
    for (const [mood, kws] of Object.entries(heuristics.moodKeywords)) {
      for (const kw of kws) {
        if (lower.includes(kw.toLowerCase())) {
          out.mood = mood;
          break;
        }
      }
      if (out.mood) break;
    }

    // 4) "likes" extraction: very naive "I like X" or "I love X"
    const likeMatch = normalized.match(/\b(I like|I love|I'm into|I enjoy) ([a-zA-Z0-9 ,&]+?)(?:[.!?]|$)/i);
    if (likeMatch && likeMatch[2]) {
      // split by comma or 'and'
      const raw = likeMatch[2].split(/,| and | & /i).map(s => s.trim()).filter(Boolean);
      if (raw.length) out.likes = raw;
    }

    // 5) last_topic: capture short subject like "about sleep" or first 6 words as preview
    const topicMatch = normalized.match(/\b(about|regarding|on|about the topic of) ([a-zA-Z0-9 ,&]+?)(?:[.!?]|$)/i);
    if (topicMatch && topicMatch[2]) {
      out.last_topic = topicMatch[2].trim().split(" ").slice(0, 6).join(" ");
    } else {
      // fallback short preview
      out.last_topic = normalized.split(" ").slice(0, 8).join(" ");
    }

    // remove nulls
    Object.keys(out).forEach(k => {
      if (out[k] == null) delete out[k];
    });

    return out;
  },
};

memory.init(); // ensure default keys exist
 
export default memory;
