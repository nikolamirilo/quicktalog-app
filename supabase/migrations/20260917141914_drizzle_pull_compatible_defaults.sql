-- ============================================================================
-- Quicktalog - make the schema readable by drizzle-kit pull
--
-- drizzle-kit 0.31 (run by the @quicktalog/common pre-commit hook) generates
-- schema.ts that does not compile from two things in this database:
--
--   ocr.catalogue, qr_configs.catalogue  DEFAULT ''::text   -> default(')
--   contacts, active_subscriptions       security_invoker=on -> "securityInvoker":"on"
--
-- 1. The '' default never produced a valid row: catalogue is NOT NULL and
--    references catalogues.name, and no catalogue is named ''. The only writer,
--    actions/qr-configs.ts, always passes catalogue; nothing inserts into ocr.
--    Dropping it only turns a foreign key error into a NOT NULL error.
--
-- 2. Postgres stores reloptions as written, so security_invoker = true behaves
--    exactly like = on but is stored as "true", which drizzle-kit reads as a
--    boolean.
-- ============================================================================

ALTER TABLE "public"."ocr" ALTER COLUMN "catalogue" DROP DEFAULT;
ALTER TABLE "public"."qr_configs" ALTER COLUMN "catalogue" DROP DEFAULT;

ALTER VIEW "public"."contacts" SET (security_invoker = true);
ALTER VIEW "public"."active_subscriptions" SET (security_invoker = true);
