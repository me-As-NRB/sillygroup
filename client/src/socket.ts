import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "../../shared/types";

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** One connection for the whole app; same origin in production, proxied by Vite in dev. */
export const socket: GameSocket = io({ transports: ["websocket", "polling"] });
