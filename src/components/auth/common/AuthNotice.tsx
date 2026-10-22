import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/ui/cn";

/**
 * A form-level message. `tone` is "error" for something the user must fix and
 * "info" for context the page arrived with, such as an expired link.
 */
export function AuthNotice({
	message,
	tone = "error",
}: {
	message: string | null;
	tone?: "error" | "info";
}) {
	if (!message) return null;
	const Icon = tone === "error" ? AlertCircle : Info;
	return (
		<div
			className={cn(
				"flex w-full items-start gap-2.5 rounded-[14px] border px-3.5 py-3 text-[14.5px] font-medium leading-[1.45] [&>svg]:mt-px [&>svg]:size-[18px] [&>svg]:flex-none",
				tone === "error"
					? "border-product-error/25 bg-product-error-soft text-product-error"
					: "border-product-primary/45 bg-product-primary-soft text-product-foreground [&>svg]:text-product-primary-ink",
			)}
			role={tone === "error" ? "alert" : "status"}
		>
			<Icon aria-hidden="true" />
			<p>{message}</p>
		</div>
	);
}
