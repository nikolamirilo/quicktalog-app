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
