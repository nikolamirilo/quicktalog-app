import type { DocEntry } from "./_types";
import buildAndEdit from "./build-and-edit";
import createACatalogue from "./create-a-catalogue";
import customizeDesign from "./customize-design";
import gettingStarted from "./getting-started";
import plansAndBilling from "./plans-and-billing";
import responsiveAndAccessible from "./responsive-and-accessible";
import shareYourCatalogue from "./share-your-catalogue";
import trackPerformance from "./track-performance";

/**
 * The one list of docs topics. This file only holds the array. The functions
 * that read it live in helpers/docs.ts, to match the repo's helpers convention.
 *
 * To add a topic: create the .tsx file in this folder, import it here, and add
 * it to the array. Routes, the sitemap, the index grid, and related links all
 * pick it up automatically. Order on the page comes from meta.order, not this
 * array.
 */
export const docs: DocEntry[] = [
	gettingStarted,
	createACatalogue,
	buildAndEdit,
	customizeDesign,
	shareYourCatalogue,
	trackPerformance,
	plansAndBilling,
	responsiveAndAccessible,
];
