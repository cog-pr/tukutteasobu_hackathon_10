import { Hono } from "hono";
import { GameRoom } from "./durable-objects/GameRoom";
import { devRooms } from "./routes/devRooms";
import { health } from "./routes/health";
import type { Env } from "./types/env";

const app = new Hono<{ Bindings: Env }>();

app.route("/api/health", health);
app.route("/api/dev/rooms", devRooms);

export default app;
export { GameRoom };
