import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { tiers } from "@/constants/pricing";
import {
	Catalogue,
	ContactItem,
	FooterData,
	HeaderData,
	PricingPlan,
	ServicesFormData,
} from "@/types";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatPrice(price) {
	if (!price.includes(".")) return price;
	return price.split(".")[0];
}

const now = new Date();
export const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
export const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

export const getContactValue = (
	contact: ContactItem[] | undefined,
	type: string,
): string | undefined => {
	if (!contact || !Array.isArray(contact)) return undefined;
	return contact.find((c) => c.type === type)?.value;
};

export function disableConsoleInProduction() {
	if (typeof window === "undefined") return;

	if (process.env.NEXT_PUBLIC_DISABLE_LOGGING === "true") {
		console.clear();
		console.log = () => {};
		console.debug = () => {};
		console.info = () => {};
		console.warn = () => {};
		// Optionally preserve console.error for critical errors
		// console.error = () => {};
	}
}

export function cleanValue(value: any) {
	// Handle arrays
	if (Array.isArray(value)) {
		const cleanedArray = value
			.map(cleanValue)
			.filter(
				(v) =>
					v !== undefined &&
					!(
						typeof v === "object" &&
						Object.keys(v).length === 0 &&
						!Array.isArray(v)
					),
			);
		return cleanedArray.length > 0 ? value : [];
	}

	// Handle objects
	if (value && typeof value === "object") {
		const cleanedObj = {};
		for (const [key, val] of Object.entries(value)) {
			const cleanedVal = cleanValue(val);
			if (
				cleanedVal !== undefined &&
				!(
					typeof cleanedVal === "object" &&
					Object.keys(cleanedVal).length === 0 &&
					!Array.isArray(cleanedVal)
				)
			) {
				cleanedObj[key] = cleanedVal;
			}
		}
		return Object.keys(cleanedObj).length > 0 ? cleanedObj : {};
	}

	// Primitive values → only keep if not false/""/null/undefined
	if (
		value === false ||
		value === "" ||
		value === null ||
		value === undefined
	) {
		return undefined;
	}

	return value;
}
export const buildHeaderData = (item: Catalogue): HeaderData => ({
	email: getContactValue(item.contact, "email") || "",
	phone: getContactValue(item.contact, "phone") || "",
	ctaNavbar: item.configuration?.ctaNavbar,
});

export const buildFooterData = (item: Catalogue): FooterData => ({
	name: item.name || "",
	partners: item.partners,
	email: getContactValue(item.contact, "email"),
	phone: getContactValue(item.contact, "phone"),
	socialLinks: {
		instagram: getContactValue(item.contact, "instagram"),
		facebook: getContactValue(item.contact, "facebook"),
		twitter: getContactValue(item.contact, "twitter"),
		website: getContactValue(item.contact, "website"),
		tiktok: getContactValue(item.contact, "tiktok"),
	},
	ctaFooter: item.configuration?.ctaFooter,
	newsletter: item.configuration?.newsletter,
	legal: item.legal,
	catalogue: {
		id: item.id,
		owner_id: item.created_by,
	},
});

export function getCurrencySymbol(code: string, locale = "en-US") {
	return (0)
		.toLocaleString(locale, {
			style: "currency",
			currency: code,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		})
		.replace(/\d/g, "")
		.trim();
}

export const getGridStyle = (variant: string): string => {
	switch (variant) {
		case "variant_1":
			return "grid grid-cols-1 px-1 md:grid-cols-2 gap-3 my-1";
		case "variant_2":
			return "flex flex-wrap px-1 justify-start gap-3 mx-auto sm:gap-4 md:gap-6 my-1";
		case "variant_3":
			return "grid grid-cols-1 px-1 md:grid-cols-2 gap-3 my-1";
		case "variant_4":
			return "";
		default:
			return "flex flex-row flex-wrap gap-3 my-1";
	}
};

export const contentVariants = {
	hidden: { height: 0, opacity: 0, marginTop: 0 },
	visible: { height: "auto", opacity: 1, marginTop: 16 },
};

export const handleDownloadHTML = (catalogueSlug: string, fullURL: string) => {
	try {
		const html = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>Embedded Catalogue</title>\n  <style>\n    html, body { margin: 0; padding: 0; height: 100%; width: 100%; background: white; }\n    iframe { width: 100vw; height: 100vh; border: none; position: fixed; top: 0; left: 0; z-index: 9999; background: white; }\n  </style>\n</head>\n<body>\n  <iframe src=\"${fullURL}\"></iframe>\n</body>\n</html>`;

		const blob = new Blob([html], { type: "text/html" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");

		a.href = url;
		a.download = `${catalogueSlug}.html`;
		document.body.appendChild(a);
		a.click();

		setTimeout(() => {
			try {
				if (a.parentNode === document.body) {
					document.body.removeChild(a);
				}
			} catch (removeError) {
				console.warn("Element already removed or not found:", removeError);
			}
			URL.revokeObjectURL(url);
		}, 100);
	} catch (error) {
		console.error("Error in handleDownloadHTML:", error);
	}
};

export const handleDownloadPDF = async (
	catalogueSlug: string,
	fullURL: string,
) => {
	try {
		const response = await fetch(
			`/api/pdf?url=${encodeURIComponent(fullURL)}&name=${encodeURIComponent(catalogueSlug)}`,
		);

		if (!response.ok) throw new Error("Failed to generate PDF");

		const blob = await response.blob();
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `${catalogueSlug}.pdf`;
		document.body.appendChild(link);
		link.click();
		link.remove();
	} catch (error) {
		console.error("Error downloading PDF:", error);
	}
};

export const handleDownloadPng = (catalogueSlug: string) => {
	const svg = document.querySelector("#qr-code svg");
	if (!svg) {
		console.error("QR SVG not found!");
		return;
	}
	const clone = svg.cloneNode(true) as SVGSVGElement;
	clone.setAttribute("width", "512");
	clone.setAttribute("height", "512");
	const serializer = new XMLSerializer();
	const source = serializer.serializeToString(clone);
	const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const img = new window.Image();
	img.onload = function () {
		const canvas = document.createElement("canvas");
		canvas.width = 512;
		canvas.height = 512;
		const ctx = canvas.getContext("2d");
		ctx!.fillStyle = "#fff";
		ctx!.fillRect(0, 0, canvas.width, canvas.height);
		ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
		canvas.toBlob((blob) => {
			if (!blob) {
				console.error("Failed to create PNG blob from canvas!");
				return;
			}
			const url2 = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.download = `${catalogueSlug}.png`;
			a.href = url2;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url2);
			URL.revokeObjectURL(url);
		}, "image/png");
	};
	img.onerror = function () {
		console.error("Failed to load SVG as image!");
		URL.revokeObjectURL(url);
	};
	img.src = url;
};

export function toTitleCase(str) {
	return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

interface ValidationResult {
	isValid: boolean;
	errors: { [key: string]: string };
	step2Error?: string;
	step3Error?: string;
}

interface Step1Validation {
	name: string;
	title?: string;
	currency?: string;
}

interface StepValidationOptions {
	step: number;
	formData: ServicesFormData;
	requiredFields?: {
		step1?: Array<keyof Step1Validation>;
	};
	tier?: PricingPlan;
}

export const validateStepHelper = (
	options: StepValidationOptions,
): ValidationResult => {
	const { step, formData, requiredFields } = options;
	const errors: { [key: string]: string } = {};
	let step2Error = "";
	let step3Error = "";

	if (step === 1) {
		const defaultRequiredFields: Array<keyof Step1Validation> = [
			"name",
			"title",
			"currency",
		];
		const fieldsToValidate = requiredFields?.step1 || defaultRequiredFields;

		fieldsToValidate.forEach((field) => {
			const value = formData[field];
			if (typeof value === "string" && !value.trim()) {
				const fieldLabels: { [key: string]: string } = {
					name: "Service catalogue name",
					title: "Catalogue Heading",
					currency: "Currency",
				};
				errors[field] = `${fieldLabels[field] || field} is required`;
			}
		});
	}

	if (step === 2) {
		if (formData.services.length === 0) {
			step2Error = "Please add at least one service category.";
		} else {
			const seen = new Set<string>();

			for (const category of formData.services) {
				if (!category.name?.trim()) {
					step2Error = "All service categories must have a name and layout.";
					break;
				}

				const normalizedName = category.name.trim().toLowerCase();
				if (seen.has(normalizedName)) {
					step2Error = "Category names must be unique within the catalogue.";
					break;
				}
				seen.add(normalizedName);
			}
		}
	}

	if (step === 3) {
		for (const category of formData.services) {
			if (!category.items || category.items.length === 0) {
				step3Error = `Category "${category.name}" must have at least one service item.`;
				break;
			}

			for (const item of category.items) {
				if (!item.name?.trim()) {
					step3Error = `All items in category "${category.name}" must have a name.`;
					break;
				}

				if (typeof item.price !== "number" || item.price < 0) {
					step3Error = `Price for item "${item.name}" in category "${category.name}" must be 0 or greater.`;
					break;
				}

				if (category.layout !== "variant_3" && !item.image?.trim()) {
					step3Error = `Image for item "${item.name}" in category "${category.name}" is required for this layout.`;
					break;
				}
			}

			if (step3Error) break;
		}
		// const totalItems = formData.services.reduce((sum, category) => {
		//   return sum + category.items.length
		// }, 0)
		// if (
		//   typeof tier.features.items_per_catalogue == "number" &&
		//   totalItems > tier.features.items_per_catalogue
		// ) {
		//   step3Error = `You can add up to ${tier.features.items_per_catalogue} items on your current plan.`
		// }
	}

	const isValid =
		Object.keys(errors).length === 0 && !step2Error && !step3Error;

	return {
		isValid,
		errors,
		step2Error,
		step3Error,
	};
};
