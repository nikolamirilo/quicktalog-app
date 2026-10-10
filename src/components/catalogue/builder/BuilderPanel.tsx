"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { BUILDER_WIDE_QUERY } from "./frame";

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The editor panel's shell: a header with a title and close button, then its
 * content.
 *
 * - Phone: a full-height sheet above the bottom bar.
 * - `md` to 1280px: an overlay to the left of the rail; the frame adds a scrim.
 *   Focus moves in, Tab stays inside, and Esc closes it.
 * - From 1280px: it sits beside the catalogue, which makes room for it, so it
 *   is not modal and Tab can leave it.
 *
 * Focus returns to whatever opened it when it closes.
 */
export const BuilderPanel = ({
	id,
	title,
	description,
	onClose,
	children,
}: {
	id: string;
	title: string;
	description?: string;
	onClose: () => void;
	children: ReactNode;
}) => {
	const panelRef = useRef<HTMLElement>(null);
	const titleId = useId();
	// From 1280px the panel sits beside the catalogue instead of over it.
	const isWide = useMediaQuery(BUILDER_WIDE_QUERY);

	useEffect(() => {
		const opener =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		panelRef.current?.focus({ preventScroll: true });
		return () => {
			if (opener?.isConnected) opener.focus({ preventScroll: true });
		};
	}, []);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
		const panel = panelRef.current;
		// Portaled menus and pickers bubble through React but are not inside the
		// panel's DOM; their own Esc closes them, not the panel.
		if (!panel || !(event.target instanceof Node)) return;
		if (!panel.contains(event.target)) return;

		if (event.key === "Escape") {
			event.stopPropagation();
			onClose();
			return;
		}
		if (event.key !== "Tab" || isWide) return;
		const focusable = [
			...panel.querySelectorAll<HTMLElement>(FOCUSABLE),
		].filter((el) => el.getClientRects().length > 0);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement;
		if (event.shiftKey && (active === first || active === panel)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	};

	return (
		<section
			aria-labelledby={titleId}
			aria-modal={isWide ? undefined : true}
			className="flex min-h-0 flex-1 animate-in flex-col bg-product-background font-product-body text-product-foreground outline-none duration-300 fade-in slide-in-from-bottom-4 motion-reduce:animate-none md:absolute md:right-full md:top-0 md:h-full md:w-[440px] md:max-w-[calc(100vw-72px)] md:border-l md:border-product-border md:shadow-product md:slide-in-from-bottom-0 md:slide-in-from-right-4 min-[1280px]:shadow-none"
			id={id}
			onKeyDown={handleKeyDown}
			ref={panelRef}
			role={isWide ? "region" : "dialog"}
			tabIndex={-1}
		>
			<header className="flex shrink-0 items-center gap-2 border-product-border bg-product-card px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-4 md:pt-3">
				{/* Phone only: on desktop the rail carries the Dashboard link. */}
				<Button
					asChild
					className="md:hidden"
					size="icon"
					title="Back to dashboard"
					variant="ghost"
				>
					<Link aria-label="Back to dashboard" href="/admin/dashboard">
						<ArrowLeft />
					</Link>
				</Button>
				<div className="min-w-0 flex-1">
					<h2
						className="truncate font-product-heading text-base font-bold leading-tight text-product-foreground"
						id={titleId}
					>
						{title}
					</h2>
					{description && (
						<p className="truncate text-xs leading-snug text-product-muted">
							{description}
						</p>
					)}
				</div>
				<Button
					aria-label="Close editor"
					onClick={onClose}
					size="icon"
					title="Close editor (Esc)"
					variant="ghost"
				>
					<X />
				</Button>
			</header>
			{children}
		</section>
	);
};
