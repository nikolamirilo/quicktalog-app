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

type TabKey = "general" | "header" | "footer" | "appearance";

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
	"border-transparent data-[state=active]:border-2 data-[state=active]:border-product-primary data-[state=active]:bg-product-hover-background  data-[state=active]:font-bold rounded-lg";

const BuilderSidebar: React.FC<SidebarProps> = ({ defaultOpen = false }) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<aside
			className={`fixed bg-product-background shadow-lg z-50 transition-all duration-300 flex 
        /* Mobile: Bottom App Bar */
        bottom-0 left-0 w-full flex-col-reverse
        ${isOpen ? "h-[100dvh]" : "h-auto"}
        
        /* Desktop: Right Sidebar */
        md:right-0 md:top-0 md:h-screen md:flex-col md:left-auto md:w-auto
        ${isOpen ? "md:w-fit" : "md:w-16"}
      `}
		>
			{/* Mobile Actions / Desktop Top actions */}
			<div
				className={`flex items-center p-3 justify-around md:justify-around
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
					className="ml-auto md:ml-0 md:flex hidden"
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
					className={`border-gray-400 hidden md:block
            ${isOpen ? "border-r h-6" : "border-b w-full"}
          `}
				></span>

				{/* Mobile: ActionButtons usually on left/center. Desktop: Top/Center */}
				<div className="flex md:contents w-full justify-around md:w-auto md:justify-start gap-2 items-center">
					<ActionButtons isOpen={isOpen} />
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

			{/* Tabs Content */}
			{isOpen && (
				<Tabs
					className={`flex flex-col flex-1 overflow-hidden 
            border-b-[1.5px] pb-3 md:border-b-0 md:pb-0 md:border-t-[1.5px] md:pt-3 border-gray-400
          `}
					defaultValue="general"
				>
					<TabsList className="w-full justify-around bg-transparent p-0 py-4 md:py-0 px-3 gap-2 h-auto">
						{TABS.map(({ key, icon: Icon, label }) => (
							<TabsTrigger className={tabTriggerClass} key={key} value={key}>
								<Icon className="w-4 h-4 mr-1" />
								<span style={{ fontSize: "12px" }}>{label}</span>
							</TabsTrigger>
						))}
					</TabsList>
					<div className="md:hidden w-full h-[1px] bg-gray-400 my-2"></div>
					<ScrollArea className="flex-1">
						<div className="p-4">
							{TABS.map(({ key, content }) => (
								<TabsContent className="mt-0" key={key} value={key}>
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
