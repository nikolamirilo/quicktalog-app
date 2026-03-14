import { DEFAULT_IMAGE } from "@quicktalog/common";

export const standardTemplate = [
	{
		type: "category",
		order: 1,
		id: crypto.randomUUID(),
		name: "Breakfast",
		layout: "variant_1",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Pancakes",
				description:
					"Fluffy pancakes served with a generous drizzle of rich maple syrup, topped with fresh strawberries and a dollop of whipped cream for the perfect sweet start to your day.",
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
				name: "Omelette",
				description:
					"A fluffy three-egg omelette packed with your choice of fillings, including sautéed mushrooms, fresh spinach, diced tomatoes, and melted cheese, served with a side of crispy hash browns.",
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
				name: "French Toast",
				description:
					"Thick slices of bread soaked in a creamy custard, griddled to golden perfection, and served with a sprinkle of powdered sugar and fresh berries for a delightful morning treat.",
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
				name: "Greek Yogurt with Honey and Berries",
				description:
					"Creamy Greek yogurt topped with fresh mixed berries and a drizzle of natural honey.",
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
		name: "Lunch",
		layout: "variant_2",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Caesar Salad",
				description:
					"Crisp romaine lettuce tossed in our house-made Caesar dressing, topped with crunchy croutons and shaved Parmesan cheese, offering a classic taste that never goes out of style.",
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
				name: "Grilled Chicken Sandwich",
				description:
					"Juicy grilled chicken breast topped with fresh lettuce, ripe tomato, and a creamy garlic aioli, served on a toasted bun for a mouthwatering lunch experience.",
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
				name: "Cheeseburger",
				description:
					"A hearty beef patty grilled to perfection, topped with melted cheddar cheese, crisp lettuce, tomato, and our signature sauce, served on a toasted sesame seed bun with fries.",
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
		name: "Snacks",
		layout: "variant_4",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Nachos",
				description:
					"Crispy tortilla chips generously topped with melted cheese, jalapeños, and a dollop of sour cream, served with fresh salsa on the side for dipping.",
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
				name: "Spring Rolls",
				description:
					"Crispy and light spring rolls filled with a colorful mix of fresh vegetables and served with a sweet chili dipping sauce for a delightful crunch.",
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
		name: "Desserts",
		layout: "variant_1",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Chocolate Cake",
				description:
					"Decadent layers of rich chocolate cake filled with creamy chocolate ganache, topped with chocolate frosting and chocolate shavings.",
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
				name: "Cheesecake",
				description:
					"Creamy cheesecake on a buttery graham cracker crust, drizzled with your choice of strawberry or caramel sauce for added sweetness.",
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
				name: "Tiramisu",
				description:
					"A delightful Italian dessert made with layers of coffee-soaked ladyfingers and creamy mascarpone cheese, dusted with cocoa powder.",
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
				name: "Brownie Sundae",
				description:
					"Rich chocolate brownie topped with a scoop of vanilla ice cream, drizzled with chocolate sauce, and garnished with nuts and whipped cream.",
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
		name: "Drinks",
		layout: "variant_3",
		items: [
			{
				order: 0,
				id: crypto.randomUUID(),
				name: "Fresh Orange Juice",
				description:
					"Freshly squeezed orange juice, packed with vitamins and natural sweetness.",
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
				name: "Espresso",
				description: "A strong and aromatic shot of premium Italian espresso.",
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
