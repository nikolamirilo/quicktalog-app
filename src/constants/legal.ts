/**
 * The legal documents, in the order they are listed everywhere: the legal
 * page tabs and "Also read" links, the sign-up consent dialog and the footer.
 */
export const legalDocuments = [
	{
		key: "terms",
		href: "/terms-and-conditions",
		tab: "Terms",
		name: "Terms & Conditions",
	},
	{
		key: "privacy",
		href: "/privacy-policy",
		tab: "Privacy",
		name: "Privacy Policy",
	},
	{
		key: "refund",
		href: "/refund-policy",
		tab: "Refund",
		name: "Refund Policy",
	},
] as const;

export type LegalDocumentKey = (typeof legalDocuments)[number]["key"];
