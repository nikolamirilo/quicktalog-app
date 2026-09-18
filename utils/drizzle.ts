import { schema } from "@quicktalog/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DB_CONNECTION_STRING!;

const client = postgres(connectionString, { prepare: false });
export const drizzleClient = drizzle(client, { schema });
