import { describe, expect, it } from "vitest";
import { renderIndex, renderStatsPage } from "../server/pages";
import { createStats } from "../server/stats";

const template = "<head><!--HEAD--></head>";

describe("renderIndex", () => {
  it("adds link-preview tags with an absolute image URL", () => {
    const html = renderIndex(template, { origin: "https://game.example" });
    expect(html).toContain('<meta property="og:image" content="https://game.example/og.jpg">');
    expect(html).not.toContain("<!--HEAD-->");
    expect(html).not.toContain("goatcounter");
  });

  it("personalises room invites and strips anything that is not a room code", () => {
    const html = renderIndex(template, { origin: "https://game.example", roomCode: 'ab"><script>cd' });
    expect(html).toContain("Join my game! Room ABSC");
    expect(html).not.toContain("<script>");
  });

  it("only adds the visitor counter for a safe code", () => {
    const html = renderIndex(template, { origin: "https://x", goatcounterCode: 'evil"/><x' });
    expect(html).toContain('data-goatcounter="https://evilx.goatcounter.com/count"');
  });
});

describe("stats", () => {
  it("counts totals, themes and tones in memory and renders them", async () => {
    const stats = createStats();
    stats.track("players_joined", 3);
    stats.track("rounds_started");
    stats.track("rounds_finished");
    stats.track("players_in_finished_rounds", 3);
    stats.trackGenres(["trek"]);
    stats.trackTone("savage");

    const snap = await stats.read(3);
    expect(snap.total).toMatchObject({ players_joined: 3, rounds_finished: 1 });
    expect(snap.genres).toEqual({ trek: 1 });
    expect(snap.daily).toHaveLength(3);
    expect(snap.daily.at(-1)?.counts.players_joined).toBe(3);

    const html = renderStatsPage(snap, stats.persistent);
    expect(html).toContain("<b>3.0</b><span>Avg players / round</span>");
    expect(html).toContain("🥾 Trek &amp; Hiking");
    expect(html).toContain("Not saved");
  });
});
