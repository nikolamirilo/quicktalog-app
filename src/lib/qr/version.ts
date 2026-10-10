import type { ErrorCorrectionLevel, Mode } from "qr-code-styling";

/**
 * Byte-mode capacity of QR versions 1–40 per error correction level, in bytes.
 * Generated from `qrcode-generator` (the encoder qr-code-styling bundles), so
 * the version shown under the preview is the one the library actually draws,
 * without reading its private `_qr` instance.
 */
const BYTE_CAPACITY: Record<ErrorCorrectionLevel, readonly number[]> = {
	L: [
		17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586,
		644, 718, 792, 858, 929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628,
		1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953,
	],
	M: [
		14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450,
		504, 560, 624, 666, 711, 779, 857, 911, 997, 1059, 1125, 1190, 1264, 1370,
		1452, 1538, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331,
	],
	Q: [
		11, 20, 32, 46, 60, 74, 86, 108, 130, 151, 177, 203, 241, 258, 292, 322,
		364, 394, 442, 482, 509, 565, 611, 661, 715, 751, 805, 868, 908, 982, 1030,
		1112, 1168, 1228, 1283, 1351, 1423, 1499, 1579, 1663,
	],
	H: [
		7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 177, 194, 220, 250, 280,
		310, 338, 382, 403, 439, 461, 511, 535, 593, 625, 658, 698, 742, 790, 842,
		898, 958, 983, 1051, 1093, 1139, 1219, 1273,
	],
};

/** The version (1–40) qr-code-styling picks for `data`, or null when unknown. */
export function qrVersion(
	data: string,
	level: ErrorCorrectionLevel,
	{ typeNumber = 0, mode }: { typeNumber?: number; mode?: Mode } = {},
): number | null {
	if (typeNumber >= 1 && typeNumber <= 40) return typeNumber;
	// Without an explicit mode qr-code-styling picks Numeric / Alphanumeric for
	// such data; only the Byte table is kept, so those cases are "unknown".
	const byteMode =
		mode === "Byte" || (!mode && !/^[0-9A-Z $%*+\-./:]*$/.test(data));
	if (!byteMode) return null;
	const capacities = BYTE_CAPACITY[level];
	if (!capacities) return null;
	const bytes = new TextEncoder().encode(data).length;
	const index = capacities.findIndex((capacity) => bytes <= capacity);
	return index === -1 ? null : index + 1;
}

/** Modules per side for a version: 21 for version 1, +4 per version. */
export const moduleCount = (version: number) => version * 4 + 17;
