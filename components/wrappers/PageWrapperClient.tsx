"use client";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { CatalogueContextProvider } from "@/context/CatalogueContext";
import { MainContextProvider } from "@/context/MainContext";
import { UserContextProvider } from "@/context/UserContext";
import { ClerkProvider } from "@clerk/nextjs";
import CookieBanner from "../general/CookieBanner";
import { Toaster } from "../ui/toaster";

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
