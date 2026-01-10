import {
	pgTable,
	foreignKey,
	uuid,
	timestamp,
	text,
	pgPolicy,
	jsonb,
	integer,
	unique,
	serial,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const prompts = pgTable(
	"prompts",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		datetime: timestamp({ withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		userId: text("user_id"),
		catalogue: text().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.catalogue],
			foreignColumns: [catalogues.name],
			name: "prompts_catalogue_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "prompts_user_id_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const users = pgTable(
	"users",
	{
		id: text().primaryKey().notNull(),
		name: text(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).default(sql`CURRENT_TIMESTAMP`),
		image: text().default("NULL"),
		email: text(),
		planId: text("plan_id"),
		customerId: text("customer_id"),
		cookiePreferences: jsonb("cookie_preferences"),
		consents: jsonb()
			.default({
				"refund-policy": true,
				"privacy-policy": true,
				"terms-and-conditions": true,
			})
			.notNull(),
	},
	(table) => [
		pgPolicy("Enable read access for authenticated users to users", {
			as: "permissive",
			for: "select",
			to: ["authenticated"],
			using: sql`true`,
		}),
	],
);

export const newsletter = pgTable(
	"newsletter",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		email: text().notNull(),
		catalogueId: uuid("catalogue_id").notNull(),
		ownerId: text("owner_id").notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "newsletter_owner_id_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const ocr = pgTable(
	"ocr",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		datetime: timestamp({ withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		userId: text("user_id"),
		catalogue: text().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.catalogue],
			foreignColumns: [catalogues.name],
			name: "ocr_catalogue_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "ocr_user_id_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
	],
);

export const subscriptions = pgTable(
	"subscriptions",
	{
		subscriptionId: text("subscription_id").primaryKey().notNull(),
		subscriptionStatus: text("subscription_status").notNull(),
		priceId: text("price_id"),
		productId: text("product_id"),
		scheduledChange: text("scheduled_change"),
		customerId: text("customer_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		pgPolicy("Enable read access for authenticated users to subscriptions", {
			as: "permissive",
			for: "select",
			to: ["authenticated"],
			using: sql`true`,
		}),
	],
);

export const productNewsletter = pgTable("product_newsletter", {
	id: uuid().defaultRandom().notNull(),
	email: text().notNull(),
});

export const jobLogs = pgTable("job_logs", {
	jobName: text("job_name").notNull(),
	status: text().notNull(),
	executionTimeMs: integer("execution_time_ms"),
	log: text(),
	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
	id: uuid().defaultRandom().primaryKey().notNull(),
});

export const analytics = pgTable(
	"analytics",
	{
		date: timestamp({ withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		currentUrl: text("current_url").notNull(),
		pageviewCount: integer("pageview_count").notNull(),
		uniqueVisitors: integer("unique_visitors"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
		userId: text("user_id").notNull(),
		id: uuid().defaultRandom().primaryKey().notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "analytics_user_id_fkey",
		}),
		unique("analytics_unique_entry").on(table.date, table.currentUrl),
	],
);

export const qrConfigs = pgTable(
	"qr_configs",
	{
		id: serial().primaryKey().notNull(),
		catalogue: text().notNull(),
		config: jsonb().notNull(),
		createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
	},
	(table) => [
		foreignKey({
			columns: [table.catalogue],
			foreignColumns: [catalogues.name],
			name: "qr_configs_catalogue_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		unique("qr_configs_catalogue_key").on(table.catalogue),
	],
);

export const catalogues = pgTable(
	"catalogues",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		name: text().notNull(),
		logo: text(),
		heading: text(),
		description: text(),
		status: text().default("draft").notNull(),
		source: text().default("builder").notNull(),
		language: text().default("en").notNull(),
		currency: text().default("EUR").notNull(),
		businessType: text("business_type"),
		tags: text().array().default([""]),
		content: jsonb().default([]).notNull(),
		legal: jsonb().default({}).notNull(),
		appearance: jsonb().default({}).notNull(),
		contact: jsonb().default({}).notNull(),
		header: jsonb().default({}).notNull(),
		footer: jsonb().default({}).notNull(),
		partners: jsonb().default([]).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		createdBy: text("created_by").notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "catalogues_created_by_fkey",
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		unique("catalogues_name_key").on(table.name),
	],
);
