export const loadImage = (file: File): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);

		const cleanup = () => URL.revokeObjectURL(url);

		img.onload = () => {
			cleanup();
			resolve(img);
		};

		img.onerror = () => {
			cleanup();
			reject(new Error(`Failed to load image: ${file.name}`));
		};

		img.src = url;
	});
};

export const calculateDimensions = (
	width: number,
	height: number,
	maxDim: number,
) => {
	if (width <= maxDim && height <= maxDim) {
		return { width, height };
	}

	const aspectRatio = width / height;

	if (width > height) {
		return {
			width: maxDim,
			height: Math.round(maxDim / aspectRatio),
		};
	} else {
		return {
			width: Math.round(maxDim * aspectRatio),
			height: maxDim,
		};
	}
};

export const canvasToBlob = (
	canvas: HTMLCanvasElement,
	quality: number,
): Promise<Blob> => {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
				} else {
					reject(new Error("Failed to convert canvas to blob"));
				}
			},
			"image/webp",
			quality,
		);
	});
};

export const processImage = async (
	img: HTMLImageElement,
	maxDim: number,
	targetSizeKB: number = 400,
	fileName: string,
): Promise<File> => {
	const { width, height } = calculateDimensions(img.width, img.height, maxDim);

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d", {
		alpha: false,
		willReadFrequently: false,
		desynchronized: true,
	});

	if (!ctx) {
		throw new Error("Failed to get 2D rendering context");
	}

	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";

	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, width, height);

	ctx.drawImage(img, 0, 0, width, height);

	const targetSizeBytes = targetSizeKB * 1024;
	const maxSizeBytes = targetSizeKB * 1024; // Enforce strict 400KB limit

	let minQuality = 0.3;
	let maxQuality = 0.98;
	let bestBlob: Blob | null = null;
	let bestQuality = minQuality;

	let currentBlob = await canvasToBlob(canvas, maxQuality);

	if (currentBlob.size <= targetSizeBytes) {
		bestBlob = currentBlob;
		bestQuality = maxQuality;
	} else {
		let searchMin = minQuality;
		let searchMax = maxQuality;

		for (let i = 0; i < 8; i++) {
			const midQuality = (searchMin + searchMax) / 2;
			const testBlob = await canvasToBlob(canvas, midQuality);

			if (testBlob.size <= targetSizeBytes) {
				if (
					testBlob.size > (bestBlob?.size || 0) ||
					Math.abs(testBlob.size - targetSizeBytes) <
						Math.abs((bestBlob?.size || 0) - targetSizeBytes)
				) {
					bestBlob = testBlob;
					bestQuality = midQuality;
				}
				searchMin = midQuality;
			} else {
				searchMax = midQuality;
			}
		}
	}

	if (!bestBlob) {
		bestBlob = await canvasToBlob(canvas, 0.1);
		bestQuality = 0.1;
	}

	if (bestBlob.size > maxSizeBytes) {
		throw new Error(
			`Processed image size (${Math.round(bestBlob.size / 1024)}KB) exceeds maximum allowed size of ${targetSizeKB}KB`,
		);
	}

	console.log(`Image processing results:
    - Original: ~${Math.round((img.naturalWidth * img.naturalHeight * 4) / 1024)}KB (estimated)
    - Compressed: ${Math.round(bestBlob.size / 1024)}KB
    - Quality: ${Math.round(bestQuality * 100)}%
    - Dimensions: ${width}x${height}
    - Target: ${targetSizeKB}KB`);

	const newFileName = fileName.replace(/\.[^.]+$/, ".webp");

	return new File([bestBlob], newFileName, {
		type: "image/webp",
		lastModified: Date.now(),
	});
};
