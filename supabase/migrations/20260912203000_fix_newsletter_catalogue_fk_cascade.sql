-- ============================================================================
-- Quicktalog - fix inconsistent delete behavior on newsletter.catalogue_id
--
-- Every other table hanging off catalogues (ocr, prompts, qr_configs) cascades
-- on delete/rename of the parent catalogue. newsletter_catalogue_id_fkey alone
-- was created with no ON DELETE/ON UPDATE action, i.e. NO ACTION:
--
--   ocr_catalogue_fkey        ON UPDATE CASCADE ON DELETE CASCADE
--   prompts_catalogue_fkey    ON UPDATE CASCADE ON DELETE CASCADE
--   qr_configs_catalogue_fkey ON UPDATE CASCADE ON DELETE CASCADE
--   newsletter_catalogue_id_fkey  (none)            <- inconsistent
--
-- server_actions/catalogue.ts:deleteItem() runs
-- `drizzleClient.delete(catalogues).where(...)` directly, with no newsletter
-- cleanup first. With 0 rows in `newsletter` today this has never fired, but
-- the moment a catalogue with a newsletter signup is deleted, the delete
-- throws a foreign key violation, is swallowed by deleteItem()'s try/catch,
-- and the function returns false - the user sees "delete failed" with no
-- indication why until the newsletter rows are cleared manually.
--
-- Bring it in line with its siblings: cascade on both delete and rename.
-- ============================================================================

ALTER TABLE "public"."newsletter"
    DROP CONSTRAINT "newsletter_catalogue_id_fkey";

ALTER TABLE ONLY "public"."newsletter"
    ADD CONSTRAINT "newsletter_catalogue_id_fkey"
    FOREIGN KEY ("catalogue_id") REFERENCES "public"."catalogues"("id")
    ON UPDATE CASCADE ON DELETE CASCADE;
