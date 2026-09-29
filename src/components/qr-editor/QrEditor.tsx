"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { QrControls } from "@/components/qr-editor/QrControls";
import { QrPreview } from "@/components/qr-editor/QrPreview";
import { QrUrlBar } from "@/components/qr-editor/QrUrlBar";
import { useQr } from "@/context/QRContext";
import { NavigationGuard } from "@/hooks/useBeforeUnload";
import { kebabToTitle } from "@/lib/format/text";
import { assessScanRisk } from "@/lib/qr/scan-risk";
import { initialsFrom } from "@/lib/users/initials";

export const QrEditor = ({
	name,
	status,
	hasSavedDesign,
}: {
	name: string;
	/** The catalogue's status, for the chip ("active" shows as Live). */
	status: string;
	hasSavedDesign: boolean;
}) => {
	const { options, isDirty } = useQr();
	const [leaving, setLeaving] = useState(false);
	const risk = useMemo(() => assessScanRisk(options), [options]);
	const title = kebabToTitle(name);
	const isLive = status === "active";

	return (
		<div className="min-w-0 pb-10 pt-1 text-product-foreground">
			<NavigationGuard
				isDirty={isDirty && !leaving}
				onLeave={() => setLeaving(true)}
			/>

			<header className="mb-[22px]">
				<Link
					className="inline-flex h-8 items-center gap-[7px] rounded-full border border-product-border bg-product-card/70 pl-2.5 pr-[13px] text-[13px] font-semibold text-product-foreground-accent transition-colors hover:border-product-border-strong hover:bg-product-card hover:text-product-foreground"
					href="/admin/dashboard"
				>
					<ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
					Back to dashboard
				</Link>
				<div className="mt-3.5 flex flex-col gap-3.5 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
					<div>
						<h1 className="text-[clamp(28px,3.6vw,40px)] font-extrabold leading-[1.08] tracking-[-0.035em]">
							QR code editor
						</h1>
						<p className="mt-2 max-w-[560px] text-[15.5px] leading-normal text-product-foreground-accent">
							Create beautiful, customized QR codes for your brand with our
							easy-to-use editor.
						</p>
					</div>
					<div className="inline-flex min-w-0 max-w-full items-center gap-2.5 self-start rounded-full border border-product-border bg-product-card py-1.5 pl-1.5 pr-3.5 shadow-product min-[900px]:self-auto">
						<span
							aria-hidden="true"
							className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-product-primary font-product-heading text-[12.5px] font-extrabold text-product-foreground"
						>
							{initialsFrom(title)}
						</span>
						<span className="flex min-w-0 flex-col gap-0.5">
							<b className="truncate font-product-heading text-[13.5px] font-bold leading-tight">
								{title}
							</b>
							<code className="truncate font-mono text-[11.5px] leading-tight text-product-muted">
								{name}
							</code>
						</span>
						<span className="ml-1 inline-flex shrink-0 items-center gap-1.5 border-l border-product-border pl-3 text-[12.5px] font-semibold leading-none text-product-foreground-accent">
							<i
								aria-hidden="true"
								className={
									isLive
										? "h-2 w-2 rounded-full bg-product-success-bright shadow-[0_0_0_3px_rgb(var(--product-success-bright-rgb)/0.18)]"
										: "h-2 w-2 rounded-full bg-product-border-strong"
								}
							/>
							<span className={isLive ? "text-product-success" : undefined}>
								{isLive ? "Live" : kebabToTitle(status.replace(/\s+/g, "-"))}
							</span>
						</span>
					</div>
				</div>
			</header>

			<div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] lg:gap-6">
				<div className="min-w-0 lg:sticky lg:top-[104px] lg:order-2">
					<QrPreview hasSavedDesign={hasSavedDesign} name={name} risk={risk} />
				</div>
				<div className="flex min-w-0 flex-col gap-3.5 lg:order-1">
					<QrUrlBar url={options.data ?? ""} />
					<QrControls risk={risk} />
				</div>
			</div>
		</div>
	);
};
