// app/terms-and-conditions/page.tsx

import { Metadata } from "next";
import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";

export const metadata: Metadata = generatePageMetadata("terms");

export default function TermsAndConditionsPage() {
	const termsPageSchema = getPageSchema("terms");

	return (
		<>
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(termsPageSchema) }}
				type="application/ld+json"
			/>
			<Navbar />
			<div className="max-w-3xl mx-auto px-4 py-36">
				<h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>

				<p className="mb-4">
					Welcome to Quicktalog (
					<a
						className="text-product-primary underline"
						href="https://www.quicktalog.app"
					>
						quicktalog.app
					</a>
					), your go-to software-as-a-service (SaaS) platform for creating and
					sharing mobile-friendly digital catalogs. By using our service, you
					agree to these terms. If you don't agree, please don't use the
					platform.
				</p>

				{/* --- Paddle Merchant of Record Clause (Crucial) --- */}
				<p className="mb-6 font-semibold p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800">
					Our order process is conducted by our online reseller Paddle.com.
					Paddle.com is the Merchant of Record for all our orders. Paddle
					provides all customer service inquiries and handles returns.
				</p>

				<h2 className="text-xl font-bold mt-8 mb-4">
					1. Order & Payment Policy
				</h2>
				<ul className="list-disc list-inside space-y-2">
					<li>
						All purchases for Quicktalog products and subscription plans must be
						made directly through our official website (
						<a
							className="text-product-primary underline"
							href="https://www.quicktalog.app"
						>
							quicktalog.app
						</a>
						).
					</li>
					<li>
						We <strong>never</strong> send direct product checkout links as a
						means to collect payment. All transactions must be initiated by the
						buyer through our website's secure checkout process.
					</li>
					<li>
						For your security and PCI DSS compliance, we <strong>never</strong>{" "}
						store or have access to your credit card details. All payment
						information is securely processed by Paddle.com.
					</li>
					<li>
						Before you finalize a purchase, we'll clearly present the product or
						subscription plan you're buying, including the total price and any
						recurring billing details if it's a subscription. This ensures you
						know exactly what you're committing to.
					</li>
					<li>
						To proceed with a purchase, you will be required to explicitly{" "}
						<strong>
							accept these Terms & Conditions and our Refund Policy
						</strong>
						.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">
					2. Product Descriptions & Transparency
				</h2>
				<ul className="list-disc list-inside space-y-2">
					<li>
						Every product and plan page on our website clearly details the
						features, capabilities, and any limitations of the Quicktalog
						service.
					</li>
					<li>
						We ensure that all product descriptions within our Paddle dashboard
						are consistent with what's displayed on our website, maintaining
						full compliance and transparency.
					</li>
					<li>
						If you have any questions or need clarification on a product's
						capabilities before purchasing, please contact our support team.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">
					3. Correcting Order Errors
				</h2>
				<ul className="list-disc list-inside space-y-2">
					<li>
						Before completing your purchase, you'll have the opportunity to
						review and modify your order details in the shopping cart or
						checkout summary.
					</li>
					<li>
						If you discover an error in your order immediately after purchase,
						please contact us at{" "}
						<a className="underline" href="mailto:quicktalog@outlook.com">
							quicktalog@outlook.com
						</a>{" "}
						within 48 hours for assistance with resolution.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">4. Refund Policy</h2>
				<ul className="list-disc list-inside space-y-2">
					<li>
						We offer a <strong>10-day money-back guarantee</strong> for all
						Quicktalog purchases.
					</li>
					<li>
						For detailed information on how to request a refund and the
						conditions that apply, please refer to our dedicated{" "}
						<a className="underline" href="/refund-policy">
							Refund Policy
						</a>{" "}
						page.
					</li>
					<li>
						To initiate a refund request, you may contact Paddle directly
						through their buyer support portal at{" "}
						<a className="underline" href="https://paddle.net">
							paddle.net
						</a>
						, or reach out to us at{" "}
						<a className="underline" href="mailto:quicktalog@outlook.com">
							quicktalog@outlook.com
						</a>
						.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">
					5. Product Fulfillment & Activation
				</h2>
				<ul className="list-disc list-inside space-y-2">
					<li>
						Upon successful completion of payment, you will receive immediate,
						uninterrupted access to the Quicktalog platform.
					</li>
					<li>
						Account activation details and onboarding instructions will be sent
						to your registered email address and displayed on the purchase
						success screen.
					</li>
					<li>
						Should you encounter any issues accessing your account or the
						platform immediately after purchase, please contact us without
						delay.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">
					6. Buyer Support & Contact Details
				</h2>
				<ul className="list-disc list-inside space-y-2">
					<li>
						<strong>Support Email:</strong>{" "}
						<a className="underline" href="mailto:quicktalog@outlook.com">
							quicktalog@outlook.com
						</a>
					</li>
					{/* Ensure this is a live, functional number */}
					<li>
						We aim to respond to all support inquiries within 1 business day.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">
					7. Prohibited Activities & Sales Conduct
				</h2>
				<ul className="list-disc list-inside space-y-2">
					<li>
						We are committed to fair and ethical practices. We do not engage in
						misleading, deceptive, or unethical sales or marketing tactics.
					</li>
					<li>
						We do not sell any products or services that are listed on Paddle's
						unsupported products list or that violate any of Paddle's policies.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">
					8. Compliance & Policy Updates
				</h2>
				<ul className="list-disc list-inside space-y-2">
					<li>
						Your credit card statement will clearly show "Quicktalog" as the
						transaction descriptor, making it easy to recognize your purchase.
						This can be configured in your Paddle dashboard under Checkout
						&rarr; Checkout Settings &rarr; Transactions.
					</li>
					<li>
						We commit to promptly notifying Paddle of any changes to our refund
						policy, product terms and conditions, or contact details, and we
						will update our website accordingly to reflect these changes.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">9. Legal Agreement</h2>
				<p>
					By using Quicktalog, you agree to be bound by these Terms & Conditions
					and any applicable local laws. If you do not agree with any part of
					these terms, please discontinue using the platform.
				</p>

				<h2 className="text-xl font-bold mt-8 mb-4">10. Contact Us</h2>
				<p>
					If you have any questions regarding these Terms & Conditions, please
					don't hesitate to reach out to us at{" "}
					<a className="underline" href="mailto:quicktalog@outlook.com">
						quicktalog@outlook.com
					</a>
					.
				</p>
			</div>
			<Footer />
		</>
	);
}
