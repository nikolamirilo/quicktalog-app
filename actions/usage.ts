"use server"
import { createClient } from "@/utils/supabase/server"
import { currentUser } from "@clerk/nextjs/server"

export async function logOcrUsage() {
  try {

    const supabase = await createClient()

    const user = await currentUser()
    if (!user || !user.id) {
      console.error("No authenticated user found.")
      return false
    }

    const { error } = await supabase
      .from("ocr")
      .insert([{ user_id: user.id }])

    if (error) {
      console.error("Error inserting data into Supabase 'ocr' table:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Unexpected error while logging OCR usage:", err)
    return false
  }
}

