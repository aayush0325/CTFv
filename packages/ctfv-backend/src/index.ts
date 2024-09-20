import { drizzle } from "drizzle-orm/d1";
import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { JwtVariables } from "hono/jwt";
import { logger } from "hono/logger";

import { Bindings } from "../env";
import * as schema from "./db/schema";

import userRouter from "./routes/user";
import challengesRouter from "./routes/challenges";

type Variables = JwtVariables;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: (origin) => origin,
    credentials: true,
  }),
);
app.use(logger());

app.route('api/users/', userRouter)
app.route('api/challenges/', challengesRouter)

export const getDB = (c: Context) => drizzle(c.env.DATABASE, { schema });

export default app;
