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

export const handleDownloadPng = async (catalogueSlug: string) => {
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
