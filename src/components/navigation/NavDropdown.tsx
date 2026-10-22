"use client";
import { IconTile } from "@/components/general/IconTile";
import {
	isActivePath,
	navPillActive,
	navPillBase,
} from "@/components/navigation/NavLink";
import { cn } from "@/lib/ui/cn";
import type { NavMenu } from "@/types/navigation";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	type KeyboardEvent as ReactKeyboardEvent,
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useEffect,
	useRef,
} from "react";

/** Delay before a hover-opened panel closes, so the pointer can cross the gap. */
const HOVER_CLOSE_DELAY = 140;
/** A click this soon after a hover-open is the same intent, not a close. */
const CLICK_AFTER_HOVER_GRACE = 400;

type NavDropdownProps = {
	menu: NavMenu;
	isOpen: boolean;
	/**
	 * Called with the menu's label. Pass a stable function (e.g. from
	 * `useCallback`): the document listeners re-attach whenever it changes.
	 */
	onOpenChange: (label: string, open: boolean) => void;
};

/**
 * Disclosure menu for the desktop navbar. Opens on click, or on hover for a
 * mouse; Esc closes it and returns focus to the trigger, and an outside click
 * closes it. Items are plain links, so this follows the disclosure-navigation
 * pattern rather than an ARIA menu.
 */
export const NavDropdown = ({
	menu,
	isOpen,
	onOpenChange: onMenuOpenChange,
}: NavDropdownProps) => {
	const pathname = usePathname();
	const { label } = menu;
	const onOpenChange = useCallback(
		(open: boolean) => onMenuOpenChange(label, open),
		[onMenuOpenChange, label],
	);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hoverOpenedAt = useRef(0);
	const panelId = `nav-menu-${menu.label.toLowerCase()}`;

	const hasActiveItem = menu.items.some((item) =>
		isActivePath(pathname, item.url),
	);

	const cancelClose = () => {
		if (closeTimer.current) {
			clearTimeout(closeTimer.current);
			closeTimer.current = null;
		}
	};

	useEffect(() => cancelClose, []);

	useEffect(() => {
		if (!isOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				onOpenChange(false);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onOpenChange(false);
				triggerRef.current?.focus();
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onOpenChange]);

	const handlePointerEnter = (event: ReactPointerEvent) => {
		if (event.pointerType !== "mouse") return;
		cancelClose();
		if (!isOpen) {
			hoverOpenedAt.current = Date.now();
			onOpenChange(true);
		}
	};

	const handlePointerLeave = (event: ReactPointerEvent) => {
		if (event.pointerType !== "mouse") return;
		cancelClose();
		closeTimer.current = setTimeout(
			() => onOpenChange(false),
			HOVER_CLOSE_DELAY,
		);
	};

	const handleClick = () => {
		cancelClose();
		if (
			isOpen &&
			Date.now() - hoverOpenedAt.current < CLICK_AFTER_HOVER_GRACE
		) {
			return;
		}
		hoverOpenedAt.current = 0;
		onOpenChange(!isOpen);
	};

	/** Arrow keys move between the panel's links. */
	const handlePanelKeyDown = (event: ReactKeyboardEvent) => {
		if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
		const links = Array.from(
			panelRef.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [],
		);
		if (!links.length) return;
		event.preventDefault();
		const index = links.indexOf(document.activeElement as HTMLAnchorElement);
		const step = event.key === "ArrowDown" ? 1 : -1;
		const next = (index + step + links.length) % links.length;
		links[next]?.focus();
	};

	const handleTriggerKeyDown = (event: ReactKeyboardEvent) => {
		if (event.key !== "ArrowDown") return;
		event.preventDefault();
		if (!isOpen) onOpenChange(true);
		requestAnimationFrame(() => panelRef.current?.querySelector("a")?.focus());
	};

	return (
		<div
			className="relative"
			onBlur={(event) => {
				// Tabbing to something outside closes the menu. A null target
				// (Safari clicks don't move focus) is left to the outside-click check.
				const next = event.relatedTarget as Node | null;
				if (isOpen && next && !containerRef.current?.contains(next)) {
					onOpenChange(false);
				}
			}}
			onPointerEnter={handlePointerEnter}
			onPointerLeave={handlePointerLeave}
			ref={containerRef}
		>
			<button
				aria-controls={panelId}
				aria-expanded={isOpen}
				className={cn(
					navPillBase,
					"h-10 cursor-pointer px-3.5 text-[15px] font-medium",
					(isOpen || hasActiveItem) && navPillActive,
				)}
				onClick={handleClick}
				onKeyDown={handleTriggerKeyDown}
				ref={triggerRef}
				type="button"
			>
				{menu.label}
				<ChevronDown
					aria-hidden="true"
					className={cn(
						"h-[15px] w-[15px] transition-transform duration-200",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			<div
				className="absolute left-1/2 top-[calc(100%+12px)] z-[52] w-[340px] -translate-x-1/2 before:absolute before:inset-x-0 before:-top-3.5 before:h-3.5 before:content-['']"
				hidden={!isOpen}
				id={panelId}
			>
				{isOpen && (
					<div
						className="grid gap-0.5 rounded-product-card border border-product-border bg-product-card p-2 shadow-product-hover animate-in fade-in-0 slide-in-from-top-1.5 duration-200"
						onKeyDown={handlePanelKeyDown}
						ref={panelRef}
					>
						{menu.items.map((item) => {
							const Icon = item.icon;
							const isActive = isActivePath(pathname, item.url);
							return (
								<Link
									aria-current={isActive ? "page" : undefined}
									className="group flex items-start gap-3 rounded-[14px] px-3 py-[11px] text-product-foreground transition-colors duration-150 hover:bg-product-background-hero focus-visible:bg-product-background-hero"
									href={item.url}
									key={item.url}
									onClick={() => onOpenChange(false)}
								>
									<IconTile
										className="group-hover:border-product-primary group-hover:bg-product-primary group-hover:text-product-foreground"
										size="sm"
									>
										<Icon />
									</IconTile>
									<span>
										<span className="block text-[15px] font-semibold leading-[1.3]">
											{item.text}
										</span>
										<span className="mt-0.5 block text-[13px] leading-[1.4] text-product-muted">
											{item.description}
										</span>
									</span>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};
