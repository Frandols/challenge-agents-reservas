import type { Db } from "./db/client";
import type { Now } from "./lib/time";

export type Deps = { db: Db; now: Now };
