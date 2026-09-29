import type { User } from "@quicktalog/common";

import { cn } from "@/lib/ui/cn";
import { initialsFrom } from "@/lib/users/initials";

export const UserProfile = ({ user }: { user: User }) => {
	const firstName =
		user?.name && user.name !== "Unknown User"
			? user.name.trim().split(/\s+/)[0]
			: "";
	const avatarClass =
		"relative h-[72px] w-[72px] flex-none rounded-full shadow-[0_0_0_4px_var(--product-primary),0_10px_24px_-8px_rgb(var(--product-foreground-rgb)/0.3)] md:h-24 md:w-24";

	return (
		<section
			aria-label="Your profile"
			className="flex flex-col items-center gap-3.5 rounded-product-card border border-product-border bg-product-amber-panel px-[18px] py-6 text-center shadow-product md:flex-row md:gap-6 md:p-8 md:text-left"
		>
			{user.image ? (
				<img
					alt=""
					className={cn(avatarClass, "object-cover")}
					height={96}
					referrerPolicy="no-referrer"
					src={user.image}
					width={96}
				/>
			) : (
				<span
					aria-hidden="true"
					className={cn(
						avatarClass,
						"grid place-items-center bg-product-primary-soft font-product-heading text-2xl font-extrabold text-product-foreground md:text-[32px]",
					)}
				>
					{initialsFrom(user.name)}
				</span>
			)}
			<div className="min-w-0">
				<h1 className="text-[clamp(22px,3vw,30px)] font-extrabold leading-[1.15] tracking-[-0.03em]">
					{firstName ? `Welcome back, ${firstName}!` : "Welcome back!"}
				</h1>
				<p className="mt-1 break-words text-[15px] text-product-foreground-accent">
					{user.email}
				</p>
			</div>
		</section>
	);
};
