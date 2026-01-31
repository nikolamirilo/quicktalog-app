"use client";

import { FileText, Home, Layout, Palette } from "lucide-react";
import React, { useState } from "react";
import {
	LuChevronsDown,
	LuChevronsLeft,
	LuChevronsRight,
	LuChevronsUp,
} from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ActionButtons from "./ActionButtons";
import AppearanceTab from "./AppearanceTab";
import FooterTab from "./FooterTab";
import GeneralTab from "./GeneralTab";
import HeaderTab from "./HeaderTab";

type TabKey = "general" | "templates" | "header" | "footer" | "appearance";

interface SidebarProps {
	defaultOpen?: boolean;
}

const TABS: {
	key: TabKey;
	icon: React.ElementType;
	label: string;
	content: React.ReactNode;
}[] = [
	{ key: "general", icon: Home, label: "General", content: <GeneralTab /> },
	{ key: "header", icon: Layout, label: "Header", content: <HeaderTab /> },
	{ key: "footer", icon: FileText, label: "Footer", content: <FooterTab /> },
	{
		key: "appearance",
		icon: Palette,
		label: "Appearance",
		content: <AppearanceTab />,
	},
];

const tabTriggerClass =
	"flex-1 data-[state=active]:bg-product-primary data-[state=active]:text-product-foreground data-[state=active]:shadow-sm hover:bg-product-primary/10 text-gray-600 font-medium transition-all rounded-md py-2 data-[state=active]:font-bold";

const BuilderSidebar: React.FC<SidebarProps> = ({ defaultOpen = false }) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<aside
			className={`!z-[1000] fixed bg-product-background shadow-xl transition-all duration-300 flex 
        /* Mobile: Bottom App Bar */
        bottom-0 left-0 w-full flex-col-reverse
        ${isOpen ? "h-[100dvh]" : "h-auto"}
        
        /* Desktop: Right Sidebar */
        md:right-0 md:top-0 md:h-screen md:flex-col md:left-auto md:w-auto
        ${isOpen ? "md:w-fit md:max-w-[440px]" : "md:w-16"}
      `}
		>
			{/* Mobile Actions / Desktop Top actions */}
			<div
				className={`flex items-center py-3 px-2 justify-around md:justify-around
          /* Mobile: Always row, toggle button on right */
          w-full flex-row
          
          /* Desktop: Column when closed, Row when open */
          ${isOpen ? "md:flex-row md:gap-2" : "md:flex-col md:gap-4"}
        `}
			>
				<Button
					onClick={() => setIsOpen((v) => !v)}
					size={isOpen ? "sm" : "icon"}
					variant="grayed"
					className="ml-auto md:ml-0 md:flex hidden hover:scale-105 active:scale-95"
				>
					{/* Desktop Icons */}
					<div className="hidden md:block">
						{isOpen ? (
							<LuChevronsRight size={25} />
						) : (
							<LuChevronsLeft size={25} />
						)}
					</div>
					{/* Mobile Icons */}
					<div className="md:hidden">
						{isOpen ? <LuChevronsDown size={25} /> : <LuChevronsUp size={25} />}
					</div>
				</Button>
				<span
					className={`border-gray-300/70 hidden md:block
            ${isOpen ? "border-r h-6" : "border-b w-full"}
          `}
				></span>

				{/* Mobile: ActionButtons usually on left/center. Desktop: Top/Center */}
				<div className="flex md:contents w-full justify-around md:w-auto md:justify-start gap-2 items-center">
					<ActionButtons isOpen={isOpen} setIsOpen={setIsOpen} />
					{/* Mobile Toggle Button */}
					<Button
						onClick={() => setIsOpen((v) => !v)}
						size="sm"
						variant="grayed"
						className="md:hidden"
					>
						{isOpen ? <LuChevronsDown size={25} /> : <LuChevronsUp size={25} />}
						<span className="ml-1 sr-only">Toggle</span>
					</Button>
				</div>
			</div>

			<div
				className={`mx-auto w-[95%] border-t border-gray-300/70 ${!isOpen && "md:hidden"}`}
			/>
			{/* Tabs Content */}
			{isOpen && (
				<Tabs
					className={`flex flex-col flex-1 overflow-hidden bg-gray-50/50`}
					defaultValue="general"
				>
					<div className="px-2 py-4 bg-product-background">
						<TabsList className="w-full flex bg-gray-100 p-1 rounded-lg h-auto gap-1">
							{TABS.map(({ key, icon: Icon, label }) => (
								<TabsTrigger className={tabTriggerClass} key={key} value={key}>
									<Icon className="w-4 h-4 mr-1.5" />
									<span className="text-xs">{label}</span>
								</TabsTrigger>
							))}
						</TabsList>
					</div>

					<ScrollArea className="flex-1">
						<div className="p-4">
							{TABS.map(({ key, content }) => (
								<TabsContent
									className="mt-0 focus-visible:outline-none"
									key={key}
									value={key}
								>
									{content}
								</TabsContent>
							))}
						</div>
					</ScrollArea>
				</Tabs>
			)}
		</aside>
	);
};

export default BuilderSidebar;
