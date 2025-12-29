"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { MainContextProvider } from "@/context/MainContext";
import { UserContextProvider } from "@/context/UserContext";
import CookieBanner from "../common/CookieBanner";
import { Toaster } from "../ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { CatalogueContextProvider } from "@/context/CatalogueContext";

export const PageWrapperClient = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<ClerkProvider
			afterSignOutUrl="/"
			signInUrl="/auth"
			signUpUrl="/auth?mode=signup"
		>
			<UserContextProvider>
				<CatalogueContextProvider>
					<MainContextProvider>{children}</MainContextProvider>
				</CatalogueContextProvider>
			</UserContextProvider>
			<CookieBanner />
			<Toaster />
			<SonnerToaster />
		</ClerkProvider>
	);
};
