"use client";

import { BuilderPanel } from "@/components/catalogue/builder/BuilderPanel";
import { BuilderRail } from "@/components/catalogue/builder/BuilderRail";
import { useBuilderActions } from "@/components/catalogue/builder/useBuilderActions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { cn } from "@/lib/ui/cn";
import type { UserData } from "@quicktalog/common";
import { FileText, Home, Layout, Palette } from "lucide-react";
import type React from "react";
import { BuilderActionModals, BuilderBottomBar } from "./ActionButtons";
import AppearanceTab from "./AppearanceTab";
import FooterTab from "./FooterTab";
import GeneralTab from "./GeneralTab";
import HeaderTab from "./HeaderTab";

export type TabKey =
	| "general"
	| "templates"
	| "header"
	| "footer"
	| "appearance";

const PANEL_ID = "builder-editor-panel";

/**
 * Icon over label in four equal columns, so all four fit at 360px without
 * clipping. Active: amber tint with an amber border, not a solid amber fill.
 */
const tabTriggerClass =
	"h-auto min-w-0 flex-col gap-1 rounded-xl border border-transparent px-1 py-2 text-xs font-semibold data-[state=active]:border-product-primary data-[state=active]:bg-product-primary-soft data-[state=active]:text-product-foreground data-[state=active]:shadow-none";

/**
 * The builder frame: the desktop rail and editor panel, and the phone bottom
 * bar and editor sheet. The catalogue reserves room for it (see
 * `builder/frame.ts`), so none of it covers the catalogue except the panel
 * below 1280px, which overlays with a scrim.
 */
const BuilderSidebar: React.FC<{ userData: UserData }> = ({ userData }) => {
	const context = useCatalogueContext();
	const isOpen = context?.isSidebarOpen ?? false;
	const setIsOpen = context?.setIsSidebarOpen ?? (() => {});
	const isChatOpen = context?.isChatOpen ?? false;
	const setIsChatOpen = context?.setIsChatOpen ?? (() => {});
	const closePanel = () => setIsOpen(false);
	const { actions, catalogueName, ...modals } = useBuilderActions({
		closePanel,
	});

	const TABS: {
		key: TabKey;
		icon: React.ElementType;
		label: string;
		content: React.ReactNode;
	}[] = [
		{
			key: "general",
			icon: Home,
			label: "General",
			content: <GeneralTab plan={userData.currentPlan} />,
		},
		{
			key: "header",
			icon: Layout,
			label: "Header",
			content: <HeaderTab plan={userData.currentPlan} />,
		},
		{
			key: "footer",
			icon: FileText,
			label: "Footer",
			content: <FooterTab plan={userData.currentPlan} />,
		},
		{
			key: "appearance",
			icon: Palette,
			label: "Appearance",
			content: <AppearanceTab plan={userData.currentPlan} />,
		},
	];

	return (
		<aside
			aria-label="Catalogue builder"
			className={cn(
				"fixed inset-x-0 bottom-0 !z-[1000] flex-col font-product-body text-product-foreground",
				// One thumb zone, one panel: the chat sheet owns the bottom edge while
				// it is up, so the phone bar steps aside rather than covering its
				// input. On desktop the two sit side by side, so it comes back at md.
				isChatOpen ? "hidden md:flex" : "flex",
				isOpen && "h-[100dvh]",
				"md:inset-x-auto md:right-0 md:top-0 md:h-[100dvh] md:w-[72px]",
			)}
		>
			{isOpen && (
				// Below 1280px the panel overlays the catalogue; the scrim closes it.
				// Keyboard users close it with Esc or the header button.
				<div
					aria-hidden="true"
					className="fixed inset-0 -z-10 hidden animate-in bg-product-dark/40 backdrop-blur-[2px] duration-300 fade-in motion-reduce:animate-none md:block min-[1280px]:hidden"
					onClick={closePanel}
				/>
			)}

			<BuilderRail
				actions={[
					actions.save,
					actions.templates,
					actions.preview,
					actions.publish,
				]}
				isPanelOpen={isOpen}
				onTogglePanel={() => setIsOpen(!isOpen)}
				panelId={PANEL_ID}
			/>

			{isOpen && (
				<BuilderPanel
					description="Name, header, footer and appearance"
					id={PANEL_ID}
					onClose={closePanel}
					title="Edit catalogue"
				>
					<Tabs className="flex min-h-0 flex-1 flex-col" defaultValue="general">
						<div className="shrink-0 border-b border-product-border bg-product-card px-3 py-3 md:px-4">
							<TabsList className="grid h-auto w-full grid-cols-4 gap-1 rounded-2xl p-1">
								{TABS.map(({ key, icon: Icon, label }) => (
									<TabsTrigger
										className={tabTriggerClass}
										key={key}
										value={key}
									>
										<Icon aria-hidden="true" />
										<span className="max-w-full truncate">{label}</span>
									</TabsTrigger>
								))}
							</TabsList>
						</div>

						<ScrollArea className="min-h-0 flex-1 [&>[data-radix-scroll-area-viewport]>div]:!block">
							<div className="p-4">
								{TABS.map(({ key, content }) => (
									<TabsContent className="mt-0" key={key} value={key}>
										{content}
									</TabsContent>
								))}
							</div>
						</ScrollArea>
					</Tabs>
				</BuilderPanel>
			)}

			<BuilderBottomBar
				actions={actions}
				isChatOpen={isChatOpen}
				isPanelOpen={isOpen}
				onAskAi={() => {
					closePanel();
					setIsChatOpen(true);
				}}
				onTogglePanel={() => setIsOpen(!isOpen)}
				panelId={PANEL_ID}
			/>

			<BuilderActionModals catalogueName={catalogueName} {...modals} />
		</aside>
	);
};

export default BuilderSidebar;
