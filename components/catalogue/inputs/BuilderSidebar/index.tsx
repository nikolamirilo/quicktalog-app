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
import { TabKey } from "@/types/components";
import ActionButtons from "./ActionButtons";
import AppearanceTab from "./AppearanceTab";
import FooterTab from "./FooterTab";
import GeneralTab from "./GeneralTab";
import HeaderTab from "./HeaderTab";

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

const BuilderSidebar: React.FC = ({ defaultOpen = false }: { defaultOpen?: boolean }) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<aside
			className={`!z-[1000] fixed bg-product-background shadow-xl flex 
    bottom-0 left-0 w-full flex-col-reverse
    ${isOpen ? "h-[100dvh]" : "h-auto"}
    md:right-0 md:top-0 md:h-screen md:flex-col md:left-auto md:w-auto
    ${isOpen ? "md:w-fit md:max-w-[500px]" : "md:w-16"}
    
    transition-[width,max-width,height,transform]
    duration-500
    [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]
    [&]:md:[transition-duration:800ms,800ms,500ms,500ms]
    
    ${isOpen
					? "translate-y-0 md:translate-x-0"
					: "translate-y-0 md:translate-x-0"
				}
  `}
		>
			{/* Backdrop blur overlay for mobile when open */}
			{isOpen && (
				<div
					className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 transition-opacity duration-300"
					onClick={() => setIsOpen(false)}
					style={{
						animation: "fadeIn 0.3s ease-out",
					}}
				/>
			)}

			<div
				className={`relative flex items-center pt-3 pb-3 px-2 sm:px-4 justify-around md:justify-around bg-product-background rounded-none shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.12)] md:shadow-none border-t border-gray-100 md:border-t-0
          /* Mobile: Row, height fits content */
          w-full flex-row
          
          /* Desktop: Column when closed, Row when open */
          ${isOpen ? "md:flex-row md:gap-2 md:py-3" : "md:flex-col md:gap-4 md:py-3"}
          
          /* Smooth transitions */
          transition-all duration-300 ease-in-out
        `}
			>
				{/* Mobile Toggle Button (Centered, overlapping top edge) */}
				<button
					onClick={() => setIsOpen((v) => !v)}
					className="md:hidden absolute -top-8 left-1/2 -translate-x-1/2 w-[3.5rem] h-[3.5rem] flex justify-center items-center bg-product-primary text-white rounded-full shadow-sm outline-none border-none focus:outline-none hover:bg-product-primary/90 transition-transform active:scale-95 z-[1010]"
					style={{ WebkitTapHighlightColor: "transparent" }}
					title="Toggle Sidebar"
				>
					{isOpen ? <LuChevronsDown size={32} /> : <LuChevronsUp size={32} />}
				</button>

				<Button
					onClick={() => setIsOpen((v) => !v)}
					size={isOpen ? "sm" : "icon"}
					variant="grayed"
					className="ml-auto md:ml-0 md:flex hidden hover:scale-105 active:scale-95 transition-transform duration-200"
				>
					{/* Desktop Icons */}
					<div className="hidden md:block">
						{isOpen ? (
							<LuChevronsRight size={25} />
						) : (
							<LuChevronsLeft size={25} />
						)}
					</div>
				</Button>
				<span
					className={`border-gray-300/70 hidden md:block transition-all duration-300
            ${isOpen ? "border-r h-6" : "border-b w-full"}
          `}
				></span>

				{/* Mobile: ActionButtons usually on left/center. Desktop: Top/Center */}
				<div className="flex md:contents w-full justify-around md:w-auto md:justify-start gap-1.5 sm:gap-2.5 items-center">
					<ActionButtons isOpen={isOpen} setIsOpen={setIsOpen} />
				</div>
			</div>

			<div
				className={`mx-auto w-[95%] border-t border-gray-300/70 transition-opacity duration-300 ${!isOpen && "md:hidden"}`}
			/>
			{/* Tabs Content */}
			{isOpen && (
				<Tabs
					className={`flex flex-col flex-1 overflow-hidden bg-product-background md:bg-gray-50/50 
            /* Slide and fade in animation */
            animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-500
          `}
					defaultValue="general"
				>
					<div
						className="px-2 py-4 bg-product-background transition-all duration-300"
						style={{
							animation: "slideDown 0.4s ease-out 0.1s both",
						}}
					>
						<TabsList className="w-full flex bg-gray-100 p-1 rounded-lg h-auto gap-1">
							{TABS.map(({ key, icon: Icon, label }, index) => (
								<TabsTrigger
									className={tabTriggerClass}
									key={key}
									value={key}
									style={{
										animation: `fadeInScale 0.3s ease-out ${0.1 + index * 0.05}s both`,
									}}
								>
									<Icon className="w-4 h-4 mr-1.5" />
									<span className="text-xs">{label}</span>
								</TabsTrigger>
							))}
						</TabsList>
					</div>
					<div
						className={`mx-auto w-[95%] border-t border-gray-300/70 ${!isOpen && "md:hidden"}`}
					/>

					<ScrollArea className="flex-1">
						<div
							className="p-4"
							style={{
								animation: "fadeInUp 0.5s ease-out 0.2s both",
							}}
						>
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
