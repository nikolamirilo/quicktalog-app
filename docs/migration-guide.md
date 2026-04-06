# Quicktalog v2 Migration Guide: PROD → New PROD

> **Date**: 2026-04-03
> **Author**: Migration analysis by AI Tech Lead
> **Status**: Ready for review

---

## Table of Contents

1. [Overview](#1-overview)
2. [Project Inventory](#2-project-inventory)
3. [Full Schema Comparison](#3-full-schema-comparison)
4. [Discrepancy Decision Matrix](#4-discrepancy-decision-matrix)
5. [Pre-Migration Checklist](#5-pre-migration-checklist)
6. [Migration Scripts](#6-migration-scripts)
7. [Catalogues Transformation (Complex)](#7-catalogues-transformation-complex)
8. [Post-Migration Validation](#8-post-migration-validation)
9. [Git Branch Management](#9-git-branch-management)
10. [Vercel Deployment](#10-vercel-deployment)
11. [Edge Functions (Deferred)](#11-edge-functions-deferred)
12. [Rollback Procedures](#12-rollback-procedures)
13. [Final Checklist](#13-final-checklist)

---

## 1. Overview

### What We're Doing

Migrating all production data from the **current PROD** Supabase project into the **TEST** Supabase project (which will become the **new PROD**). The Catalogue Builder v2 introduces a completely redesigned `catalogues` table schema. All other tables should be migrated as-is, with documented discrepancies for you to decide on.

### Migration Flow

```
PROD (uhfbapjuzvlyzyodxhqn) ──rename──► PROD_v2 (backup)
TEST (tpcfltcupcofteovrvmu)  ──rename──► PROD (new production)

Data flow: PROD_v2 data ──transform──► New PROD tables
```

### Key Constraints

- **READ-ONLY on source** — never modify PROD_v2 data
- **TEST tables cleared first** — fresh insert, no upsert conflicts
- **FK dependency order** — tables must be migrated in specific sequence
- **Catalogues need transformation** — completely different schema

---

## 2. Project Inventory

### Supabase Projects

| Property | PROD (Current) | TEST (New PROD) |
|----------|---------------|-----------------|
| **Project ID** | `uhfbapjuzvlyzyodxhqn` | `tpcfltcupcofteovrvmu` |
| **Region** | eu-central-1 | eu-central-1 |
| **PG Version** | 17.4.1.074 | 17.4.1.064 |
| **Status** | ACTIVE_HEALTHY | ACTIVE_HEALTHY |

### Data Volumes (PROD)

| Table | Rows | Notes |
|-------|------|-------|
| analytics | 2,986 | Largest table |
| users | 1,842 | Core entity |
| catalogues | 433 | **Requires transformation** |
| subscriptions | 78 | Paddle subscriptions |
| job_logs | 28 | Schema differs |
| product_newsletter | 17 | No PK |
| prompts | 15 | FK differences |
| ocr | 9 | FK differences |
| newsletter | 2 | FK differences |
| qr_configs | 0 | Empty — skip data migration |

---

## 3. Full Schema Comparison

### 3.1 `users` table

| Column | PROD | TEST | Match? |
|--------|------|------|--------|
| id | text PK | text PK | YES |
| name | text, nullable | text, nullable | YES |
| email | text, nullable | text, nullable | YES |
| plan_id | text, nullable | text, nullable | YES |
| customer_id | text, nullable, **UNIQUE** | text, nullable (comment: "Paddle ID") | **NO** — PROD has unique index `users_customer_id_key`, TEST does not |
| cookie_preferences | jsonb, nullable | jsonb, nullable | YES |
| consents | jsonb, default | jsonb, default | YES |
| created_at | timestamptz, nullable | timestamptz, nullable | YES |
| image | text, nullable, default 'NULL' | text, nullable, default 'NULL' | YES |

**Discrepancy**: PROD has `users_customer_id_key` unique index. TEST does not. This matters because `subscriptions.customer_id` FK references `users.customer_id` in PROD.

### 3.2 `subscriptions` table

| Column | PROD | TEST | Match? |
|--------|------|------|--------|
| subscription_id | text PK | text PK | YES |
| subscription_status | text | text | YES |
| price_id | text, nullable | text, nullable | YES |
| product_id | text, nullable | text, nullable | YES |
| scheduled_change | text, nullable | text, nullable | YES |
| customer_id | text | text | YES |
| created_at | timestamptz | timestamptz | YES |
| updated_at | timestamptz | timestamptz | YES |

**FK Discrepancy**: PROD has `subscriptions_customer_id_fkey → users(customer_id)`. TEST has **NO FK** on subscriptions.

### 3.3 `catalogues` table — COMPLETELY DIFFERENT

#### PROD Schema (Old)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| name | text, UNIQUE | Catalogue slug |
| created_by | text, FK→users(id) | |
| title | text, nullable | Plain text title |
| subtitle | text, nullable | Plain text subtitle |
| services | jsonb, nullable | Array of categories with items |
| theme | text, nullable | Theme name string |
| configuration | jsonb, nullable, default '{}' | |
| logo | text, nullable | |
| currency | text, nullable | |
| contact | jsonb, nullable | |
| tags | jsonb, default '[]' | JSON array |
| source | enum `catalogue_source` | builder, ocr_import, ai_prompt |
| status | enum `status` | active, inactive, draft, in preparation, error |
| legal | jsonb, nullable, default '{}' | |
| partners | ARRAY _jsonb, nullable | PostgreSQL array of jsonb |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### TEST Schema (New v2)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| name | text, UNIQUE | Catalogue slug |
| created_by | text, FK→users(id) | |
| heading | text, nullable | Plain text (app wraps in HTML) |
| content | jsonb, default '[]' | Array of blocks: text, category |
| appearance | jsonb, default '{}' | Contains theme, style, overlay |
| header | jsonb, default '{}' | Header CTA, logo config |
| footer | jsonb, default '{}' | Footer CTA, newsletter toggle |
| metadata | jsonb, default '{}' | icon, title, description (SEO) |
| business_type | text, nullable | e.g. restaurant, cafe |
| language | text, default 'en' | |
| logo | text, nullable | |
| currency | text, default 'EUR' | |
| contact | jsonb, default '{}' | |
| tags | text[], default '{}' | PostgreSQL text array (NOT jsonb) |
| source | text, default 'builder' | Plain text (NOT enum) |
| status | text, default 'draft' | Plain text (NOT enum) |
| legal | jsonb, default '{}' | |
| partners | jsonb, default '[]' | jsonb array (NOT _jsonb ARRAY) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### Column Mapping Summary

| PROD Column | → | TEST Column | Transformation |
|-------------|---|-------------|----------------|
| title | → | heading | Direct copy (plain text) |
| subtitle | → | content[0] (text block) | Wrap as `{type: "text", content: "<p>subtitle</p>"}` |
| services | → | content[1..N] (categories) | Transform each category + items |
| theme | → | appearance.theme.name | Wrap in appearance jsonb |
| configuration | → | *(dropped)* | Not used in v2 |
| source (enum) | → | source (text) | Cast to text |
| status (enum) | → | status (text) | Cast to text |
| tags (jsonb) | → | tags (text[]) | Convert jsonb array to text[] |
| partners (_jsonb) | → | partners (jsonb) | Convert PG array to jsonb array |
| *(new)* | | header | Default: `{}` |
| *(new)* | | footer | Default: `{}` |
| *(new)* | | metadata | Default: `{}` |
| *(new)* | | business_type | Default: NULL |
| *(new)* | | language | Default: 'en' |
| *(new)* | | appearance | Derived from theme |

### 3.4 `qr_configs` table

| Column | PROD | TEST | Match? |
|--------|------|------|--------|
| id | integer PK (serial) | integer PK (serial) | YES |
| config | jsonb | jsonb | YES |
| catalogue | text, FK→catalogues(name) | text, FK→catalogues(name), **UNIQUE** | **NO** — TEST has unique constraint |
| created_at | timestamp (no tz) | timestamp (no tz) | YES |
| updated_at | timestamp (no tz) | timestamp (no tz) | YES |

**Discrepancy**: TEST adds a UNIQUE constraint on `catalogue`. PROD doesn't have it.

### 3.5 `ocr` table

| Column | PROD | TEST | Match? |
|--------|------|------|--------|
| id | uuid PK | uuid PK | YES |
| user_id | text, nullable, FK→users(id) | text, nullable, FK→users(id) | YES |
| datetime | timestamptz | timestamptz | YES |
| catalogue | text | text | YES |

**FK Discrepancy**: PROD has NO FK on `catalogue`. TEST has `ocr_catalogue_fkey → catalogues(name)`. This means PROD `ocr` rows referencing catalogue names that don't exist in the migrated catalogues will fail.

### 3.6 `prompts` table

| Column | PROD | TEST | Match? |
|--------|------|------|--------|
| id | uuid PK | uuid PK | YES |
| user_id | text, nullable, FK→users(id) | text, nullable, FK→users(id) | YES |
| datetime | timestamptz | timestamptz | YES |
| catalogue | text, **UNIQUE** | text | **NO** — PROD has unique, TEST doesn't |

**FK Discrepancy**: PROD has NO FK on `catalogue`. TEST has `prompts_catalogue_fkey → catalogues(name)`. Same issue as ocr — references must exist.

### 3.7 `analytics` table

| Column | PROD | TEST | Match? |
|--------|------|------|--------|
| id | uuid, **no PK** | uuid, **has PK** | **NO** |
| date | timestamptz, NOT NULL | timestamptz, NOT NULL | YES |
| current_url | text, NOT NULL | text, NOT NULL | YES |
| pageview_count | integer, NOT NULL | integer, NOT NULL | YES |
| unique_visitors | integer, nullable | integer, nullable | YES |
| created_at | timestamptz, nullable | timestamptz, nullable | YES |
| user_id | text, **NULLABLE** | text, **NOT NULL**, FK→users(id) | **NO** — nullability + FK |

**Critical Discrepancies**:
1. PROD `user_id` is nullable; TEST requires NOT NULL + FK to users
2. PROD has no PK on `id`; TEST has PK `analytics_pkey`
3. Any PROD rows with NULL `user_id` will fail the NOT NULL + FK constraint

### 3.8 `newsletter` table

| Column | PROD | TEST | Match? |
|--------|------|------|--------|
| id | uuid PK | uuid PK | YES |
| email | text | text | YES |
| catalogue_id | uuid, FK→catalogues(id) | uuid | **NO** — PROD has FK, TEST doesn't |
| owner_id | text, FK→users(id) | text, FK→users(id) | YES |

### 3.9 `product_newsletter` table

| Column | PROD | TEST | Match? |
|--------|------|------|--------|
| id | uuid, **no PK** | uuid, **no PK** | YES |
| email | text | text | YES |

Identical schema. Neither has a PK (both risky but matching).

### 3.10 `job_logs` table

| Column | PROD | TEST | Match? |
|--------|------|------|--------|
| id | **bigint** (serial) | **uuid** (gen_random_uuid()) | **NO** |
| job_name | text | text | YES |
| status | text | text | YES |
| processed_count | integer, nullable | *(missing)* | **NO** |
| inserted_count | integer, nullable | *(missing)* | **NO** |
| execution_time_ms | integer, nullable | integer, nullable | YES |
| error | text, nullable | *(missing)* | **NO** |
| log | *(missing)* | text, nullable | **NO** |
| created_at | timestamptz, nullable | timestamptz, nullable | YES |

**Major Discrepancy**: Completely different column set. PROD has `processed_count`, `inserted_count`, `error`. TEST has `log` instead. ID types differ (bigint vs uuid).

### 3.11 Enums

| Enum | PROD | TEST |
|------|------|------|
| catalogue_source | EXISTS (builder, ocr_import, ai_prompt) | DOES NOT EXIST (plain text) |
| status | EXISTS (active, inactive, draft, in preparation, error) | DOES NOT EXIST (plain text) |

### 3.12 Functions

| Function | PROD | TEST |
|----------|------|------|
| update_analytics_on_conflict | YES | YES |
| get_pageview_totals | YES | YES |
| upsert_analytics_additive | NO | YES |
| json_matches_schema | NO | YES (pg_jsonschema extension) |

### 3.13 Triggers

| Trigger | PROD | TEST |
|---------|------|------|
| analytics_upsert_trigger | YES | YES |
| Subscription Notification Webhook | YES (INSERT/UPDATE) | NO |
| Catalogue Notification Webhook | YES (INSERT) | NO |
| New Lead Webhook | YES (INSERT/UPDATE) | NO |

### 3.14 RLS

| Table | PROD | TEST | Target (New PROD) |
|-------|------|------|-------------------|
| users | OFF | ON (SELECT for authenticated) | **OFF** |
| subscriptions | OFF | ON (SELECT for authenticated) | **OFF** |
| prompts | OFF | ON (no policies) | **OFF** |
| ocr | OFF | ON (no policies) | **OFF** |
| newsletter | OFF | ON (no policies) | **OFF** |
| product_newsletter | OFF | ON (no policies) | **OFF** |
| qr_configs | OFF | ON (no policies) | **OFF** |
| catalogues | OFF | OFF | OFF |
| analytics | OFF | OFF | OFF |
| job_logs | OFF | OFF | OFF |

---

## 4. Discrepancy Decision Matrix

> **ACTION REQUIRED**: Review each discrepancy and decide before running migration.

| # | Table | Discrepancy | Option A | Option B | Your Decision |
|---|-------|-------------|----------|----------|---------------|
| 1 | users | PROD has UNIQUE on customer_id, TEST doesn't | Add unique index to TEST | Leave without unique (looser) | ______ |
| 2 | subscriptions | PROD has FK→users(customer_id), TEST doesn't | Add FK to TEST | Leave without FK (looser) | ______ |
| 3 | analytics | PROD user_id nullable, TEST NOT NULL + FK | Drop NOT NULL + FK on TEST before insert | Filter out rows with NULL user_id | ______ |
| 4 | analytics | PROD has no PK on id, TEST has PK | Keep TEST PK (better) | Drop PK to match PROD | ______ |
| 5 | job_logs | Different schema (bigint vs uuid, different columns) | Transform: map processed_count+inserted_count+error→log text | Skip job_logs migration (low value, 28 rows) | ______ |
| 6 | prompts | PROD has UNIQUE on catalogue, TEST has FK→catalogues(name) | Drop FK, add UNIQUE on TEST | Keep TEST FK, ensure catalogue names exist | ______ |
| 7 | ocr | TEST has FK→catalogues(name), PROD doesn't | Drop FK on TEST before insert | Ensure catalogue names exist, skip orphans | ______ |
| 8 | newsletter | PROD has FK→catalogues(id), TEST doesn't | Add FK to TEST | Leave without FK | ______ |
| 9 | qr_configs | TEST has UNIQUE on catalogue, PROD doesn't | Keep UNIQUE (0 rows anyway) | Drop UNIQUE | ______ |

---

## 5. Pre-Migration Checklist

### 5.1 Disable Automatic Deployment on Vercel

```
1. Go to Vercel Dashboard → quicktalog-app project
2. Settings → Git → Deployment Protection
3. Disable "Automatically deploy on push" for main branch
4. Or: Settings → General → Build & Development → Ignored Build Step → set to exit 0
```

### 5.2 Final Deployment to TEST (branch: test)

```bash
git checkout test
git push origin test
# Wait for Vercel deployment to complete
# Do E2E testing on TEST environment
```

### 5.3 Backup Verification

Run this on PROD to get baseline counts:

```sql
-- Run on PROD (uhfbapjuzvlyzyodxhqn)
SELECT 'users' as tbl, COUNT(*) as cnt FROM users
UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL SELECT 'catalogues', COUNT(*) FROM catalogues
UNION ALL SELECT 'qr_configs', COUNT(*) FROM qr_configs
UNION ALL SELECT 'ocr', COUNT(*) FROM ocr
UNION ALL SELECT 'prompts', COUNT(*) FROM prompts
UNION ALL SELECT 'analytics', COUNT(*) FROM analytics
UNION ALL SELECT 'newsletter', COUNT(*) FROM newsletter
UNION ALL SELECT 'product_newsletter', COUNT(*) FROM product_newsletter
UNION ALL SELECT 'job_logs', COUNT(*) FROM job_logs
ORDER BY tbl;
```

Save the output. You'll compare post-migration.

---

## 6. Migration Scripts

### Important: Run order matters (FK dependencies)

```
1. users                  (no dependencies)
2. subscriptions          (depends on users.customer_id in PROD)
3. catalogues             (depends on users.id) ← COMPLEX TRANSFORMATION
4. qr_configs             (depends on catalogues.name)
5. ocr                    (depends on users.id, optionally catalogues.name)
6. prompts                (depends on users.id, optionally catalogues.name)
7. analytics              (depends on users.id in TEST)
8. newsletter             (depends on users.id, catalogues.id in PROD)
9. product_newsletter     (no dependencies)
10. job_logs              (no dependencies)
```

### 6.0 Clear TEST Tables (Run on TEST)

> **WARNING**: This deletes ALL data in TEST. Run in reverse FK order.

```sql
-- Run on TEST (tpcfltcupcofteovrvmu)
-- Clear in reverse dependency order
TRUNCATE TABLE job_logs CASCADE;
TRUNCATE TABLE product_newsletter CASCADE;
TRUNCATE TABLE newsletter CASCADE;
TRUNCATE TABLE analytics CASCADE;
TRUNCATE TABLE prompts CASCADE;
TRUNCATE TABLE ocr CASCADE;
TRUNCATE TABLE qr_configs CASCADE;
TRUNCATE TABLE catalogues CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE users CASCADE;
```

### 6.1 Disable RLS on TEST (Run on TEST)

```sql
-- Run on TEST (tpcfltcupcofteovrvmu)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE ocr DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_newsletter DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_configs DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users to users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users to subscriptions" ON subscriptions;
```

### 6.2 Pre-Migration Schema Adjustments on TEST

> Based on your decisions in the Decision Matrix, run the applicable commands.

```sql
-- Run on TEST (tpcfltcupcofteovrvmu)

-- IF Decision #3 = "Drop NOT NULL + FK on TEST":
ALTER TABLE analytics ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE analytics DROP CONSTRAINT IF EXISTS analytics_user_id_fkey;

-- IF Decision #6 = "Drop FK on prompts":
ALTER TABLE prompts DROP CONSTRAINT IF EXISTS prompts_catalogue_fkey;

-- IF Decision #7 = "Drop FK on ocr":
ALTER TABLE ocr DROP CONSTRAINT IF EXISTS ocr_catalogue_fkey;
```

### 6.3 Migrate `users` (Step 1)

This uses Supabase's `dblink` extension to query across projects. **Alternative approach below if dblink isn't available.**

#### Option A: Using pg_dump/psql (Recommended)

Since both projects are on Supabase and direct cross-database queries aren't simple, the recommended approach is:

**Export from PROD:**
```bash
# Export users from PROD
psql "postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -c "\COPY (SELECT id, name, email, plan_id, customer_id, cookie_preferences, consents, created_at, image FROM users) TO 'users_export.csv' WITH CSV HEADER"
```

**Import to TEST:**
```bash
# Import users to TEST
psql "postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -c "\COPY users(id, name, email, plan_id, customer_id, cookie_preferences, consents, created_at, image) FROM 'users_export.csv' WITH CSV HEADER"
```

#### Option B: Using Supabase SQL Editor (Manual JSON approach)

If you don't have psql access, you can use the Supabase SQL Editor to export as JSON and re-insert. For each table:

**Step 1 — Export from PROD (SQL Editor on PROD project):**
```sql
-- Run on PROD — copy the JSON output
SELECT json_agg(row_to_json(u)) FROM (
  SELECT id, name, email, plan_id, customer_id,
         cookie_preferences, consents, created_at, image
  FROM users
) u;
```

**Step 2 — Import to TEST (SQL Editor on TEST project):**
```sql
-- Run on TEST — paste the JSON output as the value
INSERT INTO users (id, name, email, plan_id, customer_id, cookie_preferences, consents, created_at, image)
SELECT
  (elem->>'id')::text,
  (elem->>'name')::text,
  (elem->>'email')::text,
  (elem->>'plan_id')::text,
  (elem->>'customer_id')::text,
  (elem->'cookie_preferences')::jsonb,
  (elem->'consents')::jsonb,
  (elem->>'created_at')::timestamptz,
  (elem->>'image')::text
FROM json_array_elements('<PASTE_JSON_HERE>'::json) AS elem;
```

> **Note**: For 1,842 rows this may need to be done in batches of ~500 if the SQL editor has size limits.

#### Option C: Using Supabase Migration Script (Node.js)

```javascript
// migrate-table.js — Generic migration script
// npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

const PROD = createClient(
  'https://uhfbapjuzvlyzyodxhqn.supabase.co',
  'PROD_SERVICE_ROLE_KEY'
);

const TEST = createClient(
  'https://tpcfltcupcofteovrvmu.supabase.co',
  'TEST_SERVICE_ROLE_KEY'
);

async function migrateTable(tableName, selectColumns = '*', batchSize = 500) {
  let offset = 0;
  let totalMigrated = 0;

  while (true) {
    const { data, error } = await PROD
      .from(tableName)
      .select(selectColumns)
      .range(offset, offset + batchSize - 1)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) break;

    const { error: insertError } = await TEST
      .from(tableName)
      .insert(data);

    if (insertError) throw insertError;

    totalMigrated += data.length;
    offset += batchSize;
    console.log(`${tableName}: migrated ${totalMigrated} rows`);
  }

  console.log(`${tableName}: DONE — ${totalMigrated} total rows`);
}

// Run migrations in order
async function main() {
  await migrateTable('users');
  await migrateTable('subscriptions');
  // catalogues handled separately (see Section 7)
  await migrateTable('qr_configs');
  await migrateTable('ocr');
  await migrateTable('prompts');
  await migrateTable('analytics');
  await migrateTable('newsletter');
  await migrateTable('product_newsletter');
  // job_logs handled separately (schema differs)
}

main().catch(console.error);
```

### 6.4 Migrate `subscriptions` (Step 2)

Direct copy — schema matches:

```bash
# Export
psql $PROD_URL -c "\COPY (SELECT subscription_id, subscription_status, price_id, product_id, scheduled_change, customer_id, created_at, updated_at FROM subscriptions) TO 'subscriptions_export.csv' WITH CSV HEADER"

# Import
psql $TEST_URL -c "\COPY subscriptions FROM 'subscriptions_export.csv' WITH CSV HEADER"
```

### 6.5 Migrate `catalogues` (Step 3) — See Section 7

### 6.6 Migrate `qr_configs` (Step 4)

Skip — 0 rows in PROD. No data to migrate.

### 6.7 Migrate `ocr` (Step 5)

```sql
-- If FK to catalogues exists on TEST and you want to keep it,
-- verify all catalogue references exist first:
-- Run on PROD:
SELECT o.catalogue FROM ocr o
WHERE NOT EXISTS (SELECT 1 FROM catalogues c WHERE c.name = o.catalogue);
-- If any rows returned, those will fail FK constraint.
```

Direct copy (schema matches):
```bash
psql $PROD_URL -c "\COPY (SELECT id, user_id, datetime, catalogue FROM ocr) TO 'ocr_export.csv' WITH CSV HEADER"
psql $TEST_URL -c "\COPY ocr FROM 'ocr_export.csv' WITH CSV HEADER"
```

### 6.8 Migrate `prompts` (Step 6)

Same FK check applies:
```sql
-- Run on PROD:
SELECT p.catalogue FROM prompts p
WHERE NOT EXISTS (SELECT 1 FROM catalogues c WHERE c.name = p.catalogue);
```

Direct copy:
```bash
psql $PROD_URL -c "\COPY (SELECT id, user_id, datetime, catalogue FROM prompts) TO 'prompts_export.csv' WITH CSV HEADER"
psql $TEST_URL -c "\COPY prompts FROM 'prompts_export.csv' WITH CSV HEADER"
```

### 6.9 Migrate `analytics` (Step 7)

**Warning**: PROD has `user_id` as NULLABLE and no FK. TEST has NOT NULL + FK.

```sql
-- Check how many PROD rows have NULL user_id:
-- Run on PROD:
SELECT COUNT(*) FROM analytics WHERE user_id IS NULL;
```

If you chose to **drop the NOT NULL constraint** (Decision #3 Option A):
```bash
psql $PROD_URL -c "\COPY (SELECT id, date, current_url, pageview_count, unique_visitors, created_at, user_id FROM analytics) TO 'analytics_export.csv' WITH CSV HEADER"
psql $TEST_URL -c "\COPY analytics FROM 'analytics_export.csv' WITH CSV HEADER"
```

If you chose to **filter out NULL user_id rows** (Decision #3 Option B):
```bash
psql $PROD_URL -c "\COPY (SELECT id, date, current_url, pageview_count, unique_visitors, created_at, user_id FROM analytics WHERE user_id IS NOT NULL) TO 'analytics_export.csv' WITH CSV HEADER"
psql $TEST_URL -c "\COPY analytics FROM 'analytics_export.csv' WITH CSV HEADER"
```

### 6.10 Migrate `newsletter` (Step 8)

Direct copy (2 rows):
```bash
psql $PROD_URL -c "\COPY (SELECT id, email, catalogue_id, owner_id FROM newsletter) TO 'newsletter_export.csv' WITH CSV HEADER"
psql $TEST_URL -c "\COPY newsletter FROM 'newsletter_export.csv' WITH CSV HEADER"
```

### 6.11 Migrate `product_newsletter` (Step 9)

Direct copy:
```bash
psql $PROD_URL -c "\COPY (SELECT id, email FROM product_newsletter) TO 'product_newsletter_export.csv' WITH CSV HEADER"
psql $TEST_URL -c "\COPY product_newsletter FROM 'product_newsletter_export.csv' WITH CSV HEADER"
```

### 6.12 Migrate `job_logs` (Step 10)

**Schema differs significantly.** Choose one:

#### Option A: Transform and migrate
```sql
-- Export from PROD with transformation
-- Maps: processed_count, inserted_count, error → log text
SELECT
  gen_random_uuid() as id,
  job_name,
  status,
  execution_time_ms,
  CASE
    WHEN error IS NOT NULL THEN
      'processed: ' || COALESCE(processed_count::text, '0') ||
      ', inserted: ' || COALESCE(inserted_count::text, '0') ||
      ', error: ' || error
    ELSE
      'processed: ' || COALESCE(processed_count::text, '0') ||
      ', inserted: ' || COALESCE(inserted_count::text, '0')
  END as log,
  created_at
FROM job_logs;
```

#### Option B: Skip migration (only 28 rows of log data)

---

## 7. Catalogues Transformation (Complex)

This is the core of the migration. Each PROD catalogue must be transformed into the v2 schema.

### 7.1 Transformation Logic

```
PROD                          →  TEST (v2)
─────────────────────────────────────────────
title                         →  heading (plain text)
subtitle                      →  content[0] = {type: "text", content: "<p>subtitle</p>"}
services[].name               →  content[N] = {type: "category", name: ..., items: [...]}
services[].items[].name       →  content[N].items[].name
services[].items[].price      →  content[N].items[].price (string → number)
services[].items[].image      →  content[N].items[].image
services[].items[].description→  content[N].items[].description
services[].order              →  content[N].order
services[].layout             →  content[N].layout
theme                         →  appearance.theme.name
source::text                  →  source (text)
status::text                  →  status (text)
tags (jsonb [])               →  tags (text[])
partners (_jsonb array)       →  partners (jsonb [])
(new)                         →  header = {}
(new)                         →  footer = {}
(new)                         →  metadata = {}
(new)                         →  business_type = NULL
(new)                         →  language = 'en'
```

### 7.2 SQL Transformation Script

> **Run this on PROD to generate the INSERT statements, then execute them on TEST.**

```sql
-- ============================================================
-- CATALOGUES MIGRATION SCRIPT
-- Source: PROD (uhfbapjuzvlyzyodxhqn)
-- Target: TEST (tpcfltcupcofteovrvmu)
-- ============================================================
-- Run this SELECT on PROD to generate data for TEST insertion.
-- Export the result and run the INSERT on TEST.

SELECT
  id,
  name,
  created_by,

  -- heading: plain text from title
  title AS heading,

  -- content: build jsonb array from subtitle + services
  (
    SELECT COALESCE(jsonb_agg(block ORDER BY block_order), '[]'::jsonb)
    FROM (
      -- Text block from subtitle (if non-empty)
      SELECT
        0 AS block_order,
        jsonb_build_object(
          'id', gen_random_uuid(),
          'type', 'text',
          'order', 0,
          'content', '<p>' || COALESCE(NULLIF(TRIM(subtitle), ''), '') || '</p>'
        ) AS block
      WHERE subtitle IS NOT NULL AND TRIM(subtitle) != ''

      UNION ALL

      -- Category blocks from services array
      SELECT
        (svc->>'order')::int + 1 AS block_order,
        jsonb_build_object(
          'id', gen_random_uuid(),
          'type', 'category',
          'name', svc->>'name',
          'order', (svc->>'order')::int + 1,
          'layout', COALESCE(svc->>'layout', 'variant_1'),
          'items', (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                'id', gen_random_uuid(),
                'name', item->>'name',
                'image', COALESCE(item->>'image', ''),
                'order', ROW_NUMBER() OVER () - 1,
                'price', CASE
                  WHEN item->>'price' ~ '^[0-9]+\.?[0-9]*$'
                  THEN (item->>'price')::numeric
                  ELSE 0
                END,
                'isFree', false,
                'discount', jsonb_build_object(
                  'isOnDiscount', false,
                  'discountedPrice', 0,
                  'discountPercentage', 0
                ),
                'description', COALESCE(item->>'description', '')
              )
              ORDER BY (ROW_NUMBER() OVER ())
            ), '[]'::jsonb)
            FROM jsonb_array_elements(COALESCE(svc->'items', '[]'::jsonb)) AS item
          )
        ) AS block
      FROM jsonb_array_elements(COALESCE(services, '[]'::jsonb)) AS svc
    ) sub
  ) AS content,

  -- appearance: derived from theme
  jsonb_build_object(
    'style', jsonb_build_object(
      'shadow', 'low',
      'fontFamily', 'inter',
      'borderRadius', 12,
      'contentFontSize', 'medium'
    ),
    'theme', jsonb_build_object(
      'name', COALESCE(theme, 'theme-monochrome'),
      'type', 'standard'
    ),
    'overlay', jsonb_build_object(
      'icon', '',
      'isEnabled', false
    )
  ) AS appearance,

  -- header: default
  '{
    "cta": {"url": "", "label": "", "isEnabled": true},
    "type": "default",
    "emailCta": true,
    "logoSize": {"width": 100, "height": 100},
    "phoneCta": true
  }'::jsonb AS header,

  -- footer: default
  '{
    "cta": {"url": "", "label": "", "isEnabled": true},
    "type": "default",
    "logoSize": {"width": 100, "height": 100},
    "newsletter": false,
    "showPartners": false
  }'::jsonb AS footer,

  -- metadata: default
  '{"icon": "", "title": "", "description": ""}'::jsonb AS metadata,

  -- business_type: NULL (unknown from PROD)
  NULL::text AS business_type,

  -- language: default
  'en'::text AS language,

  -- Direct copies
  logo,
  COALESCE(currency, 'EUR') AS currency,
  COALESCE(contact, '{}'::jsonb) AS contact,

  -- tags: jsonb array → text array
  CASE
    WHEN tags IS NULL OR tags::text = '[]' THEN '{}'::text[]
    ELSE (SELECT array_agg(elem::text) FROM jsonb_array_elements_text(tags) AS elem)
  END AS tags,

  -- source: enum → text
  source::text AS source,

  -- status: enum → text
  status::text AS status,

  COALESCE(legal, '{}'::jsonb) AS legal,

  -- partners: _jsonb array → jsonb array
  CASE
    WHEN partners IS NULL THEN '[]'::jsonb
    ELSE (SELECT COALESCE(jsonb_agg(p), '[]'::jsonb) FROM unnest(partners) AS p)
  END AS partners,

  created_at,
  updated_at

FROM catalogues;
```

### 7.3 Node.js Migration Script (Alternative)

If SQL is too complex to run in one shot, use this Node.js script:

```javascript
// migrate-catalogues.js
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const PROD = createClient(
  'https://uhfbapjuzvlyzyodxhqn.supabase.co',
  'PROD_SERVICE_ROLE_KEY'
);
const TEST = createClient(
  'https://tpcfltcupcofteovrvmu.supabase.co',
  'TEST_SERVICE_ROLE_KEY'
);

function transformCatalogue(prod) {
  const content = [];

  // Text block from subtitle
  if (prod.subtitle && prod.subtitle.trim()) {
    content.push({
      id: uuidv4(),
      type: 'text',
      order: 0,
      content: `<p>${prod.subtitle.trim()}</p>`
    });
  }

  // Category blocks from services
  if (prod.services && Array.isArray(prod.services)) {
    prod.services.forEach((svc, idx) => {
      const items = (svc.items || []).map((item, itemIdx) => ({
        id: uuidv4(),
        name: item.name || '',
        image: item.image || '',
        order: itemIdx,
        price: parseFloat(item.price) || 0,
        isFree: false,
        discount: {
          isOnDiscount: false,
          discountedPrice: 0,
          discountPercentage: 0
        },
        description: item.description || ''
      }));

      content.push({
        id: uuidv4(),
        type: 'category',
        name: svc.name || '',
        order: (svc.order != null ? svc.order : idx) + (prod.subtitle ? 1 : 0),
        layout: svc.layout || 'variant_1',
        items
      });
    });
  }

  // Convert tags from jsonb array to text array
  let tags = [];
  if (prod.tags) {
    if (Array.isArray(prod.tags)) {
      tags = prod.tags.map(String);
    }
  }

  // Convert partners from _jsonb array to jsonb array
  let partners = [];
  if (prod.partners && Array.isArray(prod.partners)) {
    partners = prod.partners;
  }

  return {
    id: prod.id,
    name: prod.name,
    created_by: prod.created_by,
    heading: prod.title || null,
    content,
    appearance: {
      style: {
        shadow: 'low',
        fontFamily: 'inter',
        borderRadius: 12,
        contentFontSize: 'medium'
      },
      theme: {
        name: prod.theme || 'theme-monochrome',
        type: 'standard'
      },
      overlay: { icon: '', isEnabled: false }
    },
    header: {
      cta: { url: '', label: '', isEnabled: true },
      type: 'default',
      emailCta: true,
      logoSize: { width: 100, height: 100 },
      phoneCta: true
    },
    footer: {
      cta: { url: '', label: '', isEnabled: true },
      type: 'default',
      logoSize: { width: 100, height: 100 },
      newsletter: false,
      showPartners: false
    },
    metadata: { icon: '', title: '', description: '' },
    business_type: null,
    language: 'en',
    logo: prod.logo,
    currency: prod.currency || 'EUR',
    contact: prod.contact || {},
    tags,
    source: String(prod.source || 'builder'),
    status: String(prod.status || 'draft'),
    legal: prod.legal || {},
    partners,
    created_at: prod.created_at,
    updated_at: prod.updated_at
  };
}

async function migrateCatalogues() {
  const batchSize = 100;
  let offset = 0;
  let total = 0;

  while (true) {
    const { data, error } = await PROD
      .from('catalogues')
      .select('*')
      .range(offset, offset + batchSize - 1)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) break;

    const transformed = data.map(transformCatalogue);

    const { error: insertError } = await TEST
      .from('catalogues')
      .insert(transformed);

    if (insertError) {
      console.error('Insert error at offset', offset, insertError);
      // Log the problematic record for debugging
      for (const item of transformed) {
        const { error: singleError } = await TEST
          .from('catalogues')
          .insert(item);
        if (singleError) {
          console.error('Failed catalogue:', item.name, singleError.message);
        }
      }
    }

    total += data.length;
    offset += batchSize;
    console.log(`Catalogues: migrated ${total} rows`);
  }

  console.log(`Catalogues: DONE — ${total} total`);
}

migrateCatalogues().catch(console.error);
```

### 7.4 Spot-Check After Catalogues Migration

```sql
-- Run on TEST after migration
-- Check a specific catalogue was transformed correctly
SELECT
  name,
  heading,
  jsonb_array_length(content) as block_count,
  content->0->>'type' as first_block_type,
  appearance->'theme'->>'name' as theme_name,
  source,
  status,
  tags,
  array_length(tags, 1) as tag_count
FROM catalogues
WHERE name = 'product-catalogue'
LIMIT 1;

-- Verify items have numeric prices
SELECT
  name,
  block->>'name' as category_name,
  item->>'name' as item_name,
  item->>'price' as price,
  pg_typeof(item->'price') as price_type
FROM catalogues,
  jsonb_array_elements(content) AS block,
  jsonb_array_elements(COALESCE(block->'items', '[]'::jsonb)) AS item
WHERE block->>'type' = 'category'
LIMIT 10;
```

---

## 8. Post-Migration Validation

### 8.1 Row Count Comparison

```sql
-- Run on TEST after migration
SELECT 'users' as tbl, COUNT(*) as cnt FROM users
UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL SELECT 'catalogues', COUNT(*) FROM catalogues
UNION ALL SELECT 'qr_configs', COUNT(*) FROM qr_configs
UNION ALL SELECT 'ocr', COUNT(*) FROM ocr
UNION ALL SELECT 'prompts', COUNT(*) FROM prompts
UNION ALL SELECT 'analytics', COUNT(*) FROM analytics
UNION ALL SELECT 'newsletter', COUNT(*) FROM newsletter
UNION ALL SELECT 'product_newsletter', COUNT(*) FROM product_newsletter
UNION ALL SELECT 'job_logs', COUNT(*) FROM job_logs
ORDER BY tbl;
```

Compare with PROD baseline from Step 5.3.

### 8.2 FK Integrity Check

```sql
-- Check for orphaned references
-- catalogues → users
SELECT COUNT(*) as orphan_catalogues
FROM catalogues c
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.created_by);

-- newsletter → users
SELECT COUNT(*) as orphan_newsletter
FROM newsletter n
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = n.owner_id);

-- analytics → users (if FK exists)
SELECT COUNT(*) as orphan_analytics
FROM analytics a
WHERE a.user_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a.user_id);
```

### 8.3 Catalogues Data Integrity

```sql
-- Count catalogues with empty content
SELECT COUNT(*) as empty_content
FROM catalogues WHERE content = '[]'::jsonb;

-- Count catalogues with at least one category
SELECT COUNT(*) as has_categories
FROM catalogues
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(content) AS block
  WHERE block->>'type' = 'category'
);

-- Check for any price = 0 that shouldn't be
SELECT c.name, item->>'name' as item_name, item->>'price' as price
FROM catalogues c,
  jsonb_array_elements(content) AS block,
  jsonb_array_elements(COALESCE(block->'items', '[]'::jsonb)) AS item
WHERE block->>'type' = 'category'
AND (item->>'price')::numeric = 0
LIMIT 20;
```

---

## 9. Git Branch Management

### 9.1 Rename Branches

```bash
# Get current date for backup name
DATE=$(date +%Y-%m-%d)

# Rename main to main-backup-{date}
git checkout main
git branch -m main main-backup-$DATE
git push origin main-backup-$DATE
git push origin --delete main  # Delete remote main

# Rename test to main
git checkout test
git branch -m test main
git push origin main
git push origin --delete test  # Delete remote test

# Set upstream
git branch --set-upstream-to=origin/main main

# Verify
git branch -a
```

### 9.2 Update Default Branch on GitHub

```
1. Go to GitHub repo → Settings → General → Default Branch
2. Change default branch from main to main-backup-{date} temporarily
3. Delete remote main
4. Push new main (from test)
5. Change default branch back to main
```

> **Safer alternative**: Use GitHub's branch rename feature if available:
```
GitHub → Settings → Branches → Rename branch
```

---

## 10. Vercel Deployment

### 10.1 Update Environment Variables

On the Vercel project, update these environment variables to point to the **new PROD** (TEST project):

```
NEXT_PUBLIC_SUPABASE_URL=https://tpcfltcupcofteovrvmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<TEST_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<TEST_SERVICE_ROLE_KEY>
```

> Get the keys from Supabase Dashboard → TEST project → Settings → API

### 10.2 Deploy

```bash
# If auto-deploy was disabled, re-enable it or trigger manually:
# Option 1: Re-enable auto-deploy in Vercel settings
# Option 2: Manual deploy
vercel --prod

# Or push to main (if auto-deploy is re-enabled)
git push origin main
```

### 10.3 Verify Deployment

```
1. Visit production URL
2. Check a few catalogues load correctly
3. Test login/authentication
4. Test creating a new catalogue
5. Test editing an existing catalogue
6. Verify analytics are recording
```

---

## 11. Edge Functions (Deferred)

These need to be migrated separately at a later date:

| Function | Slug | Purpose | Trigger |
|----------|------|---------|---------|
| discord-new-catalogue-alert | rapid-handler | Discord notification on new catalogue | INSERT on catalogues |
| discord-new-subscription-alert | discord-subscription-alert | Discord notification on subscription changes | INSERT/UPDATE on subscriptions |
| create-crm-contact | create-crm-contact | CRM contact creation | INSERT/UPDATE on subscriptions |

When ready, you'll need to:
1. Get edge function code from PROD: Supabase Dashboard → PROD → Edge Functions
2. Deploy to TEST (new PROD) project
3. Create database webhook triggers pointing to the new project URL
4. Update the Authorization headers with the new project's service role key

---

## 12. Rollback Procedures

### 12.1 If Migration Fails Mid-Way

```sql
-- Clear TEST tables and start over
TRUNCATE TABLE job_logs CASCADE;
TRUNCATE TABLE product_newsletter CASCADE;
TRUNCATE TABLE newsletter CASCADE;
TRUNCATE TABLE analytics CASCADE;
TRUNCATE TABLE prompts CASCADE;
TRUNCATE TABLE ocr CASCADE;
TRUNCATE TABLE qr_configs CASCADE;
TRUNCATE TABLE catalogues CASCADE;
TRUNCATE TABLE subscriptions CASCADE;
TRUNCATE TABLE users CASCADE;
```

### 12.2 If New PROD Has Issues Post-Deploy

1. **Revert Vercel environment variables** back to original PROD project credentials
2. **Revert branch names**:
```bash
DATE=<the-date-you-used>
git checkout main
git branch -m main test  # Rename back to test
git checkout main-backup-$DATE
git branch -m main-backup-$DATE main  # Restore original main
git push origin main --force
git push origin test
```
3. Original PROD project (`uhfbapjuzvlyzyodxhqn`) is untouched — it's your safety net

### 12.3 Nuclear Option

If everything goes wrong, the original PROD Supabase project is completely untouched. Simply:
1. Point Vercel back to `uhfbapjuzvlyzyodxhqn`
2. Restore the `main` branch from backup
3. Deploy

---

## 13. Final Checklist

### Pre-Migration
- [ ] E2E testing completed on TEST environment
- [ ] Decision Matrix (Section 4) filled out
- [ ] Automatic Vercel deployment disabled
- [ ] PROD row counts recorded (Section 5.3)
- [ ] Database credentials for both projects ready

### Migration
- [ ] TEST tables cleared (Section 6.0)
- [ ] RLS disabled on TEST (Section 6.1)
- [ ] Schema adjustments applied (Section 6.2)
- [ ] users migrated and verified (1,842 rows)
- [ ] subscriptions migrated and verified (78 rows)
- [ ] catalogues migrated with transformation (433 rows)
- [ ] catalogues spot-checked (Section 7.4)
- [ ] qr_configs skipped (0 rows)
- [ ] ocr migrated and verified (9 rows)
- [ ] prompts migrated and verified (15 rows)
- [ ] analytics migrated and verified (2,986 rows)
- [ ] newsletter migrated and verified (2 rows)
- [ ] product_newsletter migrated and verified (17 rows)
- [ ] job_logs decision executed (28 rows)

### Post-Migration
- [ ] Row counts match (Section 8.1)
- [ ] FK integrity verified (Section 8.2)
- [ ] Catalogues data integrity verified (Section 8.3)
- [ ] Git branches renamed (Section 9)
- [ ] GitHub default branch updated
- [ ] Vercel environment variables updated (Section 10.1)
- [ ] Production deployed (Section 10.2)
- [ ] E2E testing on new PROD passed (Section 10.3)

### Post-Launch
- [ ] Monitor for errors (24-48 hours)
- [ ] Edge functions migrated (when ready)
- [ ] Old PROD project kept as backup for 30 days minimum
- [ ] Team notified of migration completion
