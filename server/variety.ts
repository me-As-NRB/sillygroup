// Keeps questions varied: different life areas each round, no near-duplicates,
// and a per-host memory so the same host doesn't see repeats across games.
import { createHash, randomBytes } from "node:crypto";
import type { ModeId, ToneId } from "../shared/types";

/** Life areas questions are spread across; each round samples a fresh set. */
export const ANGLES = [
  "phone and social media habits",
  "food and eating habits",
  "money and spending",
  "love life, crushes and exes",
  "secrets and lies",
  "work or studies",
  "family and relatives",
  "travel mishaps",
  "sleep and laziness",
  "clothes and looks (style only, never body)",
  "parties and nightlife",
  "fights, ego and apologies",
  "jealousy and competition",
  "weird personal habits",
  "texting and replying",
  "fitness and health resolutions",
  "driving and getting around",
  "shopping",
  "childhood",
  "future plans and ambitions",
  "handling an emergency",
  "embarrassing moments",
  "hidden talents",
  "loyalty in friendship",
  "gossip",
  "punctuality and plans",
  "games and sports",
  "music, singing and dancing",
  "movies and shows",
  "cooking and the kitchen",
  "pets and animals",
  "festivals and celebrations",
  "advice and opinions",
  "showing off",
  "being fake versus being real",
  "risk-taking and dares"
] as const;

/** Sweet and playful parts of a relationship, used instead of ANGLES in couple mode. */
export const COUPLE_ANGLES = [
  "how you met and first impressions",
  "the first date",
  "saying 'I love you'",
  "date nights",
  "surprises and gifts",
  "anniversaries and special days",
  "good-morning texts and late-night calls",
  "missing each other",
  "small fights and making up",
  "cute habits and pet names",
  "cooking and food for each other",
  "travelling together",
  "your song, movies and music together",
  "each other's families",
  "each other's friends",
  "living together someday",
  "lazy Sundays and sleep habits",
  "taking care of each other when sick",
  "photos and memories",
  "dancing and singing together",
  "festivals and celebrations together",
  "little daily gestures",
  "who loves whom more",
  "dreams and future plans"
] as const;

/** Deeper, more personal parts of a relationship, for the Intimate tone. */
export const INTIMATE_ANGLES = [
  "the moment you knew you were in love",
  "the fear of losing each other",
  "feelings you have never said out loud",
  "insecurities and reassurance",
  "love languages and feeling loved",
  "the hardest time you got through together",
  "your future home and life together",
  "marriage and growing old together",
  "being apart and missing each other",
  "memories you replay in your head",
  "sacrifices you would make for each other",
  "trust and keeping promises",
  "apologies and forgiveness",
  "dreams you share",
  "late-night heart-to-hearts",
  "how you have changed each other",
  "being accepted by each other's families",
  "vulnerable moments",
  "the little things you notice about each other",
  "first touches: holding hands, the first hug"
] as const;

/** The angle pool for a round: everyday life for friends, romance for couples. */
export function anglesFor(mode: ModeId, tone: ToneId): readonly string[] {
  if (mode !== "couple") return ANGLES;
  return tone === "intimate" ? INTIMATE_ANGLES : COUPLE_ANGLES;
}

/** A fresh random set of distinct angles for one round. */
export function sampleAngles(count: number, random: () => number = Math.random, angles: readonly string[] = ANGLES): string[] {
  const pool: string[] = [...angles];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

// Words that carry no meaning for "is this the same question?", in English and Hinglish.
const STOP = new Set(
  (
    "who whose whom which what is are was were be been the a an of to in on at for with and or but " +
    "most more likely would will could can does do did has have had their them they his her he she " +
    "here this that these those group our us we you your one ever even still first last always never " +
    "kaun kiska kiski kiske kis sabse zyada hai hain ho hoga hogi ka ki ke ko mein me se pe par aur " +
    "bhi toh to ya jo jab tak wala wali wale kya kar karta karti karega karegi " +
    // "the other" / "dusre ke liye" and helper verbs appear in almost every couple question.
    "other each dusre dusra dusri liye jaata jaati jaate jaayega jaayegi hota hoti hote raha rahi rahe deta deti leta leti sakta sakti"
  ).split(" ")
);

function words(question: string): Set<string> {
  return new Set(
    question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      // Crude stemming so "forgets"/"forgetting"/"forget" match.
      .map((w) => w.replace(/(ing|ed|es|s)$/, ""))
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}

/** True when two questions are about the same thing, even if worded differently. */
/** The last few words: scenario questions with the same reaction end the same way. */
function ending(question: string, n = 4): string {
  return question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean).slice(-n).join(" ");
}

/** Same punchline ("…who would lie about it for the next five years?"): fine across rounds, not twice in one. */
export function sameEnding(a: string, b: string): boolean {
  const ea = ending(a);
  return ea.split(" ").length >= 4 && ea === ending(b);
}

export function tooSimilar(a: string, b: string, threshold = 0.6): boolean {
  const wa = words(a);
  const wb = words(b);
  if (!wa.size || !wb.size) return a.trim().toLowerCase() === b.trim().toLowerCase();
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  // Overlap relative to the shorter question catches rewordings that add filler.
  // At least two shared words, so sharing just the theme word ("trek") is fine.
  return shared >= 2 && shared / Math.min(wa.size, wb.size) >= threshold;
}

// Everyday situations a question can be "about". Two questions sharing one feel
// repetitive even with different wording, so a round uses each at most once.
const TOPICS: readonly [string, RegExp][] = [
  ["lateness", /\b(late|punctual|minutes? away|5 minute|der se|time pe)\b/i],
  ["crying", /\b(cry|cries|crying|ro(ta|ti|ega|yega|ye)|rone|emotional|tears)\b/i],
  ["phone", /\b(phone|reels?|selfies?|instagram|social media|stor(y|ies)|post(s|ing)?|scroll|whatsapp|chats?|text(s|ing)?|messages?|voice notes?|repl(y|ies)|seen|call(s)?)\b/i],
  ["food", /\b(food|eat(s|ing)?|khaa?na|pizza|maggi|snacks?|cook(s|ing)?|kitchen|hungry|hangry|diet|biryani|lunch|dinner|order(s|ing)?|foodie)\b/i],
  ["money", /\b(money|paise|salary|spend(s|ing)?|kanjoos|bills?|udhaar|budget|shopping|buy|rich|amir|cheap|expensive)\b/i],
  ["exes", /\b(ex|exes|ex's|breakup)\b/i],
  ["romance", /\b(crush|flirt(s|ing)?|propose|i love you|romantic|dates?|dating|anniversary|surprise)\b/i],
  ["sleep", /\b(sleep(s|ing)?|so jaata|so jaati|nap|kharrate|snor(e|es|ing)|alarm|wake|uth(ta|ega|ega))\b/i],
  ["lies", /\b(lie|lies|lying|jhooth|secrets?|fake|natak|pretend(s|ing)?)\b/i],
  ["jealousy", /\b(jealous|possessive|insecure)\b/i],
  ["fights", /\b(fights?|ladai|sorry|apologi[sz]e|argu(e|ment)|behes|gussa|angry|naraz|muh phula)\b/i],
  ["parties", /\b(party|parties|dance|dancer|naach|dj|club|drinks?|peg)\b/i],
  ["gossip", /\b(gossip|peeth peeche|behind (their|people's|people|someone's) backs?)\b/i],
  ["forgetting", /\b(forget(s|ting)?|bhool|lost|lose|loses)\b/i],
  ["travel", /\b(trip|travel|trek|flight|passport|hotel|road trip|summit|tent|holiday)\b/i],
  ["fitness", /\b(gym|fitness|workout|exercise)\b/i],
  ["family", /\b(mummy|mom|mother|family|relatives|parents|in-laws?|nani|dadi|ghar walon)\b/i],
  ["work", /\b(office|boss|meetings?|exam|class|lecture|professor|padhai|studies)\b/i],
  ["movies", /\b(movies?|films?|series|netflix|binge|bollywood|songs?|sing(s|ing)?|music)\b/i],
  ["ego", /\b(ego|attitude|show(s|ing)? off|credit|victim|attention)\b/i]
];

/** The everyday topics a question touches, e.g. ["phone", "romance"]. */
export function topicsOf(question: string): string[] {
  return TOPICS.filter(([, re]) => re.test(question)).map(([name]) => name);
}

// Topics every question of a theme naturally shares. They must not count as
// repeats, or a Trek round could only ever keep one trek question.
const THEME_TOPICS: Readonly<Record<string, readonly string[]>> = {
  trip: ["travel"], trek: ["travel"], roadtrip: ["travel"], beach: ["travel"], camping: ["travel"],
  party: ["parties"], nightout: ["parties"], bachelor: ["parties"], newyear: ["parties"], birthday: ["parties"],
  wedding: ["parties", "family"], festivals: ["family"],
  office: ["work"], wfh: ["work"], teamouting: ["work"], startup: ["work"],
  college: ["work"], hostel: ["work"], school: ["work"], exams: ["work"],
  movies: ["movies"], bollywood: ["movies"], ott: ["movies"], music: ["movies"], dance: ["parties", "movies"],
  gym: ["fitness"], sports: ["fitness"], cricket: ["fitness"], football: ["fitness"],
  food: ["food"], cooking: ["food"],
  dating: ["romance", "exes"], relationships: ["romance", "exes"],
  family: ["family"], cousins: ["family"],
  socialmedia: ["phone"], tech: ["phone"], shopping: ["money"], secrets: ["lies"]
};

/** Topics that the chosen theme(s) make unavoidable, so they are exempt from the one-per-round rule. */
export function themeTopics(genreIds: readonly string[]): Set<string> {
  return new Set(genreIds.flatMap((g) => THEME_TOPICS[g] ?? []));
}

/**
 * Keeps candidates in order, dropping any too similar to `avoid` or to ones
 * already kept, and any that share a topic with a question already kept.
 * Topics in `exempt` (the round's theme) may repeat freely.
 */
export function pickDiverse(
  candidates: readonly string[],
  avoid: readonly string[],
  count: number,
  taken: readonly string[] = [],
  exempt: ReadonlySet<string> = new Set(),
  checkTopics = true
): string[] {
  const kept: string[] = [];
  const topicsOf_ = (q: string) => (checkTopics ? topicsOf(q).filter((t) => !exempt.has(t)) : []);
  const usedTopics = new Set(taken.flatMap(topicsOf_));
  for (const q of candidates) {
    if (kept.length >= count) break;
    const inRound = [...taken, ...kept];
    if (avoid.some((a) => tooSimilar(q, a)) || inRound.some((k) => tooSimilar(q, k) || sameEnding(q, k))) continue;
    const topics = topicsOf_(q);
    if (topics.some((t) => usedTopics.has(t))) continue;
    kept.push(q);
    for (const t of topics) usedTopics.add(t);
  }
  return kept;
}

/**
 * Remembers recent questions per host. The key is a salted hash of the host's
 * IP address: the address itself is never stored or sent anywhere.
 */
export class HostHistory {
  private readonly salt = randomBytes(16);
  private readonly byHost = new Map<string, string[]>();

  constructor(
    private readonly perHost = 300,
    private readonly maxHosts = 2000
  ) {}

  keyFor(ip: string): string {
    return createHash("sha256").update(this.salt).update(ip).digest("hex").slice(0, 16);
  }

  get(key: string | null): string[] {
    return key ? (this.byHost.get(key) ?? []) : [];
  }

  add(key: string | null, questions: readonly string[]): void {
    if (!key) return;
    const list = [...this.get(key), ...questions].slice(-this.perHost);
    this.byHost.delete(key); // re-insert so the Map keeps most-recent-last order
    this.byHost.set(key, list);
    if (this.byHost.size > this.maxHosts) this.byHost.delete(this.byHost.keys().next().value!);
  }
}
