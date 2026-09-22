import { cn } from "@/helpers/client";

/**
 * A form-level message. `tone` is "error" for something the user must fix and
 * "info" for context the page arrived with, such as an expired link.
 */
export default function AuthNotice({
	message,
	tone = "error",
}: {
	message: string | null;
	tone?: "error" | "info";
}) {
	if (!message) return null;
	return (
		<p
			className={cn(
				"rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
				tone === "error"
					? "border border-red-200 bg-red-50 text-red-700"
					: "bg-product-background-hero text-product-foreground-accent",
			)}
			role="alert"
		>
			{message}
		</p>
	);
}
