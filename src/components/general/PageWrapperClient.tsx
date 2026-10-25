"use client";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { CatalogueContextProvider } from "@/context/CatalogueContext";
import { MainContextProvider } from "@/context/MainContext";
import { UserContextProvider } from "@/context/UserContext";
import { SupabaseAuthProvider } from "@/components/auth/session/SupabaseAuthProvider";
import { CookieBanner } from "@/components/general/CookieBanner";

export const PageWrapperClient = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<SupabaseAuthProvider>
			<UserContextProvider>
				<CatalogueContextProvider>
					<MainContextProvider>{children}</MainContextProvider>
				</CatalogueContextProvider>
				{/* Inside the provider: the banner reads the stored preferences
				    from the user's own row through UserContext. */}
				<CookieBanner />
			</UserContextProvider>
			<SonnerToaster />
		</SupabaseAuthProvider>
	);
};
