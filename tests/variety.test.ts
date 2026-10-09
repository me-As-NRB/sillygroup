import { describe, expect, it } from "vitest";
import { clientIp } from "../server/app";
import { ANGLES, HostHistory, pickDiverse, sampleAngles, tooSimilar } from "../server/variety";

describe("tooSimilar", () => {
  it("catches the same idea worded differently", () => {
    expect(tooSimilar("Who is most likely to forget their bag on a trek?", "Who would forget their bag halfway up a trek?")).toBe(true);
    expect(tooSimilar("Kaun trek pe apna bag hi bhool jaayega?", "Trek pe apna bag kaun bhool jaayega?")).toBe(true);
  });

  it("allows different questions that only share the theme word", () => {
    expect(tooSimilar("Who would complain the most on a trek?", "Who would forget their bag on a trek?")).toBe(false);
    expect(tooSimilar("Who spends the most on shopping?", "Who is the biggest night owl?")).toBe(false);
  });
});

describe("pickDiverse", () => {
  it("drops near-duplicates of played questions and of each other", () => {
    const out = pickDiverse(
      [
        "Who would forget their bag halfway up a trek?",
        "Who spends the most money on snacks?",
        "Who would spend all their money on snacks?",
        "Who is the loudest snorer in the tent?"
      ],
      ["Who is most likely to forget their bag on a trek?"],
      10
    );
    expect(out).toEqual(["Who spends the most money on snacks?", "Who is the loudest snorer in the tent?"]);
  });
});

describe("sampleAngles", () => {
  it("returns distinct life areas, different from round to round", () => {
    const a = sampleAngles(14);
    expect(new Set(a).size).toBe(14);
    expect(a.every((x) => (ANGLES as readonly string[]).includes(x))).toBe(true);
    const rounds = Array.from({ length: 5 }, () => sampleAngles(14).join("|"));
    expect(new Set(rounds).size).toBeGreaterThan(1);
  });
});

describe("HostHistory", () => {
  it("keys hosts by a salted hash, never the raw IP", () => {
    const h = new HostHistory();
    const key = h.keyFor("203.0.113.7");
    expect(key).toMatch(/^[0-9a-f]{16}$/);
    expect(key).not.toContain("203");
    expect(h.keyFor("203.0.113.7")).toBe(key);
    expect(h.keyFor("203.0.113.8")).not.toBe(key);
    expect(new HostHistory().keyFor("203.0.113.7")).not.toBe(key); // different salt per server start
  });

  it("remembers recent questions per host, capped", () => {
    const h = new HostHistory(3, 2);
    h.add("a", ["q1", "q2"]);
    h.add("a", ["q3", "q4"]);
    expect(h.get("a")).toEqual(["q2", "q3", "q4"]);
    h.add("b", ["x"]);
    h.add("c", ["y"]); // over maxHosts: the oldest host ("a") is forgotten
    expect(h.get("a")).toEqual([]);
    expect(h.get(null)).toEqual([]);
  });
});

describe("clientIp", () => {
  it("uses the first forwarded address behind a proxy", () => {
    expect(clientIp("198.51.100.4, 10.0.0.1", "10.0.0.1")).toBe("198.51.100.4");
    expect(clientIp(undefined, "127.0.0.1")).toBe("127.0.0.1");
  });
});
