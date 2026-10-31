import { SmartLink } from "@/components/general/SmartLink";
import { extractDomain } from "@/lib/http/domain";
import type { Catalogue } from "@quicktalog/common";
import { FiGlobe, FiMail, FiPhone } from "react-icons/fi";

/** Email, phone and website of a custom footer. Renders nothing when all are empty. */
const Contact = ({
	contact,
}: {
	contact: Catalogue["contact"] | undefined;
}) => {
	if (!contact?.email && !contact?.phone && !contact?.website) return null;
	return (
		<div className="cat-foot-col">
			<h2>Contact</h2>
			<ul className="cat-foot-links">
				{contact.email && (
					<li>
						<a href={`mailto:${contact.email}`}>
							<FiMail aria-hidden="true" />
							{contact.email}
						</a>
					</li>
				)}
				{contact.phone && (
					<li>
						<a href={`tel:${contact.phone}`}>
							<FiPhone aria-hidden="true" />
							{contact.phone}
						</a>
					</li>
				)}
				{contact.website && (
					<li>
						<SmartLink href={contact.website}>
							<FiGlobe aria-hidden="true" />
							{(extractDomain(contact.website) || contact.website).replace(
								/^www\./,
								"",
							)}
						</SmartLink>
					</li>
				)}
			</ul>
		</div>
	);
};

export default Contact;
