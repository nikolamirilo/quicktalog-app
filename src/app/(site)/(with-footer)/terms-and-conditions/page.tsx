import { Metadata } from "next";
import { textLinkClass } from "@/components/general/TextLink";
import { LegalCallout } from "@/components/legal/LegalCallout";
import { LegalPage } from "@/components/legal/LegalPage";
import type { LegalSectionContent } from "@/components/legal/LegalSection";
import { footerDetails } from "@/constants/details";
import { generatePageMetadata } from "@/constants/metadata";

export const metadata: Metadata = generatePageMetadata("terms");

const SITE_LINK = (
	<a className={textLinkClass} href="https://www.quicktalog.app">
		quicktalog.app
	</a>
);
const EMAIL_LINK = (
	<a className={textLinkClass} href={`mailto:${footerDetails.email}`}>
		{footerDetails.email}
	</a>
);

const sections: LegalSectionContent[] = [
	{
		id: "terms-definitions",
		title: "Definitions",
		content: (
			<>
				<p>For clarity throughout this document:</p>
				<ul>
					<li>
						<strong>"Quicktalog", "we", "us", or "our"</strong> refers to the
						Quicktalog platform and its operators.
					</li>
					<li>
						<strong>"User", "you", or "your"</strong> refers to any person or
						business that creates an account or uses the Service.
					</li>
					<li>
						<strong>"Service"</strong> refers to the Quicktalog platform,
						including the website, the catalog builder, hosted catalog pages,
						and any related tools or features.
					</li>
					<li>
						<strong>"Catalog"</strong> refers to the digital catalog content
						created by a user using the Service.
					</li>
					<li>
						<strong>"Subscription"</strong> refers to any paid plan that grants
						continued access to the Service.
					</li>
				</ul>
			</>
		),
	},
	{
		id: "terms-eligibility",
		title: "Eligibility & Account Registration",
		content: (
			<>
				<p>
					To use Quicktalog you must be at least 16 years old, or the minimum
					age required in your country to enter into a binding agreement,
					whichever is higher. By creating an account you confirm that the
					information you provide is accurate and that you're authorised to act
					on behalf of any business you register.
				</p>
				<p>
					You're responsible for keeping your login credentials secure and for
					all activity that happens under your account. Please notify us
					immediately if you suspect unauthorised access or any breach of
					security.
				</p>
			</>
		),
	},
	{
		id: "terms-orders",
		title: "Order & Payment Policy",
		content: (
			<ul>
				<li>
					All purchases for Quicktalog products and subscription plans must be
					made directly through our official website ({SITE_LINK}).
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
					<strong>accept these Terms & Conditions and our Refund Policy</strong>
					.
				</li>
			</ul>
		),
	},
	{
		id: "terms-descriptions",
		title: "Product Descriptions & Transparency",
		content: (
			<ul>
				<li>
					Every product and plan page on our website clearly details the
					features, capabilities, and any limitations of the Quicktalog service.
				</li>
				<li>
					We ensure that all product descriptions within our Paddle dashboard
					are consistent with what's displayed on our website, maintaining full
					compliance and transparency.
				</li>
				<li>
					If you have any questions or need clarification on a product's
					capabilities before purchasing, please contact our support team.
				</li>
			</ul>
		),
	},
	{
		id: "terms-errors",
		title: "Correcting Order Errors",
		content: (
			<ul>
				<li>
					Before completing your purchase, you'll have the opportunity to review
					and modify your order details in the shopping cart or checkout
					summary.
				</li>
				<li>
					If you discover an error in your order immediately after purchase,
					please contact us at {EMAIL_LINK} within 48 hours for assistance with
					resolution.
				</li>
			</ul>
		),
	},
	{
		id: "terms-refunds",
		title: "Refund Policy",
		content: (
			<ul>
				<li>
					We offer a <strong>10-day money-back guarantee</strong> for all
					Quicktalog purchases.
				</li>
				<li>
					For detailed information on how to request a refund and the conditions
					that apply, please refer to our dedicated{" "}
					<a className={textLinkClass} href="/refund-policy">
						Refund Policy
					</a>{" "}
					page.
				</li>
				<li>
					To initiate a refund request, you may contact Paddle directly through
					their buyer support portal at{" "}
					<a className={textLinkClass} href="https://paddle.net">
						paddle.net
					</a>
					, or reach out to us at {EMAIL_LINK}.
				</li>
			</ul>
		),
	},
	{
		id: "terms-fulfillment",
		title: "Product Fulfillment & Activation",
		content: (
			<ul>
				<li>
					Upon successful completion of payment, you will receive immediate,
					uninterrupted access to the Quicktalog platform.
				</li>
				<li>
					Account activation details and onboarding instructions will be sent to
					your registered email address and displayed on the purchase success
					screen.
				</li>
				<li>
					Should you encounter any issues accessing your account or the platform
					immediately after purchase, please contact us without delay.
				</li>
			</ul>
		),
	},
	{
		id: "terms-subscriptions",
		title: "Subscriptions, Renewals & Price Changes",
		content: (
			<>
				<p>
					Paid subscriptions renew automatically at the end of each billing
					period unless cancelled before the renewal date. You can cancel a
					subscription at any time through your account settings or by
					contacting support. Cancellation takes effect at the end of the
					current billing period, and you'll retain access until then.
				</p>
				<p>
					We may change subscription prices or plan features from time to time.
					When we do, we'll notify active subscribers by email at least 30 days
					before the change takes effect. If you don't accept the new price, you
					may cancel before the next renewal.
				</p>
			</>
		),
	},
	{
		id: "terms-license",
		title: "License to Use Quicktalog",
		content: (
			<p>
				Subject to these terms and your compliance with them, we grant you a
				limited, non-exclusive, non-transferable, revocable license to access
				and use Quicktalog for your own business or personal use. This license
				does not allow you to resell the Service, copy or mirror the platform,
				reverse-engineer it, or use it to build a competing product.
			</p>
		),
	},
	{
		id: "terms-content",
		title: "Your Content & Ownership",
		content: (
			<>
				<p>
					You retain full ownership of the content you upload to Quicktalog,
					including product descriptions, images, pricing, and any other catalog
					material (<strong>"Your Content"</strong>). By uploading Your Content,
					you grant us a worldwide, non-exclusive, royalty-free license to host,
					store, display, reproduce, and deliver Your Content solely to operate
					the Service, including showing your catalog to people you share it
					with. This license ends when you delete the content or close your
					account, except where retention is required by law or for backup
					purposes.
				</p>
				<p>
					If you are on a <strong>free plan</strong>, you additionally grant us
					a non-exclusive, royalty-free license to display, reproduce, and
					reference your catalog (including its name, appearance, and publicly
					visible content) in our marketing materials, website, social media,
					and other promotional channels for the purpose of showcasing the
					Service. We will not present your catalog in a misleading way or
					attribute it to someone else. You can opt out of this at any time by
					upgrading to a paid plan or by contacting us at {EMAIL_LINK}.
				</p>
				<p>
					You're solely responsible for Your Content. You confirm that you have
					the rights to upload, display, and share everything you add to your
					catalogs, and that none of it infringes the rights of any third party
					or violates any law.
				</p>
			</>
		),
	},
	{
		id: "terms-ip",
		title: "Our Intellectual Property",
		content: (
			<p>
				The Quicktalog name, logo, platform design, source code, documentation,
				and all related materials are owned by Quicktalog or its licensors.
				Nothing in these terms transfers any ownership or rights in our
				intellectual property to you. You agree not to copy, modify, or use our
				branding without our written permission.
			</p>
		),
	},
	{
		id: "terms-availability",
		title: "Service Availability & Modifications",
		content: (
			<>
				<p>
					We aim to keep Quicktalog available at all times, but we don't
					guarantee uninterrupted or error-free service. Maintenance windows,
					third-party outages, security incidents, or other circumstances may
					cause temporary downtime.
				</p>
				<p>
					We may add, change, or remove features of the Service at any time. For
					significant changes that affect how you use the platform, we'll give
					reasonable notice through the platform or by email.
				</p>
			</>
		),
	},
	{
		id: "terms-communications",
		title: "Service Communications",
		content: (
			<>
				<p>
					By creating an account with Quicktalog, you agree to receive
					service-related communications from us, including:
				</p>
				<ul>
					<li>product announcements and new feature releases</li>
					<li>platform updates and maintenance notices</li>
					<li>security alerts and account notifications</li>
					<li>billing and subscription communications</li>
					<li>customer support responses</li>
					<li>
						other transactional messages necessary to operate your account
					</li>
				</ul>
				<p>
					These communications are part of the Service and are separate from
					optional marketing emails such as newsletters or promotional offers.
					Marketing communications require your explicit consent, and you can
					unsubscribe from them at any time using the link in those emails or
					through your account settings.
				</p>
			</>
		),
	},
	{
		id: "terms-support",
		title: "Buyer Support & Contact Details",
		content: (
			<ul>
				<li>
					<strong>Support Email:</strong> {EMAIL_LINK}
				</li>
				<li>
					We aim to respond to all support inquiries within 1 business day.
				</li>
			</ul>
		),
	},
	{
		id: "terms-prohibited-content",
		title: "Prohibited Content & Automatic Deletion",
		content: (
			<>
				<p>
					Quicktalog is committed to maintaining a safe and lawful platform. The
					following types of content are strictly prohibited from being uploaded
					or shared through catalogs created on our platform:
				</p>
				<ul>
					<li>
						<strong>Illegal products or services:</strong> Any content promoting
						illegal goods, services, or activities including but not limited to
						drugs, weapons, explosives, or stolen goods.
					</li>
					<li>
						<strong>Adult or sexually explicit content:</strong> Pornography,
						nudity, escort services, prostitution, sexual services, or any
						sexually explicit material.
					</li>
					<li>
						<strong>Violence and harm:</strong> Content that promotes,
						glorifies, or incites violence, self-harm, or harm to others.
					</li>
					<li>
						<strong>Hate speech and discrimination:</strong> Content that
						promotes hatred, discrimination, or harassment based on race,
						ethnicity, religion, gender, sexual orientation, disability, or any
						other protected characteristic.
					</li>
					<li>
						<strong>Child exploitation:</strong> Any content involving minors in
						inappropriate, exploitative, or harmful situations.
					</li>
					<li>
						<strong>Any other illegal, harmful, or unethical content:</strong>{" "}
						Any content that violates local, state, national, or international
						laws, or that we determine to be harmful, offensive, or contrary to
						our community standards and values.
					</li>
				</ul>
				<LegalCallout tone="danger">
					<strong>Automatic Deletion Policy:</strong> Catalogs found to contain
					any prohibited content will be automatically deleted from our platform
					without prior notice. Users who repeatedly violate this policy may
					have their accounts permanently suspended. We reserve the right to
					report illegal content to appropriate law enforcement authorities.
				</LegalCallout>
			</>
		),
	},
	{
		id: "terms-prohibited-activities",
		title: "Prohibited Activities & Sales Conduct",
		content: (
			<ul>
				<li>
					We are committed to fair and ethical practices. We do not engage in
					misleading, deceptive, or unethical sales or marketing tactics.
				</li>
				<li>
					We do not sell any products or services that are listed on Paddle's
					unsupported products list or that violate any of Paddle's policies.
				</li>
			</ul>
		),
	},
	{
		id: "terms-third-party",
		title: "Third-Party Services & Limitation of Liability",
		content: (
			<>
				<p>
					Quicktalog relies on third-party service providers, including but not
					limited to Supabase, Vercel, Clerk, AWS, Cloudflare and Paddle, for
					hosting, authentication, data storage, payment processing, and other
					platform functionality. While we take reasonable steps to maintain a
					reliable service, we do not control the availability, performance, or
					security of these external providers.
				</p>
				<p>
					In the event of downtime, service interruption, degraded performance,
					or failure caused directly or indirectly by these providers,
					Quicktalog is not legally liable or responsible for any loss, damages,
					or service unavailability resulting from such third-party issues.
				</p>
				<p>
					By using the platform, you acknowledge and agree that temporary
					disruptions or outages may occur and that such interruptions do not
					constitute a breach of these Terms & Conditions.
				</p>
			</>
		),
	},
	{
		id: "terms-termination",
		title: "Account Suspension & Termination",
		content: (
			<>
				<p>
					We may suspend or terminate your account if you breach these terms,
					use the Service in a way that harms other users or third parties, fail
					to pay fees due, or if we're required to do so by law. Where
					reasonable, we'll notify you before suspension and give you a chance
					to resolve the issue. For severe violations such as uploading
					prohibited content, suspension or termination may be immediate.
				</p>
				<p>
					You may close your account at any time through account settings or by
					contacting support. Upon termination, your right to use the Service
					ends immediately. Sections of these terms that by their nature should
					survive termination (for example, intellectual property, disclaimers,
					limitation of liability, and indemnification) will continue to apply.
				</p>
			</>
		),
	},
	{
		id: "terms-warranties",
		title: "Disclaimer of Warranties",
		content: (
			<p>
				The Service is provided <strong>"as is"</strong> and{" "}
				<strong>"as available"</strong> without warranties of any kind, whether
				express or implied. To the maximum extent permitted by law, we disclaim
				all warranties including merchantability, fitness for a particular
				purpose, and non-infringement. We do not warrant that the Service will
				meet your specific needs, be uninterrupted, timely, secure, or
				error-free.
			</p>
		),
	},
	{
		id: "terms-liability",
		title: "General Limitation of Liability",
		content: (
			<p>
				This section extends the third-party liability limitation in section 17
				to cover any claim related to the Service. To the maximum extent
				permitted by law, Quicktalog and its owners, employees, and affiliates
				will not be liable for any indirect, incidental, consequential, special,
				or punitive damages, including loss of profits, data, goodwill, or
				business opportunities, arising from your use of the Service. Our total
				liability for any claim related to the Service, regardless of the legal
				theory, will not exceed the amount you paid to us for the Service during
				the 12 months before the claim arose, or 100 USD, whichever is greater.
			</p>
		),
	},
	{
		id: "terms-indemnification",
		title: "Indemnification",
		content: (
			<p>
				You agree to defend, indemnify, and hold Quicktalog harmless from any
				claim, loss, damage, or expense (including reasonable legal fees)
				arising from Your Content, your use of the Service, your breach of these
				terms, or your violation of any law or third-party right.
			</p>
		),
	},
	{
		id: "terms-law",
		title: "Governing Law & Jurisdiction",
		// TODO: Replace [JURISDICTION] and [CITY / COUNTRY] with actual values based on where Reactify Solutions is registered
		content: (
			<p>
				These terms are governed by the laws of <strong>[JURISDICTION]</strong>.
				Any dispute arising from or related to these terms or the Service will
				be subject to the exclusive jurisdiction of the courts located in{" "}
				<strong>[CITY / COUNTRY]</strong>. If you are a consumer in the European
				Union or United Kingdom, you retain any mandatory rights granted by the
				laws of your country of residence.
			</p>
		),
	},
	{
		id: "terms-changes",
		title: "Changes to These Terms",
		content: (
			<p>
				We may update these Terms & Conditions from time to time. When we make
				material changes, we'll notify you through the platform or by email at
				least 15 days before the changes take effect. Your continued use of the
				Service after the changes take effect means that you accept the updated
				terms. If you don't agree, you may close your account before the changes
				become effective.
			</p>
		),
	},
	{
		id: "terms-force-majeure",
		title: "Force Majeure",
		content: (
			<p>
				We will not be held liable for any failure or delay in performing our
				obligations caused by events outside our reasonable control, including
				natural disasters, war, terrorism, civil unrest, internet or
				infrastructure outages, cyber attacks, or actions by governments or
				regulators.
			</p>
		),
	},
	{
		id: "terms-severability",
		title: "Severability & Entire Agreement",
		content: (
			<p>
				If any part of these terms is found to be unenforceable by a court of
				competent jurisdiction, the remaining parts will continue in full
				effect. These Terms & Conditions, together with our{" "}
				<a className={textLinkClass} href="/privacy-policy">
					Privacy Policy
				</a>{" "}
				and{" "}
				<a className={textLinkClass} href="/refund-policy">
					Refund Policy
				</a>
				, make up the entire agreement between you and Quicktalog regarding the
				Service.
			</p>
		),
	},
	{
		id: "terms-compliance",
		title: "Compliance & Policy Updates",
		content: (
			<ul>
				<li>
					Your credit card statement will clearly show "Quicktalog" as the
					transaction descriptor, making it easy to recognize your purchase.
					This can be configured in your Paddle dashboard under Checkout &rarr;
					Checkout Settings &rarr; Transactions.
				</li>
				<li>
					We commit to promptly notifying Paddle of any changes to our refund
					policy, product terms and conditions, or contact details, and we will
					update our website accordingly to reflect these changes.
				</li>
			</ul>
		),
	},
	{
		id: "terms-agreement",
		title: "Legal Agreement",
		content: (
			<p>
				By using Quicktalog, you agree to be bound by these Terms & Conditions
				and any applicable local laws. If you do not agree with any part of
				these terms, please discontinue using the platform.
			</p>
		),
	},
	{
		id: "terms-contact",
		title: "Contact Us",
		content: (
			<p>
				If you have any questions regarding these Terms & Conditions, please
				don't hesitate to reach out to us at {EMAIL_LINK}.
			</p>
		),
	},
];

export default function TermsAndConditionsPage() {
	return (
		<LegalPage
			current="terms"
			intro={
				// Paddle's Merchant of Record clause: required, keep it prominent.
				<LegalCallout>
					Our order process is conducted by our online reseller Paddle.com.
					Paddle.com is the Merchant of Record for all our orders. Paddle
					provides all customer service inquiries and handles returns.
				</LegalCallout>
			}
			lead={
				<>
					Welcome to Quicktalog ({SITE_LINK}), your go-to software-as-a-service
					(SaaS) platform for creating and sharing mobile-friendly digital
					catalogs. By using our service, you agree to these terms. If you don't
					agree, please don't use the platform.
				</>
			}
			sections={sections}
			title="Terms & Conditions"
			updated="2026-09-29"
		/>
	);
}
