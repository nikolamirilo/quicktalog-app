SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."call_edge_function_with_vault_secret"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_token text;
  v_url text;
  v_request_id bigint;
begin
  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name = 'service_role_key'
  limit 1;

  if v_token is null then
    raise warning 'call_edge_function_with_vault_secret: service_role_key not found in Vault, skipping webhook call for %', TG_ARGV[0];
    return new;
  end if;

  v_url := 'https://uhfbapjuzvlyzyodxhqn.supabase.co/functions/v1/' || TG_ARGV[0];

  select net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-type', 'application/json',
      'Authorization', 'Bearer ' || v_token
    ),
    body := to_jsonb(new),
    timeout_milliseconds := 5000
  ) into v_request_id;

  return new;
end;
$$;


ALTER FUNCTION "public"."call_edge_function_with_vault_secret"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pageview_totals"("start_date" timestamp with time zone, "end_date" timestamp with time zone) RETURNS TABLE("user_id" "uuid", "total_pageviews" bigint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.user_id,
    SUM(a.pageview_count)::bigint as total_pageviews
  FROM analytics a
  WHERE a.date >= start_date
    AND a.date <= end_date
  GROUP BY a.user_id;
END;
$$;


ALTER FUNCTION "public"."get_pageview_totals"("start_date" timestamp with time zone, "end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_analytics_on_conflict"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.pageview_count = OLD.pageview_count + NEW.pageview_count;
  NEW.unique_visitors = OLD.unique_visitors + NEW.unique_visitors;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_analytics_on_conflict"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."catalogues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo" "text",
    "heading" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "source" "text" DEFAULT 'builder'::"text" NOT NULL,
    "language" "text" DEFAULT 'eng'::"text" NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text" NOT NULL,
    "business_type" "text",
    "content" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "legal" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "appearance" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "contact" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "header" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "footer" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "partners" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "tags" "text"[] NOT NULL
);


ALTER TABLE "public"."catalogues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "subscription_id" "text" NOT NULL,
    "subscription_status" "text" NOT NULL,
    "price_id" "text",
    "product_id" "text",
    "scheduled_change" "text",
    "customer_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "image" "text" DEFAULT 'NULL'::"text",
    "email" "text",
    "plan_id" "text" NOT NULL,
    "customer_id" "text",
    "cookie_preferences" "jsonb",
    "consents" "jsonb" DEFAULT '{"refund-policy": true, "privacy-policy": true, "terms-and-conditions": true}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_subscriptions" AS
 SELECT "u"."email",
    "u"."name",
    "u"."plan_id" AS "price_id",
    "s"."subscription_status",
    "s"."created_at",
    "s"."updated_at",
    ('https://www.quicktalog.app/catalogues/'::"text" || COALESCE("c"."name", ''::"text")) AS "catalogue_name"
   FROM (("public"."subscriptions" "s"
     LEFT JOIN "public"."users" "u" ON (("s"."customer_id" = "u"."customer_id")))
     LEFT JOIN "public"."catalogues" "c" ON (("c"."created_by" = "u"."id")))
  WHERE (("s"."subscription_status" = 'active'::"text") AND ("u"."name" !~~* '%Mirilo%'::"text") AND ("u"."name" !~~* '%Tes%'::"text") AND ("u"."name" !~~* '%Montre%'::"text") AND ("u"."name" !~~* '%Djuranov%'::"text") AND ("u"."email" !~~* '%test%'::"text") AND ("s"."scheduled_change" IS NULL));


ALTER VIEW "public"."active_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics" (
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_url" "text" NOT NULL,
    "pageview_count" integer NOT NULL,
    "unique_visitors" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "text" NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_newsletter" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."product_newsletter" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."contacts" AS
 SELECT DISTINCT ON (COALESCE("u"."id", "lower"("n"."email"))) COALESCE("u"."id", ("gen_random_uuid"())::"text") AS "id",
    COALESCE("u"."email", "n"."email") AS "email",
    COALESCE("u"."name", 'Unknown'::"text") AS "firstname",
    COALESCE("p"."name", ''::"text") AS "plan",
    "u"."customer_id" AS "paddle_customer_id",
    COALESCE("c"."catalogues", ''::"text") AS "catalogues",
        CASE
            WHEN ("u"."id" IS NOT NULL) THEN 'Yes'::"text"
            ELSE 'No'::"text"
        END AS "is_user",
        CASE
            WHEN ("n"."id" IS NOT NULL) THEN 'Yes'::"text"
            ELSE 'No'::"text"
        END AS "product_newsletter",
        CASE
            WHEN COALESCE((("u"."consents" ->> 'refund-policy'::"text"))::boolean, false) THEN 'Yes'::"text"
            ELSE 'No'::"text"
        END AS "refund_policy",
        CASE
            WHEN COALESCE((("u"."consents" ->> 'terms-and-conditions'::"text"))::boolean, false) THEN 'Yes'::"text"
            ELSE 'No'::"text"
        END AS "terms_and_conditions",
        CASE
            WHEN COALESCE((("u"."consents" ->> 'privacy-policy'::"text"))::boolean, false) THEN 'Yes'::"text"
            ELSE 'No'::"text"
        END AS "privacy_policy"
   FROM ((("public"."users" "u"
     FULL JOIN "public"."product_newsletter" "n" ON (("lower"("n"."email") = "lower"("u"."email"))))
     LEFT JOIN "public"."plans" "p" ON (("p"."id" = "u"."plan_id")))
     LEFT JOIN LATERAL ( SELECT "string_agg"(('https://www.quicktalog.app/catalogues/'::"text" || "cat"."name"), ', '::"text") AS "catalogues"
           FROM "public"."catalogues" "cat"
          WHERE ("cat"."created_by" = "u"."id")) "c" ON (true))
  ORDER BY COALESCE("u"."id", "lower"("n"."email")), ("n"."id" IS NOT NULL) DESC
 LIMIT 10000000;


ALTER VIEW "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_logs" (
    "id" bigint NOT NULL,
    "job_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "processed_count" integer,
    "inserted_count" integer,
    "execution_time_ms" integer,
    "error" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_logs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."job_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."job_logs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."job_logs_id_seq" OWNED BY "public"."job_logs"."id";



CREATE TABLE IF NOT EXISTS "public"."newsletter" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "catalogue_id" "uuid" NOT NULL,
    "owner_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."newsletter" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ocr" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "datetime" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text",
    "catalogue" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."ocr" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "datetime" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "text",
    "catalogue" "text" NOT NULL
);


ALTER TABLE "public"."prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."qr_configs" (
    "catalogue" "text" DEFAULT ''::"text" NOT NULL,
    "config" "jsonb" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "public"."qr_configs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."job_logs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."job_logs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."analytics"
    ADD CONSTRAINT "analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics"
    ADD CONSTRAINT "analytics_unique_entry" UNIQUE ("date", "current_url");



ALTER TABLE ONLY "public"."catalogues"
    ADD CONSTRAINT "catalogues_new_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."catalogues"
    ADD CONSTRAINT "catalogues_new_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_logs"
    ADD CONSTRAINT "job_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newsletter"
    ADD CONSTRAINT "newsletter_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ocr"
    ADD CONSTRAINT "ocr_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_newsletter"
    ADD CONSTRAINT "product_newsletter_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_service_catalogue_key" UNIQUE ("catalogue");



ALTER TABLE ONLY "public"."qr_configs"
    ADD CONSTRAINT "qr_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscription_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_customer_id_key" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "Brevo New Contact Webhook" AFTER INSERT OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."call_edge_function_with_vault_secret"('create-brevo-contact');



CREATE OR REPLACE TRIGGER "New Lead Webhook" AFTER INSERT OR UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."call_edge_function_with_vault_secret"('create-crm-contact');



CREATE OR REPLACE TRIGGER "Subscription Notification Webhook" AFTER INSERT OR UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."call_edge_function_with_vault_secret"('discord-subscription-alert');



CREATE OR REPLACE TRIGGER "analytics_upsert_trigger" BEFORE UPDATE ON "public"."analytics" FOR EACH ROW EXECUTE FUNCTION "public"."update_analytics_on_conflict"();



ALTER TABLE ONLY "public"."analytics"
    ADD CONSTRAINT "analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalogues"
    ADD CONSTRAINT "catalogues_new_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."newsletter"
    ADD CONSTRAINT "newsletter_catalogue_id_fkey" FOREIGN KEY ("catalogue_id") REFERENCES "public"."catalogues"("id");



ALTER TABLE ONLY "public"."newsletter"
    ADD CONSTRAINT "newsletter_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ocr"
    ADD CONSTRAINT "ocr_catalogue_fkey" FOREIGN KEY ("catalogue") REFERENCES "public"."catalogues"("name") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ocr"
    ADD CONSTRAINT "ocr_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_catalogue_fkey" FOREIGN KEY ("catalogue") REFERENCES "public"."catalogues"("name") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."qr_configs"
    ADD CONSTRAINT "qr_configs_catalogue_fkey" FOREIGN KEY ("catalogue") REFERENCES "public"."catalogues"("name") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("customer_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_price_id_fkey" FOREIGN KEY ("price_id") REFERENCES "public"."plans"("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id");





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."call_edge_function_with_vault_secret"() TO "anon";
GRANT ALL ON FUNCTION "public"."call_edge_function_with_vault_secret"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."call_edge_function_with_vault_secret"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pageview_totals"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_pageview_totals"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pageview_totals"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_analytics_on_conflict"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_analytics_on_conflict"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_analytics_on_conflict"() TO "service_role";
























GRANT ALL ON TABLE "public"."catalogues" TO "anon";
GRANT ALL ON TABLE "public"."catalogues" TO "authenticated";
GRANT ALL ON TABLE "public"."catalogues" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."active_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."active_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."active_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."analytics" TO "anon";
GRANT ALL ON TABLE "public"."analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."product_newsletter" TO "anon";
GRANT ALL ON TABLE "public"."product_newsletter" TO "authenticated";
GRANT ALL ON TABLE "public"."product_newsletter" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."job_logs" TO "anon";
GRANT ALL ON TABLE "public"."job_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."job_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."job_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."job_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."job_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."newsletter" TO "anon";
GRANT ALL ON TABLE "public"."newsletter" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter" TO "service_role";



GRANT ALL ON TABLE "public"."ocr" TO "anon";
GRANT ALL ON TABLE "public"."ocr" TO "authenticated";
GRANT ALL ON TABLE "public"."ocr" TO "service_role";



GRANT ALL ON TABLE "public"."prompts" TO "anon";
GRANT ALL ON TABLE "public"."prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."prompts" TO "service_role";



GRANT ALL ON TABLE "public"."qr_configs" TO "anon";
GRANT ALL ON TABLE "public"."qr_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."qr_configs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
