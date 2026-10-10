export function extractDomain(url: string): string | null {
	try {
		let cleanUrl = url.trim();
		if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
			cleanUrl = `https://${cleanUrl}`;
		}
		return new URL(cleanUrl).hostname;
	} catch {
		return null;
	}
}
