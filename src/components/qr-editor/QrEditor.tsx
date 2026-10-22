"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { QrControls } from "@/components/qr-editor/QrControls";
import { QrPreview } from "@/components/qr-editor/QrPreview";
import { QrUrlBar } from "@/components/qr-editor/QrUrlBar";
import { useQr } from "@/context/QRContext";
import { NavigationGuard } from "@/hooks/useBeforeUnload";
import { assessScanRisk } from "@/lib/qr/scan-risk";

export const QrEditor = ({
	name,
	hasSavedDesign,
}: {
	name: string;
	hasSavedDesign: boolean;
}) => {
	const { options, isDirty } = useQr();
	const [leaving, setLeaving] = useState(false);
	const risk = useMemo(() => assessScanRisk(options), [options]);

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
				<div className="mt-3.5">
					<h1 className="text-[clamp(28px,3.6vw,40px)] font-extrabold leading-[1.08] tracking-[-0.035em]">
						QR code editor
					</h1>
					<p className="mt-2 max-w-[560px] text-[15.5px] leading-normal text-product-foreground-accent">
						Create beautiful, customized QR codes for your brand with our
						easy-to-use editor.
					</p>
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
