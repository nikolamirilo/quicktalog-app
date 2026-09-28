import {
	Crimson_Text,
	DM_Sans,
	Inter,
	Josefin_Sans,
	Lato,
	Lora,
	Merriweather,
	Montserrat,
	Nunito,
	Open_Sans,
	Oswald,
	Playfair_Display,
	Poppins,
	Raleway,
	Roboto,
	Roboto_Slab,
	Source_Sans_3,
	Work_Sans,
} from "next/font/google";

// Families with a wght axis omit `weight` so Next requests the variable font.
// Asking for static cuts of a variable family makes Google generate instances and
// serve them as extensionless /l/font?kit= URLs, which crashes next/font at build.
// Crimson Text, Poppins and Lato have no variable axis, so they keep static weights.

export const loraRegular = Lora({
	subsets: ["latin"],
	variable: "--font-lora-regular",
	display: "swap",
});

export const loraSemiBold = Lora({
	subsets: ["latin"],
	variable: "--font-lora-semibold",
	display: "swap",
});

// Theme Fonts
export const playfairDisplay = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-playfair-display",
	display: "swap",
});

export const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

export const nunito = Nunito({
	subsets: ["latin"],
	variable: "--font-nunito",
	display: "swap",
});

export const crimsonText = Crimson_Text({
	weight: ["400", "600", "700"],
	subsets: ["latin"],
	variable: "--font-crimson-text",
	display: "swap",
});

export const poppins = Poppins({
	weight: ["400", "500", "600", "700"],
	subsets: ["latin"],
	variable: "--font-poppins",
	display: "swap",
});

export const roboto = Roboto({
	subsets: ["latin"],
	variable: "--font-roboto",
	display: "swap",
});

export const openSans = Open_Sans({
	subsets: ["latin"],
	variable: "--font-open-sans",
	display: "swap",
});

export const montserrat = Montserrat({
	subsets: ["latin"],
	variable: "--font-montserrat",
	display: "swap",
});

export const lato = Lato({
	weight: ["400", "700"],
	subsets: ["latin"],
	variable: "--font-lato",
	display: "swap",
});

export const raleway = Raleway({
	subsets: ["latin"],
	variable: "--font-raleway",
	display: "swap",
});

export const oswald = Oswald({
	subsets: ["latin"],
	variable: "--font-oswald",
	display: "swap",
});

export const merriweather = Merriweather({
	subsets: ["latin"],
	variable: "--font-merriweather",
	display: "swap",
});

export const robotoSlab = Roboto_Slab({
	subsets: ["latin"],
	variable: "--font-roboto-slab",
	display: "swap",
});

export const sourceSans3 = Source_Sans_3({
	subsets: ["latin"],
	variable: "--font-source-sans",
	display: "swap",
});

export const workSans = Work_Sans({
	subsets: ["latin"],
	variable: "--font-work-sans",
	display: "swap",
});

export const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
	display: "swap",
});

export const josefinSans = Josefin_Sans({
	subsets: ["latin"],
	variable: "--font-josefin-sans",
	display: "swap",
});
