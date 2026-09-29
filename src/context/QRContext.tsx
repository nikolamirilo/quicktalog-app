"use client";

import type QRCodeStyling from "qr-code-styling";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { designKey, mergeQrConfig, type QrConfig } from "@/lib/qr/design";

interface QrContextType {
	options: QrConfig;
	setOptions: React.Dispatch<React.SetStateAction<QrConfig>>;
	/** Shallow-merges each option group, so callers pass only what changed. */
	updateOptions: (newOptions: Partial<QrConfig>) => void;
	/** True while the design differs from the last saved one. */
	isDirty: boolean;
	/** Records the current design as saved. */
	markSaved: (saved: QrConfig) => void;
	qrCodeInstance: QRCodeStyling | null;
	setQrCodeInstance: (instance: QRCodeStyling | null) => void;
}

const QrContext = createContext<QrContextType | undefined>(undefined);

export function QrProvider({
	children,
	initialOptions,
}: {
	children: React.ReactNode;
	/** The design to start from: the saved one, or the defaults. */
	initialOptions: QrConfig;
}) {
	const [options, setOptions] = useState<QrConfig>(initialOptions);
	const [savedKey, setSavedKey] = useState(() => designKey(initialOptions));
	const [qrCodeInstance, setQrCodeInstance] = useState<QRCodeStyling | null>(
		null,
	);

	const updateOptions = useCallback((newOptions: Partial<QrConfig>) => {
		setOptions((prev) => mergeQrConfig(prev, newOptions));
	}, []);

	const markSaved = useCallback(
		(saved: QrConfig) => setSavedKey(designKey(saved)),
		[],
	);

	const isDirty = useMemo(
		() => designKey(options) !== savedKey,
		[options, savedKey],
	);

	const value = useMemo<QrContextType>(
		() => ({
			options,
			setOptions,
			updateOptions,
			isDirty,
			markSaved,
			qrCodeInstance,
			setQrCodeInstance,
		}),
		[options, updateOptions, isDirty, markSaved, qrCodeInstance],
	);

	return <QrContext.Provider value={value}>{children}</QrContext.Provider>;
}

export function useQr() {
	const context = useContext(QrContext);
	if (context === undefined) {
		throw new Error("useQr must be used within a QrProvider");
	}
	return context;
}
