import { describe, expect, it } from "vitest";
import { PLAYER_COLORS, assignColors, initials } from "../client/src/lib/colors";
import { genresLabel, themeLabel } from "../client/src/lib/theme";

describe("assignColors", () => {
  it("gives every player a different colour in join order", () => {
    const map = assignColors(new Map(), ["a", "b", "c"]);
    expect([...map.values()]).toEqual(PLAYER_COLORS.slice(0, 3));
  });

  it("keeps existing colours when players leave and join", () => {
    const first = assignColors(new Map(), ["a", "b", "c"]);
    const next = assignColors(first, ["a", "c", "d"]);
    expect(next.get("a")).toBe(first.get("a"));
    expect(next.get("c")).toBe(first.get("c"));
    expect(new Set([next.get("a"), next.get("c"), next.get("d")]).size).toBe(3);
  });

  it("returns the same map when nothing changed", () => {
    const first = assignColors(new Map(), ["a"]);
    expect(assignColors(first, ["a"])).toBe(first);
  });
});

describe("labels", () => {
  it("builds initials from up to two words", () => {
    expect(initials("Priya Sharma")).toBe("PS");
    expect(initials("Rohan Kumar Verma")).toBe("RK");
    expect(initials("aarav")).toBe("A");
  });

  it("describes themes and tone", () => {
    expect(genresLabel([])).toBe("🎲 Random Mix");
    expect(themeLabel({ genres: ["trek"], tone: "savage", timer: 20, context: "" })).toBe("🥾 Trek & Hiking  |  🔥 Savage");
  });
});
