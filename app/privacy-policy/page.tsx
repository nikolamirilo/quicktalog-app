// app/privacy-policy/page.tsx

import Footer from "@/components/navigation/Footer";
import Navbar from "@/components/navigation/Navbar";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";
import { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata("privacy");

export default function PrivacyPolicyPage() {
	const privacyPageSchema = getPageSchema("privacy");

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(privacyPageSchema) }}
			/>
			<Navbar />
			<div className="max-w-3xl mx-auto px-4 py-36">
				<h1 className="text-3xl font-bold mb-6">
					Privacy Policy for Quicktalog
				</h1>

				<p className="mb-4">
					This Privacy Policy describes how Quicktalog ("we," "us," or "our")
					collects, uses, and discloses your personal information when you use
					our software-as-a-service (SaaS) platform, Quicktalog (the "Service").
					We are committed to protecting your privacy and handling your data
					transparently.
				</p>

				<h2 className="text-xl font-bold mt-8 mb-4">
					1. Information We Collect
				</h2>
				<p className="mb-4">
					We collect information to provide and improve our Service. This
					includes:
				</p>
				<ul className="list-disc list-inside space-y-2 mb-4">
					<li>
						<strong>Account Information:</strong> When you register for
						Quicktalog, we collect your name, email address, and password.
					</li>
					<li>
						<strong>Payment Information:</strong> For purchases, we use
						Paddle.com as our Merchant of Record. We do not directly store or
						process your credit card details. Paddle securely handles all
						payment transactions in compliance with PCI DSS standards. We
						receive limited information from Paddle about your transaction
						(e.g., subscription status, transaction ID) for order fulfillment
						and support.
					</li>
					<li>
						<strong>Usage Data:</strong> We collect information about how you
						use Quicktalog, such as the features you use, the actions you take,
						and the time, frequency, and duration of your activities. This helps
						us understand how our service is used and where we can improve.
					</li>
					<li>
						<strong>Technical Data:</strong> We automatically collect
						information about your device and browser, including IP address,
						browser type, operating system, and unique device identifiers.
					</li>
					<li>
						<strong>Communication Data:</strong> If you contact us, we'll keep
						records of our correspondence.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">
					2. How We Use Your Information
				</h2>
				<p className="mb-4">
					We use the collected information for the following purposes:
				</p>
				<ul className="list-disc list-inside space-y-2 mb-4">
					<li>To provide, operate, and maintain Quicktalog.</li>
					<li>
						To process your transactions and manage your subscriptions through
						Paddle.
					</li>
					<li>To personalize your experience and improve our Service.</li>
					<li>
						To communicate with you, including sending service updates, security
						alerts, and support messages.
					</li>
					<li>
						To monitor and analyze usage and trends to improve our marketing and
						product offerings.
					</li>
					<li>
						To detect, prevent, and address technical issues or fraudulent
						activities.
					</li>
					<li>
						To comply with legal obligations and enforce our Terms & Conditions.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">
					3. How We Share Your Information
				</h2>
				<p className="mb-4">
					We do not sell your personal information. We may share your
					information with:
				</p>
				<ul className="list-disc list-inside space-y-2 mb-4">
					<li>
						<strong>Paddle.com:</strong> As our Merchant of Record, Paddle
						receives necessary information to process payments and manage your
						purchases.
					</li>
					<li>
						<strong>Service Providers:</strong> We may share data with
						third-party vendors, consultants, and other service providers who
						perform services on our behalf (e.g., hosting, analytics, customer
						support). These providers are obligated to protect your information
						and use it only for the purposes for which it was disclosed.
					</li>
					<li>
						<strong>Legal Requirements:</strong> We may disclose your
						information if required to do so by law or in response to valid
						requests by public authorities (e.g., a court order or government
						agency).
					</li>
					<li>
						<strong>Business Transfers:</strong> In connection with a merger,
						acquisition, or sale of assets, your information may be transferred
						as part of that transaction. We will notify you of any such transfer
						and choices you may have regarding your information.
					</li>
				</ul>

				<h2 className="text-xl font-bold mt-8 mb-4">4. Data Security</h2>
				<p className="mb-4">
					We implement a variety of security measures to maintain the safety of
					your personal information. We use industry-standard encryption for
					data in transit and at rest where appropriate. While we strive to
					protect your personal information, no method of transmission over the
					Internet or method of electronic storage is 100% secure.
				</p>

				<h2 className="text-xl font-bold mt-8 mb-4">
					5. Your Data Protection Rights
				</h2>
				<p className="mb-4">
					Depending on your location, you may have the following rights
					regarding your personal data:
				</p>
				<ul className="list-disc list-inside space-y-2 mb-4">
					<li>
						<strong>Access:</strong> Request access to your personal data.
					</li>
					<li>
						<strong>Correction:</strong> Request correction of inaccurate
						personal data.
					</li>
					<li>
						<strong>Erasure:</strong> Request erasure of your personal data.
					</li>
					<li>
						<strong>Objection to Processing:</strong> Object to the processing
						of your personal data.
					</li>
					<li>
						<strong>Data Portability:</strong> Request the transfer of your
						personal data to another party.
					</li>
					<li>
						<strong>Withdraw Consent:</strong> Withdraw consent at any time
						where we are relying on consent to process your personal data.
					</li>
				</ul>
				<p className="mb-4">
					To exercise any of these rights, please contact us at{" "}
					<a
						href="mailto:quicktalog@outlook.com"
						className="text-product-primary underline"
					>
						quicktalog@outlook.com
					</a>
					.
				</p>

				<h2 className="text-xl font-bold mt-8 mb-4">
					6. Cookies and Tracking Technologies
				</h2>
				<p className="mb-4">
					Quicktalog uses cookies and similar tracking technologies to track
					activity on our Service and hold certain information. Cookies are
					files with a small amount of data that may include an anonymous unique
					identifier. You can instruct your browser to refuse all cookies or to
					indicate when a cookie is being sent. However, if you do not accept
					cookies, you may not be able to use some portions of our Service.
				</p>

				<h2 className="text-xl font-bold mt-8 mb-4">7. Third-Party Links</h2>
				<p className="mb-4">
					Our Service may contain links to other sites that are not operated by
					us. If you click on a third-party link, you will be directed to that
					third party's site. We strongly advise you to review the Privacy
					Policy of every site you visit. We have no control over and assume no
					responsibility for the content, privacy policies, or practices of any
					third-party sites or services.
				</p>

				<h2 className="text-xl font-bold mt-8 mb-4">8. Children's Privacy</h2>
				<p className="mb-4">
					Our Service is not intended for use by children under the age of 13.
					We do not knowingly collect personally identifiable information from
					anyone under the age of 13. If you are a parent or guardian and you
					are aware that your child has provided us with Personal Data, please
					contact us. If we become aware that we have collected Personal Data
					from children without verification of parental consent, we take steps
					to remove that information from our servers.
				</p>

				<h2 className="text-xl font-bold mt-8 mb-4">
					9. Changes to This Privacy Policy
				</h2>
				<p className="mb-4">
					We may update our Privacy Policy from time to time. We will notify you
					of any changes by posting the new Privacy Policy on this page and
					updating the "Last Updated" date at the top of this Privacy Policy.
					You are advised to review this Privacy Policy periodically for any
					changes. Changes to this Privacy Policy are effective when they are
					posted on this page.
				</p>

				<h2 className="text-xl font-bold mt-8 mb-4">10. Contact Us</h2>
				<p className="mb-4">
					If you have any questions about this Privacy Policy, please contact
					us:
				</p>
				<ul className="list-disc list-inside space-y-2 mb-4">
					<li>
						By email:{" "}
						<a href="mailto:quicktalog@outlook.com" className="underline">
							quicktalog@outlook.com
						</a>
					</li>
				</ul>
			</div>
			<Footer />
		</>
	);
}
