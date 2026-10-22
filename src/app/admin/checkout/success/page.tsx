import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { SuccessMark } from "@/components/dashboard/checkout/SuccessMark";
import { Button } from "@/components/ui/button";
import { footerDetails } from "@/constants/details";

/** Bare frame: no navbar or footer, just the confirmation card. */
const page = () => {
	return (
		<main
			className="relative isolate flex min-h-svh flex-col items-center px-4 pb-12 pt-5 sm:px-6 sm:pb-14 sm:pt-7"
			id="main"
		>
			<div
				aria-hidden="true"
				className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-product-background"
			>
				<span className="absolute inset-0 bg-[linear-gradient(to_right,rgb(var(--product-foreground-rgb)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--product-foreground-rgb)/0.05)_1px,transparent_1px)] bg-[length:44px_44px] [mask-image:radial-gradient(ellipse_55%_50%_at_50%_45%,#000,transparent)]" />
				<span className="absolute left-1/2 top-[42%] h-[620px] w-[620px] max-w-[130vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-product-primary/25 blur-[110px]" />
			</div>

			<Link
				aria-label="Quicktalog home"
				className="inline-flex rounded-full p-1"
				href="/"
			>
				<img
					alt=""
					className="h-[30px] w-auto"
					height={30}
					src="/images/brand/logo.svg"
					width={83}
				/>
			</Link>

			<section
				aria-labelledby="checkout-success-h"
				className="m-auto flex w-full max-w-[440px] flex-col items-center rounded-product-panel border border-product-border bg-product-card px-7 pb-8 pt-10 text-center shadow-product sm:px-11 sm:pb-9 sm:pt-12"
			>
				<SuccessMark />
				<h1
					className="text-[clamp(30px,5vw,38px)] font-extrabold leading-[1.08] tracking-[-0.035em]"
					id="checkout-success-h"
				>
					Payment Successful!
				</h1>
				<p className="mt-2.5 text-[17px] text-product-foreground-accent">
					Thank you for your purchase.
				</p>
				<Button asChild className="group mt-7 w-full" size="lg">
					<Link href="/admin/dashboard">
						Return to Dashboard
						<ArrowRight
							aria-hidden="true"
							className="transition-transform group-hover:translate-x-0.5"
						/>
					</Link>
				</Button>
				<p className="mt-5 text-sm leading-normal text-product-muted">
					Have questions? Contact us at:
					<br />
					<a
						className="font-semibold text-product-primary-ink underline decoration-product-primary-ink/35 underline-offset-[3px] hover:decoration-current"
						href={`mailto:${footerDetails.email}`}
					>
						{footerDetails.email}
					</a>
				</p>
			</section>
		</main>
	);
};

export default page;
