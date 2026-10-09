import { describe, expect, it } from "vitest";
import { GENRES } from "../shared/genres";
import { REACTIONS, SCENES, sceneQuestions } from "../server/scenes";

const banned = /\b(sex|sexy|nude|naked|fuck|shit|bitch|chutiya|bhenchod|madarchod|gaand|lund|randi|horny|porn)\b/i;

describe("scenario questions", () => {
  it("exist for every theme in both languages", () => {
    const missing = GENRES.filter((g) => g.id !== "random" && !(SCENES[g.id]?.en.length && SCENES[g.id]?.hi.length));
    expect(missing.map((g) => g.id)).toEqual([]);
  });

  it("are conditional and well formed", () => {
    for (const q of sceneQuestions("movies", "savage", "en")) expect(q).toMatch(/^If .+, who would .+\?$/);
    for (const q of sceneQuestions("movies", "blunt", "hinglish")) expect(q).toMatch(/^(Agar .+, toh kaun .+|If .+, who would .+)\?$/);
  });

  it("give every theme dozens of distinct questions per language", () => {
    const qs = sceneQuestions("trek", "savage", "en");
    expect(new Set(qs).size).toBe(qs.length);
    expect(qs.length).toBe(SCENES.trek.en.length * REACTIONS.savage.en.length);
  });

  it("use a different scene and a different reaction for the first questions of a round", () => {
    const qs = sceneQuestions("party", "savage", "en").slice(0, SCENES.party.en.length);
    const scenes = qs.map((q) => q.slice(3, q.indexOf(", who would")));
    const reactions = qs.map((q) => q.slice(q.indexOf("who would ") + 10));
    expect(new Set(scenes).size).toBe(qs.length);
    expect(new Set(reactions).size).toBe(qs.length);
  });

  it("mix two Hinglish to one English in Hinglish rounds", () => {
    const qs = sceneQuestions("office", "savage", "hinglish").slice(0, 9);
    expect(qs.filter((q) => q.startsWith("Agar "))).toHaveLength(6);
  });

  it("are never vulgar", () => {
    const all = GENRES.flatMap((g) => (["savage", "blunt"] as const).flatMap((t) => sceneQuestions(g.id, t, "hinglish")));
    expect(all.filter((q) => banned.test(q))).toEqual([]);
  });
});
