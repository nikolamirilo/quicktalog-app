"use client";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { CatalogueContextProvider } from "@/context/CatalogueContext";
import { MainContextProvider } from "@/context/MainContext";
import { UserContextProvider } from "@/context/UserContext";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CookieBanner } from "@/components/general/CookieBanner";

export const PageWrapperClient = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<AuthProvider>
			<UserContextProvider>
				<CatalogueContextProvider>
					<MainContextProvider>{children}</MainContextProvider>
				</CatalogueContextProvider>
				{/* Inside the provider: the banner reads the stored preferences
				    from the user's own row through UserContext. */}
				<CookieBanner />
			</UserContextProvider>
			<SonnerToaster />
		</AuthProvider>
	);
};
