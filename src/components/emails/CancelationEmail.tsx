import { tiers } from "@quicktalog/common";
import { DEFAULT_SITE_URL, EmailShell } from "./EmailShell";
import {
	Badge,
	Buttons,
	DetailRows,
	Divider,
	Heading,
	Lead,
	Paragraph,
	Title,
} from "./parts";

const FEEDBACK_URL = "https://forms.office.com/r/nxYghvYAEx";
const CALL_URL = "https://calendly.com/quicktalog/customer-support";

/** Sent once Paddle has ended the subscription and the user is on Starter. */
export function CancellationEmail({
	name,
	unpublished = [],
}: {
	name?: string;
	/** Catalogues taken offline because Starter allows fewer. */
	unpublished?: string[];
}) {
	const firstName = name && name !== "Unknown User" ? name : null;
	const starter = tiers[0];

	return (
		<EmailShell preview="Your Quicktalog subscription has ended and your account is now on the free Starter plan.">
			<Badge tone="neutral">Subscription ended</Badge>
			<Title>Your subscription has ended</Title>
			<Lead>
				{firstName
					? `Thanks for giving Quicktalog a try, ${firstName}. `
					: "Thanks for giving Quicktalog a try. "}
				Your account is now on the free {starter.name} plan, so you can keep
				using it and upgrade again at any time.
			</Lead>
			{unpublished.length > 0 && (
				<>
					<Paragraph>
						{starter.name} includes {starter.features.catalogues} live{" "}
						{starter.features.catalogues === 1 ? "catalogue" : "catalogues"}, so
						we took these offline. They're still in your dashboard.
					</Paragraph>
					<DetailRows
						rows={unpublished.map((catalogue) => ({
							label: "Offline",
							value: catalogue,
						}))}
					/>
				</>
			)}
			<Buttons
				buttons={[
					{
						label: "Go to your dashboard",
						href: `${DEFAULT_SITE_URL}/admin/dashboard`,
					},
				]}
			/>
			<Divider />
			<Heading>Tell us what didn't work</Heading>
			<Paragraph>
				Your answers help us decide what to build next. If you'd rather talk,
				book a call and we can look at a custom plan or an offer that fits
				better.
			</Paragraph>
			<Buttons
				buttons={[
					{ label: "Leave feedback", href: FEEDBACK_URL, secondary: true },
					{ label: "Book a call", href: CALL_URL, secondary: true },
				]}
			/>
			<Paragraph last>
				Thank you for being part of Quicktalog,
				<br />
				The Quicktalog team
			</Paragraph>
		</EmailShell>
	);
}
