// App-layer emulation: the P1 call sites from the app-changes draft s.2.3-2.6 written with the REAL drizzle-orm 0.45.2
// query builder and the REAL @quicktalog/common 1.54.0 schema, loaded read-only from the quicktalog-app node_modules.
// Queries are executed on PGlite through drizzle's pg-proxy driver (same PgDialect SQL generation as postgres-js).
// Transactions are emulated with BEGIN/COMMIT on the single PGlite connection (pg-proxy has no transaction API);
// nested tx.transaction() is emulated with SAVEPOINT exactly as drizzle's postgres-js driver does.
const APP = new URL("../../node_modules", import.meta.url).pathname;
const { drizzle } = await import(`${APP}/drizzle-orm/pg-proxy/index.js`);
const orm = await import(`${APP}/drizzle-orm/index.js`);
const pgCore = await import(`${APP}/drizzle-orm/pg-core/index.js`);
export const schema = await import(
	`${APP}/@quicktalog/common/dist/drizzle/migrations/schema.js`
);
const { eq, and, inArray, desc, asc, count, sql } = orm;
const { catalogues, users, userThemes, qrConfigs, newsletter, analytics } =
	schema;

// utils/db/private-schema.ts (app-changes.md s.2.2)
const privateSchema = pgCore.pgSchema("private");
export const paddleEvents = privateSchema.table("paddle_events", {
	eventId: pgCore.text("event_id").primaryKey(),
	eventType: pgCore.text("event_type").notNull(),
	occurredAt: pgCore
		.timestamp("occurred_at", { withTimezone: true, mode: "string" })
		.notNull(),
	processedAt: pgCore
		.timestamp("processed_at", { withTimezone: true, mode: "string" })
		.defaultNow()
		.notNull(),
});

// utils/db/errors.ts (app-changes.md s.1.1, verbatim logic)
export function pgError(e) {
	for (let cur = e, i = 0; cur && i < 5; cur = cur.cause, i++) {
		if (typeof cur?.code === "string" && /^[0-9A-Z]{5}$/.test(cur.code))
			return {
				code: cur.code,
				constraint: cur.constraint_name ?? cur.constraint,
				hint: cur.hint,
			};
	}
	return null;
}
export const isUniqueViolation = (e) => pgError(e)?.code === "23505";
export const isPermissionDenied = (e) => pgError(e)?.code === "42501";

// utils/db/columns.ts
const c = catalogues;
export const PUBLIC_CATALOGUE_COLUMNS = {
	id: c.id,
	name: c.name,
	logo: c.logo,
	heading: c.heading,
	status: c.status,
	source: c.source,
	language: c.language,
	currency: c.currency,
	businessType: c.businessType,
	content: c.content,
	legal: c.legal,
	appearance: c.appearance,
	contact: c.contact,
	header: c.header,
	footer: c.footer,
	partners: c.partners,
	metadata: c.metadata,
	tags: c.tags,
	createdAt: c.createdAt,
	updatedAt: c.updatedAt,
};
export const CATALOGUE_EDITABLE_FIELDS = [
	"logo",
	"heading",
	"language",
	"currency",
	"businessType",
	"content",
	"legal",
	"appearance",
	"contact",
	"header",
	"footer",
	"partners",
	"metadata",
	"tags",
];
export function pickEditable(input) {
	const out = {};
	for (const k of CATALOGUE_EDITABLE_FIELDS)
		if (input && k in input && input[k] !== undefined) out[k] = input[k];
	return out;
}

export class PlanLimitError extends Error {
	constructor(limit) {
		super(`plan_limit:${limit}`);
		this.limit = limit;
	}
}

export function makeApp(db /* harness Db */) {
	const log = [];
	let spCounter = 0;
	const d = drizzle(
		async (text, params, method) => {
			log.push({ sql: text, params, method });
			const r = await db.pg.query(
				text,
				params,
				method === "all" ? { rowMode: "array" } : {},
			);
			return { rows: r.rows };
		},
		{ schema },
	);

	// utils/db/rls.ts inRole (decision s.5.3): one tx, one parameterised set_config statement, no finally reset
	const LIMITS = {
		app_user: { statement: "8s", lock: "3s", idle: "10s" },
		app_public: { statement: "3s", lock: "1s", idle: "5s" },
	};
	let extraWrapperSql = null; // lets a scenario test a wrapper variant (e.g. search_path pin)
	async function tx(fn, { role = null, claims = {}, commit = true } = {}) {
		await db.exec("begin");
		try {
			if (role) {
				if (role !== "app_user" && role !== "app_public")
					throw new Error("invalid app role");
				const l = LIMITS[role];
				await d.execute(sql`select
      pg_catalog.set_config('role', ${role}, true),
      pg_catalog.set_config('request.jwt.claims', ${JSON.stringify({ ...claims, role })}, true),
      pg_catalog.set_config('search_path', 'public, pg_temp', true),
      pg_catalog.set_config('statement_timeout', ${l.statement}, true),
      pg_catalog.set_config('lock_timeout', ${l.lock}, true),
      pg_catalog.set_config('idle_in_transaction_session_timeout', ${l.idle}, true)`);
				if (extraWrapperSql) await d.execute(extraWrapperSql);
			} else {
				// asAdmin (decision s.5.4)
				await d.execute(
					sql`select pg_catalog.set_config('statement_timeout', '15s', true), pg_catalog.set_config('application_name', ${"admin:op"}, true)`,
				);
			}
			const v = await fn(d);
			await db.exec(commit ? "commit" : "rollback");
			return v;
		} catch (e) {
			try {
				await db.exec("rollback");
			} catch {}
			throw e;
		}
	}
	const withUser = (me, fn, o = {}) =>
		tx(fn, {
			...o,
			role: "app_user",
			claims: {
				sub: me.userId,
				...(me.sessionId ? { session_id: me.sessionId } : {}),
			},
		});
	const withPublic = (fn, o = {}) =>
		tx(fn, { ...o, role: "app_public", claims: {} });
	const asAdmin = (op, fn, o = {}) => tx(fn, { ...o, role: null });
	// drizzle postgres-js nested transaction = SAVEPOINT sp<n> / RELEASE / ROLLBACK TO
	async function nested(t, fn) {
		const name = `sp${++spCounter}`;
		await t.execute(sql.raw(`savepoint ${name}`));
		try {
			const v = await fn(t);
			await t.execute(sql.raw(`release savepoint ${name}`));
			return v;
		} catch (e) {
			await t.execute(sql.raw(`rollback to savepoint ${name}`));
			throw e;
		}
	}

	// lib/entitlements/plan.ts (tiers lookup replaced by a plan->limits map passed by the scenario)
	const getPlanForUpdate = async (t, me) => {
		const [row] = await t
			.select({ planId: users.planId })
			.from(users)
			.where(eq(users.id, me.userId))
			.for("no key update");
		if (!row?.planId) throw new Error("PlanNotFoundError");
		return row;
	};
	// lib/entitlements/catalogue.ts
	const assertCatalogueQuota = async (t, me, max) => {
		const [{ n }] = await t
			.select({ n: count() })
			.from(catalogues)
			.where(eq(catalogues.createdBy, me.userId));
		if (n >= max) throw new PlanLimitError("catalogues");
	};
	const assertCanActivate = async (t, trafficLimit) => {
		const [u] = await t.execute(sql`select pageviews from private.my_usage()`);
		if (Number(u?.pageviews ?? 0) >= trafficLimit)
			throw new PlanLimitError("traffic");
	};
	// lib/catalogue/draft-cache.ts
	const loadOwnedCatalogue = async (t, me, name) => {
		const [row] = await t
			.select()
			.from(c)
			.where(and(eq(c.name, name), eq(c.createdBy, me.userId)))
			.limit(1);
		return row ?? null;
	};

	const app = {
		log,
		d,
		withUser,
		withPublic,
		asAdmin,
		setWrapperExtra(q) {
			extraWrapperSql = q;
		},
		loadOwnedCatalogue,
		// actions/catalogue.ts
		async deleteItem(me, name) {
			const rows = await withUser(me, (t) =>
				t
					.delete(catalogues)
					.where(
						and(eq(catalogues.name, name), eq(catalogues.createdBy, me.userId)),
					)
					.returning({ name: catalogues.name }),
			);
			return rows.length === 1;
		},
		async deleteMultipleItems(me, ids) {
			const names = await withUser(me, async (t) => {
				const owned = await t
					.select({ id: catalogues.id })
					.from(catalogues)
					.where(
						and(
							inArray(catalogues.id, ids),
							eq(catalogues.createdBy, me.userId),
						),
					);
				if (owned.length !== ids.length) return null;
				const rows = await t
					.delete(catalogues)
					.where(
						and(
							inArray(catalogues.id, ids),
							eq(catalogues.createdBy, me.userId),
						),
					)
					.returning({ name: catalogues.name });
				return rows.map((r) => r.name);
			});
			return names;
		},
		async updateItemStatus(me, id, status, trafficLimit = 1e9) {
			return withUser(me, async (t) => {
				const [before] = await t
					.select({ status: catalogues.status })
					.from(catalogues)
					.where(
						and(eq(catalogues.id, id), eq(catalogues.createdBy, me.userId)),
					)
					.limit(1);
				if (!before) return null;
				if (status === "active" && before.status !== "active") {
					await getPlanForUpdate(t, me);
					await assertCanActivate(t, trafficLimit);
				}
				const [r] = await t
					.update(catalogues)
					.set({ status })
					.where(
						and(eq(catalogues.id, id), eq(catalogues.createdBy, me.userId)),
					)
					.returning({ name: catalogues.name });
				return r ?? null;
			});
		},
		async duplicateItem(me, id, base, maxCatalogues = 100, probe = null) {
			return withUser(me, async (t) => {
				await getPlanForUpdate(t, me);
				await assertCatalogueQuota(t, me, maxCatalogues);
				const [source] = await t
					.select()
					.from(catalogues)
					.where(
						and(eq(catalogues.id, id), eq(catalogues.createdBy, me.userId)),
					)
					.limit(1);
				if (!source) return null;
				const values = pickEditable(source);
				for (let i = 0; i < 20; i++) {
					const candidate = i === 0 ? base : `${base}-copy${i === 1 ? "" : i}`;
					try {
						return await nested(t, async (sp) => {
							const [r] = await sp
								.insert(catalogues)
								.values({
									...values,
									name: candidate,
									status: "draft",
									source: source.source,
									createdBy: me.userId,
								})
								.returning();
							if (probe)
								r.__probe = (
									await sp.execute(
										sql`select current_user::text cu, private.current_user_id() uid`,
									)
								)[0];
							return r;
						});
					} catch (e) {
						if (!isUniqueViolation(e)) throw e;
					}
				}
				return null;
			});
		},
		async createCatalogue(
			me,
			input,
			{ maxCatalogues = 100, bypassPick = false } = {},
		) {
			return withUser(me, async (t) => {
				await getPlanForUpdate(t, me);
				await assertCatalogueQuota(t, me, maxCatalogues);
				const values = bypassPick ? { ...input } : pickEditable(input);
				const [r] = await t
					.insert(catalogues)
					.values(
						bypassPick
							? values
							: {
									...values,
									name: input.name,
									status: "draft",
									source: "builder",
									createdBy: me.userId,
								},
					)
					.returning();
				return r;
			});
		},
		async publishCatalogue(
			me,
			data,
			{ bypassPick = false, trafficLimit = 1e9 } = {},
		) {
			return withUser(me, async (t) => {
				const before = await loadOwnedCatalogue(t, me, data?.name);
				if (!before) return null;
				await getPlanForUpdate(t, me);
				if (before.status !== "active")
					await assertCanActivate(t, trafficLimit);
				const editable = bypassPick ? { ...data } : pickEditable(data);
				const [r] = await t
					.update(catalogues)
					.set({ ...editable, status: "active" })
					.where(
						and(
							eq(catalogues.id, before.id),
							eq(catalogues.createdBy, me.userId),
						),
					)
					.returning();
				return r ?? null;
			});
		},
		async checkCatalogueName(me, slug) {
			const [r] = await withUser(me, (t) =>
				t.execute(
					sql`select private.catalogue_name_available(${slug}) as available`,
				),
			);
			return r?.available === true;
		},
		// lib/themes/upsert.ts + actions/themes.ts
		async saveTheme(me, name, colors) {
			return withUser(me, async (t) => {
				const [saved] = await t
					.insert(userThemes)
					.values({ userId: me.userId, name, colors })
					.onConflictDoUpdate({
						target: [userThemes.userId, userThemes.name],
						set: { colors },
					})
					.returning();
				return saved;
			});
		},
		listSavedThemes: (me) =>
			withUser(me, (t) =>
				t
					.select()
					.from(userThemes)
					.where(eq(userThemes.userId, me.userId))
					.orderBy(desc(userThemes.updatedAt)),
			),
		async deleteSavedTheme(me, id) {
			const rows = await withUser(me, (t) =>
				t
					.delete(userThemes)
					.where(and(eq(userThemes.id, id), eq(userThemes.userId, me.userId)))
					.returning({ id: userThemes.id }),
			);
			return rows.length === 1;
		},
		// actions/qr-configs.ts + lib/qr/configs.ts
		async upsertQrConfig(me, catalogue, config) {
			try {
				const rows = await withUser(me, (t) =>
					t
						.insert(qrConfigs)
						.values({ catalogue, config })
						.onConflictDoUpdate({
							target: qrConfigs.catalogue,
							set: { config },
						})
						.returning({ id: qrConfigs.id }),
				);
				return rows.length === 1
					? { success: true }
					: { success: false, error: "Not found" };
			} catch (err) {
				if (isPermissionDenied(err))
					return {
						success: false,
						error: "Not found",
						code: pgError(err)?.code,
					};
				return {
					success: false,
					error: "Unknown error",
					code: pgError(err)?.code,
					msg: String(err?.cause?.message ?? err?.message),
				};
			}
		},
		getOwnedQrConfig: (me, name) =>
			withUser(me, async (t) => {
				const row = await loadOwnedCatalogue(t, me, name);
				if (!row) return null;
				const [r] = await t
					.select({ config: qrConfigs.config })
					.from(qrConfigs)
					.where(eq(qrConfigs.catalogue, name))
					.limit(1);
				return { config: r?.config };
			}),
		// actions/newsletter.ts
		newsletterSignup: (catalogueId, email) =>
			withPublic((t) =>
				t.execute(
					sql`select private.subscribe_catalogue_newsletter(${catalogueId}::uuid, ${email})`,
				),
			),
		productNewsletterSignup: (email) =>
			withPublic((t) =>
				t.execute(sql`select private.subscribe_product_newsletter(${email})`),
			),
		// lib/users/my-user-data.ts + actions/users.ts
		getMyUserData: (me) =>
			withUser(me, async (t) => {
				const [user] = await t
					.select()
					.from(users)
					.where(eq(users.id, me.userId))
					.limit(1);
				if (!user) return null;
				const [u] = await t.execute(sql`select * from private.my_usage()`);
				return { user, usage: u };
			}),
		async saveCookiePreferences(me, prefs) {
			const rows = await withUser(me, (t) =>
				t
					.update(users)
					.set({ cookiePreferences: prefs })
					.where(eq(users.id, me.userId))
					.returning({ id: users.id }),
			);
			return rows.length === 1;
		},
		// lib/ai/metering.ts
		// plan B.10 lib/ai/metering.ts (M06 signature)
		startAiTurn: (
			me,
			catalogue,
			limit,
			kind = "agent",
			continuationOf = null,
			planHash = null,
		) =>
			withUser(me, async (t) => {
				await getPlanForUpdate(t, me);
				const [r] =
					await t.execute(sql`select outcome, ai_turn_id from private.begin_ai_turn(${catalogue}, ${limit}::int, ${kind},
        ${continuationOf}::uuid, ${planHash}::text)`);
				return { outcome: r.outcome, turnId: r.ai_turn_id };
			}),
		setPlanState: (me, turnId, open, pending, planHash) =>
			withUser(me, async (t) => {
				const [r] = await t.execute(
					sql`select private.set_plan_state(${turnId}::uuid, ${open}, ${pending}::int, ${planHash}::text) as ok`,
				);
				return r?.ok === true;
			}),
		refundAiTurn: (me, turnId) =>
			withUser(me, async (t) => {
				const [r] = await t.execute(
					sql`select private.refund_ai_turn(${turnId}::uuid) as refunded`,
				);
				return r?.refunded === true;
			}),
		// lib/catalogue/public.ts
		async getPublicCatalogue(name) {
			const rows = await withPublic((t) =>
				t
					.select(PUBLIC_CATALOGUE_COLUMNS)
					.from(c)
					.where(and(eq(c.name, name), eq(c.status, "active")))
					.limit(1),
			);
			return rows[0] ?? null;
		},
		async getPublicCatalogueMeta(name) {
			const rows = await withPublic((t) =>
				t
					.select({
						name: c.name,
						heading: c.heading,
						metadata: c.metadata,
						logo: c.logo,
					})
					.from(c)
					.where(and(eq(c.name, name), eq(c.status, "active")))
					.limit(1),
			);
			return rows[0] ?? null;
		},
		listPublicCatalogueNames: async () =>
			(
				await withPublic((t) =>
					t
						.select({ name: c.name })
						.from(c)
						.where(eq(c.status, "active"))
						.orderBy(asc(c.name)),
				)
			).map((r) => r.name),
		publicSelectAllMistake: () =>
			withPublic((t) => t.select().from(c).where(eq(c.status, "active"))),
		publicFindFirstMistake: () =>
			withPublic((t) =>
				t.query.catalogues.findFirst({ where: eq(c.status, "active") }),
			),
		publicFindFirstColumns: (name) =>
			withPublic((t) =>
				t.query.catalogues.findFirst({
					columns: { id: true, name: true, content: true, status: true },
					where: and(eq(c.name, name), eq(c.status, "active")),
				}),
			),
		// app/api/dashboard/*
		dashboardCatalogues: (me) =>
			withUser(me, (t) =>
				t
					.select()
					.from(catalogues)
					.where(eq(catalogues.createdBy, me.userId))
					.orderBy(desc(catalogues.updatedAt)),
			),
		dashboardNewsletter: (me) =>
			withUser(me, (t) =>
				t
					.select({
						id: newsletter.id,
						email: newsletter.email,
						catalogueId: newsletter.catalogueId,
						createdAt: newsletter.createdAt,
						catalogueName: catalogues.name,
					})
					.from(newsletter)
					.leftJoin(catalogues, eq(catalogues.id, newsletter.catalogueId))
					.where(eq(newsletter.ownerId, me.userId)),
			),
		dashboardAnalytics: (me) =>
			withUser(me, async (t) => {
				const [a] = await t
					.select({
						pv: sql`coalesce(sum(${analytics.pageviewCount}), 0)`.mapWith(
							Number,
						),
						uv: sql`coalesce(sum(${analytics.uniqueVisitors}), 0)`.mapWith(
							Number,
						),
					})
					.from(analytics)
					.where(eq(analytics.userId, me.userId));
				const [n] = await t
					.select({ n: count() })
					.from(newsletter)
					.where(eq(newsletter.ownerId, me.userId));
				return { ...a, subscribers: n.n };
			}),
		// app-changes.md s.2.6 Paddle, s.2.8 lib/users/provision.ts (asAdmin)
		claimEvent: (e) =>
			asAdmin(
				"paddle",
				async (t) =>
					(
						await t
							.insert(paddleEvents)
							.values(e)
							.onConflictDoNothing({ target: paddleEvents.eventId })
							.returning({ id: paddleEvents.eventId })
					).length === 1,
			),
		upsertClerkUser: (p, planId) =>
			asAdmin("clerk:upsert", (t) =>
				t
					.insert(users)
					.values({
						id: p.id,
						email: p.email,
						name: p.name,
						image: p.image,
						planId,
					})
					.onConflictDoUpdate({
						target: users.id,
						set: { email: p.email, name: p.name, image: p.image },
					}),
			),
		ensureUserRow: (p, planId) =>
			asAdmin("clerk:ensure", (t) =>
				t
					.insert(users)
					.values({
						id: p.id,
						email: p.email,
						name: p.name,
						image: p.image,
						planId,
					})
					.onConflictDoNothing({ target: users.id }),
			),
		deleteClerkUser: (id) =>
			asAdmin("clerk:delete", async (t) => {
				const rows = await t
					.select({ name: catalogues.name })
					.from(catalogues)
					.where(eq(catalogues.createdBy, id));
				await t.delete(users).where(eq(users.id, id));
				return rows.map((r) => r.name);
			}),
		paddleSetPlan: (customerId, planId) =>
			asAdmin("paddle:sub", (t) =>
				t
					.update(users)
					.set({ planId })
					.where(eq(users.customerId, customerId))
					.returning({ id: users.id }),
			),
	};
	return app;
}
