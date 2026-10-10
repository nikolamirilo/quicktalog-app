-- Saved custom catalogue themes, reusable by their owner across catalogues.
-- Mirrors the `userThemes` Drizzle schema in @quicktalog/common.
--
-- RLS is intentionally left disabled to match every other table in this schema:
-- access is enforced in the server actions, which check the Clerk session and
-- the row's `user_id` before reading or writing.

CREATE TABLE IF NOT EXISTS "public"."user_themes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "colors" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_themes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."user_themes"
    ADD CONSTRAINT "user_themes_pkey" PRIMARY KEY ("id");


-- Lets an owner keep several palettes while keeping theme names unambiguous
-- when one is applied to a catalogue. Also serves lookups by "user_id" alone.
ALTER TABLE ONLY "public"."user_themes"
    ADD CONSTRAINT "user_themes_user_id_name_key" UNIQUE ("user_id", "name");


ALTER TABLE ONLY "public"."user_themes"
    ADD CONSTRAINT "user_themes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;


GRANT ALL ON TABLE "public"."user_themes" TO "anon";
GRANT ALL ON TABLE "public"."user_themes" TO "authenticated";
GRANT ALL ON TABLE "public"."user_themes" TO "service_role";
