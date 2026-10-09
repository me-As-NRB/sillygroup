// Development entry: the game server always uses GAME_PORT (default 3000), so it
// never collides with Vite, even when a tool sets PORT for the dev server.
process.env.PORT = process.env.GAME_PORT || "3000";
await import("./index");

export {};
