import { Catalogue } from "@/types/catalogue";

export const defaultNewCatalogueData = {
	name: "",
	logo: "",
	status: "draft",
	language: "eng",
	heading: "",
	description: "",
	currency: "EUR",
	businessType: "",
	content: [],
	legal: {
		legalName: "",
		termsAndConditions: "",
		privacyPolicy: "",
		address: "",
	},
	appearance: {
		theme: {
			type: "standard",
			name: "theme-monochrome",
		},
		style: {
			contentFontSize: "medium",
			fontFamily: "arial",
			borderRadius: 12,
			animation: "minimal",
			shadow: "low",
		},
		overlay: {
			isEnabled: false,
			icon: "",
		},
	},
	contact: {
		phone: "+31378163",
		email: "office@quicktalog.com",
		socials: [],
	},
	header: {
		cta: {
			isEnabled: true,
			label: "Create new catalogue",
			url: "/",
		},
		emailCta: true,
		phoneCta: true,
	},
	footer: {
		cta: {
			isEnabled: true,
			label: "Create new catalogue",
			url: "/",
		},
		newsletter: false,
		showPartners: false,
	},
	createdAt: new Date().toString(),
	updatedAt: new Date().toString(),
	source: "builder",
	tags: [],
	partners: [],
} as Catalogue;

export const BUSINESS_TYPES = [
	{ value: "restaurant", label: "Restaurant" },
	{ value: "cafe", label: "Cafe" },
	{ value: "bar", label: "Bar" },
	{ value: "bakery", label: "Bakery" },
	{ value: "food-truck", label: "Food Truck" },
	{ value: "catering", label: "Catering" },
	{ value: "other", label: "Other" },
];
