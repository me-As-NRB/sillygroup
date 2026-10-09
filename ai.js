import Anthropic from "@anthropic-ai/sdk";

// Provider is picked from whichever key is set in the environment:
//   OPENROUTER_API_KEY -> OpenRouter (free models by default)
//   ANTHROPIC_API_KEY  -> Claude via Anthropic's API
// With neither, the game uses the built-in question bank.
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openrouter/free";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const anthropic = !OPENROUTER_KEY && process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export const aiProvider = OPENROUTER_KEY ? "openrouter" : anthropic ? "anthropic" : null;
export const aiEnabled = Boolean(aiProvider);

const SCHEMA = {
  type: "object",
  properties: {
    questions: { type: "array", items: { type: "string" } }
  },
  required: ["questions"],
  additionalProperties: false
};

function buildPrompt({ count, theme, playerCount, avoid }) {
  return [
    `Write ${count} fresh questions for a party game played by a group of ${playerCount} people who know each other.`,
    "Every player votes for the person in the group who best fits the question; the most-voted name wins.",
    'Each question must be answerable with one person\'s name, e.g. "Who in the group is the most self-obsessed?" or "Who is most likely to ...?".',
    "Keep them playful, varied and light-hearted roasts. Nothing sexual, hateful, or about health, religion, caste, body or money troubles.",
    "One sentence each, under 110 characters, no numbering.",
    theme ? `The group describes itself as: "${theme}". Tailor some questions to that.` : "",
    avoid.length
      ? `Do not repeat or closely rephrase any of these questions already played:\n- ${avoid.slice(-120).join("\n- ")}`
      : "",
    'Reply with JSON only, in the form {"questions": ["...", "..."]}.'
  ]
    .filter(Boolean)
    .join("\n");
}

// Pulls the questions array out of a model reply, tolerating code fences or extra text.
function parseQuestions(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return [];
  const parsed = JSON.parse(text.slice(start, end + 1));
  return Array.isArray(parsed.questions) ? parsed.questions : [];
}

async function askOpenRouter(prompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "Who In The Room"
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: { name: "questions", strict: true, schema: SCHEMA }
      }
    }),
    // Free models can be slow; give up and use the built-in bank after this.
    signal: AbortSignal.timeout(30_000)
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function askClaude(prompt) {
  const response = await anthropic.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: SCHEMA }
    },
    messages: [{ role: "user", content: prompt }]
  });
  if (response.stop_reason === "refusal") {
    throw new Error(`refused (${response.stop_details?.category})`);
  }
  return response.content.find((b) => b.type === "text")?.text ?? "";
}

// Asks the configured AI for fresh "who in the group..." questions. Returns []
// on any failure so the caller can fall back to the built-in bank.
export async function generateQuestions(opts) {
  if (!aiProvider) return [];
  try {
    const prompt = buildPrompt(opts);
    const text = aiProvider === "openrouter" ? await askOpenRouter(prompt) : await askClaude(prompt);
    const avoidSet = new Set(opts.avoid.map((q) => q.toLowerCase()));
    return parseQuestions(text)
      .map((q) => String(q).trim())
      .filter((q) => q.length > 5 && q.length <= 200 && !avoidSet.has(q.toLowerCase()))
      .slice(0, opts.count);
  } catch (err) {
    console.error(`AI question generation failed (${aiProvider}):`, err?.message || err);
    return [];
  }
}
