import { Hono } from "hono";
import type { Env } from "../types/env";

export const health = new Hono<{ Bindings: Env }>();

health.get("/", (c) => c.json({ ok: true }));
