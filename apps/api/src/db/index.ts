import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ENV } from "../env.js";
import * as schema from "./schema.js";

const client = postgres(ENV.databaseUrl, { ssl: "require", max: 10 });
export const db = drizzle(client, { schema });
