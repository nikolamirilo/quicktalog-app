/**
 * Rewrites the Clerk user id that pre-cutover checkouts left in Paddle
 * subscription `custom_data` to the user's Supabase uuid, re-signed. Without
 * it the webhook sees a signed id that no user has and reports `conflict`, so
 * renewals and cancellations of those subscriptions never reach the database.
 *
 * Run it on each environment BEFORE the migration that drops
 * `migration.clerk_user_map`: the map is the only record of which Clerk id
 * became which uuid.
 *
 *   DRY_RUN=1 npx tsx scripts/paddle/rewrite-legacy-custom-data.ts
 *   DRY_RUN=0 npx tsx scripts/paddle/rewrite-legacy-custom-data.ts
 *
 * Environment, exported in the shell for the target environment:
 *   PADDLE_API_KEY, NEXT_PUBLIC_PADDLE_ENV (`sandbox` | `production`),
 *   PADDLE_CUSTOM_DATA_SECRET (the one that environment's app signs with),
 *   DB_ADMIN_CONNECTION_STRING (the `postgres` login; only read from).
 * Sandbox must point at the TEST database and production at PROD, or it refuses.
 *
 * A canceled subscription cannot be updated in Paddle, so those are only
 * reported, together with any status the database missed while events were
 * being dropped. Re-running is safe: a rewritten subscription is no longer legacy.
 */

import { createHmac } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { Environment, LogLevel, Paddle } from "@paddle/paddle-node-sdk";
import postgres from "postgres";

const PROJECT_REFS = {
	sandbox: "imhinsgyzzyblghwnedk",
	production: "uhfbapjuzvlyzyodxhqn",
} as const;

const CLERK_ID = /^user_[A-Za-z0-9]{10,64}$/;

export type PaddleSubscription = {
	id: string;
	status: string;
	customerId: string;
	customData: Record<string, unknown> | null;
};

export type MappedUser = { userId: string; customerId: string | null };

export type Action =
	| { kind: "rewrite"; userId: string; customData: Record<string, unknown> }
	| { kind: "canceled"; userId: string | null }
	| { kind: "unmapped" }
	| { kind: "customer-mismatch"; userId: string };

/** The Clerk id a subscription still carries, or null when it is not legacy. */
export function legacyClerkId(sub: PaddleSubscription): string | null {
	const id = sub.customData?.user_id;
	return typeof id === "string" && CLERK_ID.test(id) ? id : null;
}

/**
 * What to do with one legacy subscription. The uuid is only written when the
 * mapped user is unlinked or linked to this same Paddle customer, so the
 * rewrite can never point a subscription at somebody else's account.
 */
export function planAction(
	sub: PaddleSubscription,
	clerkId: string,
	map: ReadonlyMap<string, MappedUser>,
	sign: (userId: string) => string,
): Action {
	const user = map.get(clerkId);
	if (sub.status === "canceled") {
		return { kind: "canceled", userId: user?.userId ?? null };
	}
	if (!user) return { kind: "unmapped" };
	if (user.customerId && user.customerId !== sub.customerId) {
		return { kind: "customer-mismatch", userId: user.userId };
	}
	return {
		kind: "rewrite",
		userId: user.userId,
		customData: {
			...sub.customData,
			user_id: user.userId,
			sig: sign(user.userId),
		},
	};
}

/** Must match `signUserId` in src/lib/paddle/signature.ts, which is server-only. */
export const signerFor = (secret: string) => (userId: string) =>
	createHmac("sha256", secret).update(`v1.${userId}`).digest("hex");

function requireEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`${name} must be set`);
	return value;
}

async function confirm(count: number): Promise<void> {
	const expected = String(count);
	if (!process.stdin.isTTY) {
		if (process.env.CONFIRM_COUNT !== expected) {
			throw new Error(
				`no terminal to confirm on: re-run with CONFIRM_COUNT=${expected}`,
			);
		}
		return;
	}
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = await rl.question(
			`  type ${expected} to rewrite ${expected} subscriptions: `,
		);
		if (answer.trim() !== expected)
			throw new Error("confirmation did not match");
	} finally {
		rl.close();
	}
}

async function main(): Promise<void> {
	const env = requireEnv("NEXT_PUBLIC_PADDLE_ENV");
	if (env !== "sandbox" && env !== "production") {
		throw new Error("NEXT_PUBLIC_PADDLE_ENV must be sandbox or production");
	}
	const apiKey = requireEnv("PADDLE_API_KEY");
	const dbUrl = requireEnv("DB_ADMIN_CONNECTION_STRING");
	const sign = signerFor(requireEnv("PADDLE_CUSTOM_DATA_SECRET"));

	if (!dbUrl.includes(PROJECT_REFS[env])) {
		throw new Error(
			`Paddle ${env} must be paired with database ${PROJECT_REFS[env]}`,
		);
	}
	const keyEnv = apiKey.startsWith("pdl_live_")
		? "production"
		: apiKey.startsWith("pdl_sdbx_")
			? "sandbox"
			: null;
	if (keyEnv && keyEnv !== env) {
		throw new Error(`PADDLE_API_KEY is a ${keyEnv} key, not ${env}`);
	}

	const dryRun = process.env.DRY_RUN !== "0";
	const sql = postgres(dbUrl, { prepare: false, max: 1 });
	const paddle = new Paddle(apiKey, {
		environment:
			env === "production" ? Environment.production : Environment.sandbox,
		logLevel: LogLevel.error,
	});

	try {
		const { map, dbStatus } = await sql.begin("read only", async (tx) => {
			const rows = await tx<
				{ clerkId: string; userId: string; customerId: string | null }[]
			>`
				select m.clerk_user_id as "clerkId", u.id as "userId", u.customer_id as "customerId"
				  from migration.clerk_user_map m
				  join public.users u on u.id = m.supabase_user_id::text`;
			const subs = await tx<{ id: string; status: string }[]>`
				select subscription_id as id, subscription_status as status
				  from public.subscriptions`;
			return {
				map: new Map(rows.map((r) => [r.clerkId, r])),
				dbStatus: new Map(subs.map((s) => [s.id, s.status])),
			};
		});

		const planned: { sub: PaddleSubscription; action: Action }[] = [];
		for await (const s of paddle.subscriptions.list({ perPage: 200 })) {
			const sub: PaddleSubscription = {
				id: s.id,
				status: s.status,
				customerId: s.customerId,
				customData: (s.customData as Record<string, unknown> | null) ?? null,
			};
			const clerkId = legacyClerkId(sub);
			if (clerkId)
				planned.push({ sub, action: planAction(sub, clerkId, map, sign) });
		}

		console.log(
			`\n  ${env}: ${planned.length} subscriptions still carry a Clerk id\n`,
		);
		for (const { sub, action } of planned) {
			const stored = dbStatus.get(sub.id) ?? "missing";
			const drift =
				stored === sub.status ? "" : `  db=${stored} (missed events)`;
			console.log(
				`  ${action.kind.padEnd(17)} ${sub.id}  ${sub.status}${drift}`,
			);
		}

		const rewrites = planned.filter(
			(
				p,
			): p is {
				sub: PaddleSubscription;
				action: Extract<Action, { kind: "rewrite" }>;
			} => p.action.kind === "rewrite",
		);
		if (rewrites.length === 0) {
			console.log("\n  nothing to rewrite\n");
			return;
		}
		if (dryRun) {
			console.log(
				`\n  would rewrite ${rewrites.length}; re-run with DRY_RUN=0\n`,
			);
			return;
		}

		await confirm(rewrites.length);
		let done = 0;
		for (const { sub, action } of rewrites) {
			await paddle.subscriptions.update(sub.id, {
				customData: action.customData,
			});
			done++;
		}
		console.log(`\n  rewrote ${done} subscriptions\n`);
	} finally {
		await sql.end({ timeout: 5 });
	}
}

if (process.argv[1]?.endsWith("rewrite-legacy-custom-data.ts")) {
	main().catch((error) => {
		console.error(
			`\n  FAILED: ${error instanceof Error ? error.message : error}\n`,
		);
		process.exit(1);
	});
}
