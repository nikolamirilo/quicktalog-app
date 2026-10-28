import welcome from "./welcome";
import tour from "./tour";
import quickstart from "./quickstart";
import dashboard from "./dashboard";
import createCatalogue from "./create-catalogue";
import manageCatalogues from "./manage-catalogues";
import builderBasics from "./builder-basics";
import sections from "./sections";
import items from "./items";
import blocks from "./blocks";
import quickAi from "./quick-ai";
import aiCredits from "./ai-credits";
import themes from "./themes";
import catalogueChrome from "./catalogue-chrome";
import backgroundAndGlass from "./background-and-glass";
import publish from "./publish";
import shareLink from "./share-link";
import qrCode from "./qr-code";
import analytics from "./analytics";
import accountSettings from "./account-settings";
import plans from "./plans";
import billing from "./billing";
import limits from "./limits";
import troubleshooting from "./troubleshooting";
import glossary from "./glossary";
import type { ManualPage } from "./_types";

/**
 * The one list of manual pages, in reading order. The sidebar, search, the
 * pager, related links and the routes all read this array. The first page is
 * served at the manual's own address.
 *
 * To add a page: create the .tsx file in this folder, import it here, and add
 * it to the array. Its module comes from `meta.group`.
 */
export const manualPages: ManualPage[] = [
	welcome,
	tour,
	quickstart,
	dashboard,
	createCatalogue,
	manageCatalogues,
	builderBasics,
	sections,
	items,
	blocks,
	quickAi,
	aiCredits,
	themes,
	catalogueChrome,
	backgroundAndGlass,
	publish,
	shareLink,
	qrCode,
	analytics,
	accountSettings,
	plans,
	billing,
	limits,
	troubleshooting,
	glossary,
];

/** Pages offered while the search box is still empty. */
export const manualPopularSlugs: string[] = [
	"quickstart",
	"items",
	"publish",
	"builder-basics",
	"troubleshooting",
];
