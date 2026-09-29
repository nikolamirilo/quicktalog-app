import type { createClient } from "@/utils/supabase/client";

/** The browser Supabase client the account cards share. */
export type SupabaseBrowserClient = ReturnType<typeof createClient>;

/** Where a linked identity comes back to. Must be inside the redirect allow-list. */
export const ACCOUNT_PATH = "/admin/dashboard?tab=settings";
