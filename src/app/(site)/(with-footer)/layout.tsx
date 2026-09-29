import { Footer } from "@/components/navigation/Footer";

export default function WithFooterLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<main id="main">{children}</main>
			<Footer />
		</>
	);
}
