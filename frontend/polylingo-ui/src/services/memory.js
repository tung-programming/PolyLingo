// src/services/memory.js
// Extended memory service for PolyLingo (frontend).
// - short-term ring buffer
// - persisted facts (long-term, saved to localStorage)
// - heuristics-based fact extraction
// - public helpers: addFact, removeFact, extractFacts, findRelevantFacts
// - safe JSON read/write
//
// Based on the previous file (kept original heuristics + behaviour) and extended.

const SHORT_KEY = "polylingo_shortterm";
const FACTS_KEY = "polylingo_facts";

const defaultMaxTurns = 8;

function nowIso() {
  return new Date().toISOString();
}

const heuristics = {
  // Rough name patterns
  namePatterns: [
    /\bmy name is ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/i,
    /\bi am ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/i,
    /\bi'm ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/i,
    /\bthis is ([A-Z][a-z]+(?: [A-Z][a-z]+)?)\b/i,
  ],
  languageKeywords: {
    ja: ["nihongo", "japanese", "こんにちは", "こんばんは", "おはよう"],
    en: ["english", "en", "hi", "hello", "hey"],
    fi: ["finnish", "suomi", "hei"],
    es: ["español", "es", "hola"],
    tl: ["tagalog", "filipino", "kamusta"],
    da: ["danish", "dansk"],
    nl: ["dutch", "nederlands"],
  },
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

  init({ maxTurns } = {}) {
    if (typeof maxTurns === "number" && maxTurns > 0) this._maxTurns = maxTurns;
    const st = readJson(SHORT_KEY, []);
    const facts = readJson(FACTS_KEY, {});
    writeJson(SHORT_KEY, st.slice(0, this._maxTurns));
    writeJson(FACTS_KEY, facts);
  },

  // Add a turn object: { role: 'user'|'bot', text, lang?, emotion? }
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
    stored.push(item);
    const trimmed = stored.slice(-this._maxTurns);
    writeJson(SHORT_KEY, trimmed);

    // If user turn, try to extract facts automatically
    if (turn.role === "user") {
      const extracted = this._extractFactsFromText(turn.text);
      // merge extracted facts
      for (const k of Object.keys(extracted)) {
        const v = extracted[k];
        if (v == null) continue;
        // Use addFact public helper to merge well
        this.addFact(k, v);
      }
    }
  },

  getShortTerm() {
    return readJson(SHORT_KEY, []);
  },

  getFacts() {
    return readJson(FACTS_KEY, {});
  },

  // Add or merge a fact safely.
  // - If key does not exist -> set
  // - If exists and both arrays -> merge unique
  // - If exists and scalar -> keep existing (do not overwrite) unless `force=true`
  addFact(key, value, { force = false } = {}) {
    if (!key) return;
    const facts = this.getFacts();
    const existing = facts[key];

    // if forcing, just set
    if (force) {
      facts[key] = value;
      writeJson(FACTS_KEY, facts);
      return;
    }

    // merge arrays
    if (Array.isArray(existing) && Array.isArray(value)) {
      const set = new Set([...existing, ...value]);
      facts[key] = Array.from(set);
    } else if (!existing) {
      // store new fact
      facts[key] = value;
    } else {
      // keep existing (do not clobber) - but if existing is array and new scalar add if not exists
      if (Array.isArray(existing) && !Array.isArray(value)) {
        if (!existing.includes(value)) existing.push(value);
        facts[key] = existing;
      } else {
        // existing scalar present -> do not overwrite
        // option: if value is more specific (longer string) we could replace, but keep safe default
      }
    }
    writeJson(FACTS_KEY, facts);
  },

  // Remove a single fact key
  removeFact(key) {
    if (!key) return;
    const facts = this.getFacts();
    if (facts[key]) {
      delete facts[key];
      writeJson(FACTS_KEY, facts);
    }
  },

  // manual fact update (overwrite)
  updateFact(key, value) {
    const facts = this.getFacts();
    facts[key] = value;
    writeJson(FACTS_KEY, facts);
  },

  // Clear only facts (keep shortterm)
  clearFacts() {
    writeJson(FACTS_KEY, {});
  },

  // clear all memory (shortterm + facts)
  clear() {
    writeJson(SHORT_KEY, []);
    writeJson(FACTS_KEY, {});
  },

  export() {
    return {
      shortterm: this.getShortTerm(),
      facts: this.getFacts(),
    };
  },

  setMaxTurns(n) {
    if (typeof n !== "number" || n <= 0) return;
    this._maxTurns = n;
    const stored = readJson(SHORT_KEY, []).slice(-this._maxTurns);
    writeJson(SHORT_KEY, stored);
  },

  // Public wrapper to use extraction heuristics from any caller
  extractFacts(text = "") {
    return this._extractFactsFromText(text);
  },

  // Very small helper to retrieve facts relevant to a query string
  // naive substring match across fact values, returns an object of matches
  findRelevantFacts(query = "") {
    const out = {};
    if (!query) return out;
    const q = query.toLowerCase();
    const facts = this.getFacts();
    for (const [k, v] of Object.entries(facts)) {
      try {
        if (typeof v === "string" && v.toLowerCase().includes(q)) out[k] = v;
        else if (Array.isArray(v)) {
          const matches = v.filter((it) => String(it).toLowerCase().includes(q));
          if (matches.length) out[k] = matches;
        } else if (typeof v === "object" && v !== null) {
          const s = JSON.stringify(v).toLowerCase();
          if (s.includes(q)) out[k] = v;
        }
      } catch {}
    }
    return out;
  },

  // Private heuristics-based extractor (kept as-is, extended only slightly)
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
        const name = m[1]
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
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

    // 4) "likes" extraction: naive "I like X" or "I love X"
    const likeMatch = normalized.match(/\b(I like|I love|I'm into|I enjoy) ([a-zA-Z0-9 ,&]+?)(?:[.!?]|$)/i);
    if (likeMatch && likeMatch[2]) {
      const raw = likeMatch[2].split(/,| and | & /i).map((s) => s.trim()).filter(Boolean);
      if (raw.length) out.likes = raw;
    }

    // 5) last_topic: capture "about X" or first few words
    const topicMatch = normalized.match(/\b(about|regarding|on|about the topic of) ([a-zA-Z0-9 ,&]+?)(?:[.!?]|$)/i);
    if (topicMatch && topicMatch[2]) {
      out.last_topic = topicMatch[2].trim().split(" ").slice(0, 6).join(" ");
    } else {
      out.last_topic = normalized.split(" ").slice(0, 8).join(" ");
    }

    // remove nulls
    Object.keys(out).forEach((k) => {
      if (out[k] == null) delete out[k];
      // normalize arrays to unique arrays
      if (Array.isArray(out[k])) out[k] = Array.from(new Set(out[k]));
    });

    return out;
  },
};

memory.init();

export default memory;
