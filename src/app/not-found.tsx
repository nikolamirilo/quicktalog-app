import { Footer } from "@/components/navigation/Footer";
import { Navbar } from "@/components/navigation/Navbar";
import { MissingPath } from "@/components/status/MissingPath";
import { StatusScreen } from "@/components/status/StatusScreen";
import { Button } from "@/components/ui/button";
import { ArrowRight, HelpCircle, House, Search } from "lucide-react";
import Link from "next/link";

export const metadata = {
	title: "Page Not Found - Quicktalog",
	description:
		"The page you're looking for doesn't exist. Return to our homepage to create your digital catalog.",
};

const quickLinks = [
	{ text: "Pricing", url: "/pricing" },
	{ text: "Showcases", url: "/showcases" },
	{ text: "Try demo", url: "/demo" },
	{ text: "Docs", url: "/docs" },
	{ text: "Contact", url: "/contact" },
];

/**
 * The root not-found boundary sits outside the (site) layout, so it renders
 * its own navbar and footer.
 */
export default function NotFound() {
	return (
		<>
			<Navbar />
			<main id="main">
				<StatusScreen
					actions={
						<>
							<Button asChild className="group">
								<Link href="/">
									<House aria-hidden="true" />
									Return home
									<ArrowRight
										aria-hidden="true"
										className="transition-transform group-hover:translate-x-[3px]"
									/>
								</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href="/help">
									<HelpCircle aria-hidden="true" />
									Visit the Help Center
								</Link>
							</Button>
						</>
					}
					description="Oops! The page you're looking for seems to have wandered off. Let's get you back to creating amazing digital catalogs."
					detail={<MissingPath />}
					digits={["4", "4"]}
					eyebrow="Error 404"
					icon={<Search />}
					quickLinks={quickLinks}
					quickLinksLabel="Looking for something specific?"
					title="Page not found"
				/>
			</main>
			<Footer />
		</>
	);
}
