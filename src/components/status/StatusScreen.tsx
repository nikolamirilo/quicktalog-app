import { Container } from "@/components/general/Container";
import { Eyebrow } from "@/components/general/Eyebrow";
import styles from "@/components/status/StatusScreen.module.css";
import { cn } from "@/lib/ui/cn";
import { Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type StatusScreenProps = {
	/** The two outer digits, e.g. `["4", "4"]` renders "4 (O) 4". */
	digits: [string, string];
	/** Icon inside the amber "O". */
	icon: ReactNode;
	eyebrow: string;
	title: string;
	description: ReactNode;
	/** Extra line under the description (e.g. the missing path). */
	detail?: ReactNode;
	actions: ReactNode;
	quickLinksLabel: string;
	quickLinks: { text: string; url: string }[];
};

const digitClass =
	"bg-gradient-to-b from-product-foreground from-10% to-product-muted bg-clip-text text-transparent";

/**
 * Full-height "something is off" page: giant digits with a bobbing amber "O",
 * a heading, actions and a row of quick links. Used by not-found and error.
 */
export function StatusScreen({
	digits,
	icon,
	eyebrow,
	title,
	description,
	detail,
	actions,
	quickLinksLabel,
	quickLinks,
}: StatusScreenProps) {
	return (
		<section className="relative isolate flex min-h-[88vh] items-center overflow-hidden pb-20 pt-[120px]">
			<div
				aria-hidden="true"
				className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(var(--product-foreground-rgb)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--product-foreground-rgb)/0.05)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_55%_55%_at_50%_40%,#000_45%,transparent_100%)]"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[620px] w-[720px] max-w-[140vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--product-primary-rgb)/0.22),rgb(var(--product-primary-rgb)/0.06)_60%,transparent)]"
			/>

			<Container className="flex flex-col items-center text-center">
				<p
					aria-hidden="true"
					className="mb-2.5 flex items-center justify-center gap-[0.02em] font-product-heading text-[clamp(116px,24vw,232px)] font-extrabold leading-[0.95] tracking-[-0.06em] text-product-foreground"
				>
					<span className={digitClass}>{digits[0]}</span>
					<span
						className={cn(
							"mx-[0.03em] grid h-[0.72em] w-[0.72em] place-items-center rounded-full bg-product-primary text-product-foreground shadow-[0_0_0_0.06em_var(--product-primary-soft),0_20px_40px_-14px_rgb(var(--product-primary-accent-rgb)/0.7)] [&_svg]:h-[0.36em] [&_svg]:w-[0.36em] [&_svg]:stroke-[2.6]",
							styles.bob,
						)}
					>
						{icon}
					</span>
					<span className={digitClass}>{digits[1]}</span>
				</p>

				<Eyebrow>{eyebrow}</Eyebrow>
				<h1 className="mt-1 text-[clamp(32px,4.6vw,50px)] font-extrabold tracking-[-0.03em]">
					{title}
				</h1>
				<p className="mt-3.5 max-w-[52ch] text-[clamp(16.5px,1.5vw,18.5px)] leading-[1.6] text-product-foreground-accent">
					{description}
				</p>
				{detail}

				<div className="mt-[30px] flex w-full max-w-[340px] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:justify-center [&>*]:h-[50px] [&>*]:text-base">
					{actions}
				</div>

				<div className="mt-11 w-full max-w-[640px]">
					<p
						className="mb-3 text-sm font-semibold text-product-muted"
						id="status-quick-links"
					>
						{quickLinksLabel}
					</p>
					<nav
						aria-labelledby="status-quick-links"
						className="flex flex-wrap items-center justify-center gap-2 rounded-[26px] border border-product-border bg-product-card p-2 shadow-product md:mx-auto md:w-fit md:flex-nowrap md:rounded-full md:pr-3"
					>
						<span
							aria-hidden="true"
							className="grid h-[38px] w-[38px] flex-none place-items-center rounded-full bg-product-primary-soft text-product-primary-ink"
						>
							<Search className="h-[17px] w-[17px]" />
						</span>
						{quickLinks.map((link) => (
							<Link
								className="inline-flex h-[38px] items-center whitespace-nowrap rounded-full bg-product-background-hero px-[15px] text-[14.5px] font-semibold text-product-foreground transition-colors hover:bg-product-primary-soft"
								href={link.url}
								key={link.url}
							>
								{link.text}
							</Link>
						))}
					</nav>
				</div>
			</Container>
		</section>
	);
}
