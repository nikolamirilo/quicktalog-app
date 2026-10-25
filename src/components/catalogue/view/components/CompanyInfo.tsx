import type { Catalogue } from "@quicktalog/common";
import { FiFileText, FiMapPin } from "react-icons/fi";

/** "Visit us": address and registered name. Renders nothing when both are empty. */
const CompanyInfo = ({ legal }: { legal: Catalogue["legal"] | undefined }) => {
	if (!legal?.legalName && !legal?.address) return null;
	return (
		<div className="cat-foot-col">
			<h2>Visit us</h2>
			<ul className="cat-foot-links">
				{legal.address && (
					<li>
						<span>
							<FiMapPin aria-hidden="true" />
							<span>{legal.address}</span>
						</span>
					</li>
				)}
				{legal.legalName && (
					<li>
						<span>
							<FiFileText aria-hidden="true" />
							<span>{legal.legalName}</span>
						</span>
					</li>
				)}
			</ul>
		</div>
	);
};

export default CompanyInfo;
