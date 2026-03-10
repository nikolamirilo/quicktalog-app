import { footerDetails } from "@/constants/details";
import Link from "next/link";
import { FiExternalLink, FiMail, FiPhone } from "react-icons/fi";

export const Contact = ({
	type,
	activeData,
}: {
	type: string;
	activeData: any;
}) => {
	if (type !== "default" && !activeData?.contact?.email) return null;

	return (
		<div className="space-y-6">
			<h4 className="text-lg font-semibold flex items-center space-x-2 font-heading font-weight-heading tracking-heading text-catalogue-navigation-text">
				<div
					aria-hidden="true"
					className="w-1 h-5 bg-primary rounded-full"
				></div>
				<span>Contact & Support</span>
			</h4>
			<ul className="space-y-4">
				<li>
					<a
						aria-label={`Send email to ${type === "default" ? footerDetails.email : activeData?.contact.email || "contact"}`}
						className="flex items-center space-x-3 text-sm hover:text-primary transition-colors duration-200 group text-catalogue-navigation-text"
						href={`mailto:${type === "default" ? footerDetails.email : activeData?.contact.email}`}
					>
						<FiMail
							aria-hidden="true"
							className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
						/>
						<span>
							{type === "default"
								? footerDetails.email
								: activeData?.contact.email}
						</span>
					</a>
				</li>
				{activeData?.contact?.phone && (
					<li>
						<a
							aria-label={`Call ${activeData?.contact?.phone}`}
							className="flex items-center space-x-3 text-sm hover:text-primary transition-colors duration-200 group text-catalogue-navigation-text"
							href={`tel:${activeData?.contact?.phone}`}
						>
							<FiPhone
								aria-hidden="true"
								className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
							/>
							<span>{activeData?.contact.phone}</span>
						</a>
					</li>
				)}
				{type === "default" && (
					<li>
						<Link
							aria-label="Contact us"
							className="flex items-center space-x-3 text-sm hover:text-primary transition-colors duration-200 group text-catalogue-navigation-text"
							href="/contact"
						>
							<FiExternalLink
								aria-hidden="true"
								className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
							/>
							<span>Contact Us</span>
						</Link>
					</li>
				)}
			</ul>
		</div>
	);
};

export default Contact;
