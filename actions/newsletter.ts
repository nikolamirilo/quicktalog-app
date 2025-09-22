"use server"
import { createClient } from "@/utils/supabase/server"

export async function newsletterSignup(email: string, catalogue_id: string, owner_id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("newsletter").insert([{ email, catalogue_id, owner_id }])

    if (error) {
      console.error("Error inserting data into Supabase 'newsletter' table:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Unexpected error while inserting record in newsletter table:", err)
    return false
  }
}
export async function productNewsletterSignup(email: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("product_newsletter").insert([{ email }])

    if (error) {
      console.error("Error inserting data into Supabase 'newsletter' table:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Unexpected error while inserting record in newsletter table:", err)
    return false
  }
}
