import type { Article } from "./_types";
import businessesThatNeedDigitalCatalog from "./businesses-that-need-digital-catalog";
import createCatalogWithAi from "./create-catalog-with-ai";
import digitalCatalogAlternatives from "./digital-catalog-alternatives";
import digitalMenuForRestaurants from "./digital-menu-for-restaurants";
import digitalServiceMenuSalonsSpas from "./digital-service-menu-salons-spas";
import qrCodeCatalogGuide from "./qr-code-catalog-guide";

/**
 * The one list of articles. This file only holds the array. The functions that
 * read it live in helpers/articles.ts, to match the repo's helpers convention.
 *
 * To add an article: create the .tsx file in this folder, import it here, and
 * add it to the array. Everything else (routes, sitemap, index, related posts)
 * picks it up automatically.
 */
export const articles: Article[] = [
	digitalMenuForRestaurants,
	digitalServiceMenuSalonsSpas,
	createCatalogWithAi,
	qrCodeCatalogGuide,
	digitalCatalogAlternatives,
	businessesThatNeedDigitalCatalog,
];
