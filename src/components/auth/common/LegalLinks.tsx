import Link from "next/link";
import { textLinkClass } from "@/components/general/TextLink";
import { legalDocuments } from "@/constants/legal";

/**
 * The three legal documents as one inline sentence fragment ("A, B and C").
 * Built from `legalDocuments` so the sign-up checkbox, the Google button notice
 * and the consent gate can never name a different set than the one the database
 * records.
 */
export function LegalLinks() {
	const last = legalDocuments.length - 1;
	return (
		<>
			{legalDocuments.map(({ key, href, name }, index) => (
				<span key={key}>
					{index === 0 ? "" : index === last ? " and " : ", "}
					<Link className={textLinkClass} href={href} target="_blank">
						{name}
					</Link>
				</span>
			))}
		</>
	);
}
