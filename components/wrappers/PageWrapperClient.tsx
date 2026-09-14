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
	const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
	const tree = (
		<>
			<UserContextProvider>
				<CatalogueContextProvider>
					<MainContextProvider>{children}</MainContextProvider>
				</CatalogueContextProvider>
			</UserContextProvider>
			<CookieBanner />
			<Toaster />
			<SonnerToaster />
		</>
	);

	if (!publishableKey) {
		return tree;
	}

	return (
		<ClerkProvider
			afterSignOutUrl="/"
			signInUrl="/auth"
			signUpUrl="/auth?mode=signup"
		>
			{tree}
		</ClerkProvider>
	);
};
