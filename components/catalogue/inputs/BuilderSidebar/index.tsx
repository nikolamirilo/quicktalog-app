"use client";

import {
	Eye,
	FileText,
	Home,
	Layout,
	Palette,
	Rocket,
	Save,
} from "lucide-react";
import React, { useState } from "react";
import { LuChevronsLeft, LuChevronsRight } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AppearanceTab from "./AppearanceTab";
import FooterTab from "./FooterTab";
import GeneralTab from "./GeneralTab";
import HeaderTab from "./HeaderTab";
import ActionButtons from "./ActionButtons";

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
	"rounded-none border-transparent data-[state=active]:border-2 data-[state=active]:border-product-primary data-[state=active]:bg-product-hover-background  data-[state=active]:font-bold data-[state=active]:rounded-lg";

const BuilderSidebar: React.FC<SidebarProps> = ({ defaultOpen = false }) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<aside
			className={`fixed bg-product-background right-0 top-0 h-screen p-2 shadow-lg z-50 transition-all duration-300 flex flex-col ${
				isOpen ? "w-fit" : "w-16"
			}`}
		>
			{/* Top actions */}
			<div
				className={`flex justify-around items-center p-3 ${isOpen ? "flex-row gap-2" : "flex-col gap-4"}`}
			>
				<Button
					onClick={() => setIsOpen((v) => !v)}
					size={isOpen ? "sm" : "icon"}
					variant="grayed"
				>
					{isOpen ? (
						<LuChevronsRight size={25} />
					) : (
						<LuChevronsLeft size={25} />
					)}
				</Button>
				<span
					className={`border-gray-400 ${isOpen ? "border-r h-6" : "border-b w-full"}`}
				></span>

				<ActionButtons isOpen={isOpen} />
			</div>

			{/* Tabs */}
			{isOpen && (
				<Tabs
					className="flex flex-col flex-1 overflow-hidden border-t-[1.5px] pt-3 border-gray-400"
					defaultValue="general"
				>
					<TabsList className="w-full justify-around bg-transparent p-0 gap-1 h-auto">
						{TABS.map(({ key, icon: Icon, label }) => (
							<TabsTrigger className={tabTriggerClass} key={key} value={key}>
								<Icon className="w-4 h-4 mr-1" />
								<span style={{ fontSize: "12px" }}>{label}</span>
							</TabsTrigger>
						))}
					</TabsList>

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
