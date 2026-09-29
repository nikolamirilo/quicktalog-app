import { Metadata } from "next";
import { textLinkClass } from "@/components/general/TextLink";
import { LegalPage } from "@/components/legal/LegalPage";
import type { LegalSectionContent } from "@/components/legal/LegalSection";
import { footerDetails } from "@/constants/details";
import { generatePageMetadata } from "@/constants/metadata";
import { getPageSchema } from "@/constants/schemas";

export const metadata: Metadata = generatePageMetadata("refund");

const sections: LegalSectionContent[] = [
	{
		id: "refund-guarantee",
		title: "Our 10-day Money-Back Guarantee",
		content: (
			<>
				<p>
					We provide a <strong>10-day money-back guarantee</strong> or all
					Quicktalog software purchases and subscription plans.
				</p>
				<p>
					Please note that this guarantee applies to your{" "}
					<strong>first purchase</strong> of any Quicktalog product or
					subscription. It does not apply to subsequent renewals, upgrades, or
					additional purchases made after the initial 10-day period.
				</p>
			</>
		),
	},
	{
		id: "refund-request",
		title: "How to Request a Refund",
		content: (
			<>
				<p>To request a refund, please follow these steps:</p>
				<ul>
					<li>
						<strong>Contact Paddle Directly:</strong> As our Merchant of Record,
						Paddle.com handles all payment processing and refunds. The quickest
						way to request a refund is by contacting Paddle's buyer support
						directly through their portal:{" "}
						<a
							className={textLinkClass}
							href="https://paddle.net"
							rel="noopener"
							target="_blank"
						>
							paddle.net
						</a>
						. Please have your purchase receipt or transaction ID ready.
					</li>
					<li>
						<strong>Contact Quicktalog Support:</strong> Alternatively, you can
						reach out to our support team at{" "}
						<a className={textLinkClass} href={`mailto:${footerDetails.email}`}>
							{footerDetails.email}
						</a>
						. Please include your purchase details (e.g., email used for
						purchase, date of purchase, product name) in your request. We will
						then assist you in initiating the refund process through Paddle.
					</li>
				</ul>
				<p>
					Refund requests must be submitted within <strong>10 days</strong> of
					your original purchase date.
				</p>
			</>
		),
	},
	{
		id: "refund-processing",
		title: "Refund Processing",
		content: (
			<>
				<p>
					Once your refund request is received and approved, Paddle will process
					the refund to your original payment method. Please allow 5-10 business
					days for the refund to appear on your statement, depending on your
					bank or card issuer.
				</p>
				<p>
					Upon a successful refund, your access to the Quicktalog platform for
					the refunded product or subscription will be terminated.
				</p>
			</>
		),
	},
	{
		id: "refund-exclusions",
		title: "Non-Refundable Circumstances",
		content: (
			<ul>
				<li>
					Refunds will not be issued for requests made after the 10-day
					money-back guarantee period has expired.
				</li>
				<li>
					Renewals of subscriptions are generally non-refundable. Please manage
					your subscription settings before the renewal date if you wish to
					cancel.
				</li>
				<li>
					Any services explicitly stated as non-refundable at the time of
					purchase.
				</li>
			</ul>
		),
	},
	{
		id: "refund-questions",
		title: "Questions",
		content: (
			<p>
				If you have any questions about our Refund Policy, please don't hesitate
				to contact us at{" "}
				<a className={textLinkClass} href={`mailto:${footerDetails.email}`}>
					{footerDetails.email}
				</a>
				.
			</p>
		),
	},
];

export default function RefundPolicyPage() {
	const refundPageSchema = getPageSchema("refund");

	return (
		<>
			<script
				dangerouslySetInnerHTML={{ __html: JSON.stringify(refundPageSchema) }}
				type="application/ld+json"
			/>
			<LegalPage
				current="refund"
				lead="At Quicktalog, we want you to be completely satisfied with your purchase. We offer a straight-forward refund policy to ensure your peace of mind."
				sections={sections}
				title="Refund Policy for Quicktalog"
				updated="2026-09-29"
			/>
		</>
	);
}
