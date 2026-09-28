export function disableConsoleInProduction() {
	if (typeof window === "undefined") return;

	if (process.env.NEXT_PUBLIC_DISABLE_LOGGING === "true") {
		console.clear();
		console.log = () => {};
		console.debug = () => {};
		console.info = () => {};
		console.warn = () => {};
	}
}
