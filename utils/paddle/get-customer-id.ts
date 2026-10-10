import { createClient } from "@/utils/supabase/server";
import { currentUser } from "@clerk/nextjs/server";

export async function getCustomerId() {
	const supabase = await createClient();
	const user = await currentUser();
	if (user.emailAddresses[0].emailAddress) {
		const usersData = await supabase
			.from("users")
			.select("customer_id,email")
			.eq("id", user.id)
			.single();
		if (usersData?.data?.customer_id) {
			return usersData?.data?.customer_id as string;
		}
	}
	return "";
}
