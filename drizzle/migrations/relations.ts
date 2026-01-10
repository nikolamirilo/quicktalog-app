import { relations } from "drizzle-orm/relations";
import {
	catalogues,
	prompts,
	users,
	newsletter,
	ocr,
	analytics,
	qrConfigs,
} from "./schema";

export const promptsRelations = relations(prompts, ({ one }) => ({
	catalogue: one(catalogues, {
		fields: [prompts.catalogue],
		references: [catalogues.name],
	}),
	user: one(users, {
		fields: [prompts.userId],
		references: [users.id],
	}),
}));

export const cataloguesRelations = relations(catalogues, ({ one, many }) => ({
	prompts: many(prompts),
	ocrs: many(ocr),
	qrConfigs: many(qrConfigs),
	user: one(users, {
		fields: [catalogues.createdBy],
		references: [users.id],
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	prompts: many(prompts),
	newsletters: many(newsletter),
	ocrs: many(ocr),
	analytics: many(analytics),
	catalogues: many(catalogues),
}));

export const newsletterRelations = relations(newsletter, ({ one }) => ({
	user: one(users, {
		fields: [newsletter.ownerId],
		references: [users.id],
	}),
}));

export const ocrRelations = relations(ocr, ({ one }) => ({
	catalogue: one(catalogues, {
		fields: [ocr.catalogue],
		references: [catalogues.name],
	}),
	user: one(users, {
		fields: [ocr.userId],
		references: [users.id],
	}),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
	user: one(users, {
		fields: [analytics.userId],
		references: [users.id],
	}),
}));

export const qrConfigsRelations = relations(qrConfigs, ({ one }) => ({
	catalogue: one(catalogues, {
		fields: [qrConfigs.catalogue],
		references: [catalogues.name],
	}),
}));
