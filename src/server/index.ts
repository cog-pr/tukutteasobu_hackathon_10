import { Hono } from "hono";
import { GameRoom } from "./durable-objects/GameRoom";
import { devRooms } from "./routes/devRooms";
import { health } from "./routes/health";
import { rooms } from "./routes/rooms";
import type { Env } from "./types/env";

const app = new Hono<{ Bindings: Env }>();

app.route("/api/health", health);
app.route("/api/dev/rooms", devRooms);
app.route("/api/rooms", rooms);

export default app;
export { GameRoom };
