import { DEFAULT_IMAGE } from "@quicktalog/common";

export const standardTemplate = [
	{
		type: "category",
		order: 1,
		id: crypto.randomUUID(),
		name: "Featured Collection",
		layout: "variant_1",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Signature Selection",
				description:
					"A flagship item designed to represent the core value of the catalogue, featuring a well-rounded description that showcases how prominent offerings appear within the layout.",
				price: 5.99,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 1,
				id: crypto.randomUUID(),
				name: "Classic Choice",
				description:
					"A dependable, widely appreciated option that illustrates how standard items render alongside richer content, useful for demonstrating balance and consistency across the catalogue.",
				price: 7.49,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 2,
				id: crypto.randomUUID(),
				name: "Specialty Pick",
				description:
					"A distinctive example item intended to highlight variety within the catalogue, showing how more specialised offerings can be presented with detail and clarity.",
				price: 6.99,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 3,
				id: crypto.randomUUID(),
				name: "Premium Highlight",
				description:
					"A top-tier placeholder representing elevated offerings, useful for illustrating how higher-value items sit within the overall collection.",
				price: 10.99,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
		],
	},
	{
		type: "category",
		order: 2,
		id: crypto.randomUUID(),
		name: "Main Offerings",
		layout: "variant_2",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Standard Package",
				description:
					"A general-purpose offering designed to demonstrate how mid-range items appear in a different layout variant, balancing descriptive length with visual presentation.",
				price: 8.99,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 1,
				id: crypto.randomUUID(),
				name: "Popular Bundle",
				description:
					"A commonly selected example item, useful for showing how frequently chosen offerings can be highlighted within a category without industry-specific assumptions.",
				price: 9.99,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 2,
				id: crypto.randomUUID(),
				name: "Complete Set",
				description:
					"A comprehensive placeholder representing bundled or combined offerings, illustrating how layered items display within the catalogue structure.",
				price: 10.99,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
		],
	},
	{
		type: "category",
		order: 3,
		id: crypto.randomUUID(),
		name: "Limited Additions",
		layout: "variant_4",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Seasonal Option",
				description:
					"A rotating placeholder intended to demonstrate time-limited or occasion-based items, shown in a compact layout variant suitable for shorter selections.",
				price: 6.49,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 1,
				id: crypto.randomUUID(),
				name: "Exclusive Item",
				description:
					"A restricted-availability example used to illustrate how special or limited offerings can be presented within a smaller category group.",
				price: 5.99,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
		],
	},
	{
		type: "category",
		order: 4,
		id: crypto.randomUUID(),
		name: "Premium Range",
		layout: "variant_1",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Signature Premium",
				description:
					"A refined placeholder representing elevated offerings, designed to show how flagship premium items appear in a richer layout configuration.",
				price: 4.99,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 1,
				id: crypto.randomUUID(),
				name: "Deluxe Option",
				description:
					"An upgraded example item used to demonstrate how higher-tier selections can be showcased with detail and clear positioning.",
				price: 5.49,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 2,
				id: crypto.randomUUID(),
				name: "Exclusive Edition",
				description:
					"A specialised placeholder illustrating limited or curated offerings, suitable for presenting items with elevated perceived value.",
				price: 5.99,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 3,
				id: crypto.randomUUID(),
				name: "Luxury Pick",
				description:
					"A high-tier example item representing the upper end of the range, useful for demonstrating how prestige offerings fit into the broader catalogue.",
				price: 5.49,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
		],
	},
	{
		type: "container",
		order: 5,
		id: crypto.randomUUID(),
		name: "Complementary Extras",
		layout: "variant_3",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Essential Add-On",
				description:
					"A neutral placeholder representing supporting items that pair with primary selections.",
				price: 3.99,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 1,
				id: crypto.randomUUID(),
				name: "Optional Upgrade",
				description:
					"A small supplementary example used to showcase minor add-on items.",
				price: 2.49,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
		],
	},
];

export const placeholderTemplate = [
	{
		id: crypto.randomUUID(),
		type: "category",
		order: 1,
		name: "Core Offerings",
		layout: "variant_1",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Standard Option",
				description:
					"A versatile default offering designed to showcase how a typical item appears within the catalogue layout.",
				price: 0,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 1,
				id: crypto.randomUUID(),
				name: "Enhanced Option",
				description:
					"An upgraded example item with additional details, useful for demonstrating richer descriptions and longer content.",
				price: 0,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 2,
				id: crypto.randomUUID(),
				name: "Premium Option",
				description:
					"A high-level placeholder item intended to represent top-tier offerings or advanced configurations.",
				price: 0,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
		],
	},
	{
		id: crypto.randomUUID(),
		type: "category",
		order: 2,
		name: "Additional Selections",
		layout: "variant_2",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Flexible Choice",
				description:
					"A neutral placeholder item intended to represent optional or supplementary selections within the catalogue.",
				price: 0,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 1,
				id: crypto.randomUUID(),
				name: "Customizable Choice",
				description:
					"An example item used to illustrate customization, variants, or future expansion without industry-specific assumptions.",
				price: 0,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
			{
				order: 2,
				id: crypto.randomUUID(),
				name: "Optional Add-On",
				description:
					"A lightweight placeholder representing add-ons, extras, or complementary selections.",
				price: 0,
				image: DEFAULT_IMAGE,
				isFree: false,
				discount: {
					isOnDiscount: false,
					discountPercentage: 0,
					discountedPrice: 0,
				},
			},
		],
	},
];
