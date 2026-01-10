-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."catalogue_source" AS ENUM('builder', 'ocr_import', 'ai_prompt');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('categorized', 'uncategorized');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive', 'draft', 'in preparation', 'error');--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"datetime" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	"catalogue" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" text DEFAULT 'NULL',
	"email" text,
	"plan_id" text,
	"customer_id" text,
	"cookie_preferences" jsonb,
	"consents" jsonb DEFAULT '{"refund-policy":true,"privacy-policy":true,"terms-and-conditions":true}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "newsletter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"catalogue_id" uuid NOT NULL,
	"owner_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ocr" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"datetime" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text,
	"catalogue" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"subscription_id" text PRIMARY KEY NOT NULL,
	"subscription_status" text NOT NULL,
	"price_id" text,
	"product_id" text,
	"scheduled_change" text,
	"customer_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_newsletter" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_logs" (
	"job_name" text NOT NULL,
	"status" text NOT NULL,
	"execution_time_ms" integer,
	"log" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics" (
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"current_url" text NOT NULL,
	"pageview_count" integer NOT NULL,
	"unique_visitors" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"user_id" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	CONSTRAINT "analytics_unique_entry" UNIQUE("date","current_url")
);
--> statement-breakpoint
CREATE TABLE "qr_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"catalogue" text DEFAULT '' NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "catalogues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"heading" text,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"source" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"business_type" text,
	"tags" text[] DEFAULT '{""}',
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"legal" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"appearance" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"contact" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"header" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"footer" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"partners" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	CONSTRAINT "catalogues_v2_source_check" CHECK (source = ANY (ARRAY['builder'::text, 'ocr_import'::text, 'ai_prompt'::text])),
	CONSTRAINT "catalogues_v2_status_check" CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'draft'::text, 'in preparation'::text, 'error'::text]))
);
--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "newsletter" ADD CONSTRAINT "newsletter_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ocr" ADD CONSTRAINT "ocr_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogues" ADD CONSTRAINT "catalogues_v2_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE POLICY "Enable read access for authenticated users to users" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for authenticated users to subscriptions" ON "subscriptions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
*/