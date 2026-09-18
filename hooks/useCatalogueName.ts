import { useEffect, useState } from "react";
import { checkCatalogueName } from "@/actions/catalogue";

interface UseCatalogueNameProps {
	initialName: string;
	type: "create" | "edit";
	setFormData: (updater: (prev: any) => any) => void;
	setErrors?: (updater: (prev: any) => any) => void;
	setTouched?: (updater: (prev: any) => any) => void;
}

interface UseCatalogueNameReturn {
	handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	nameExists: boolean;
}

export const NAME_TAKEN_ERROR =
	"This name is already in use. Please choose a different name.";

const VALID_NAME = /^[a-zA-Z0-9\s]*$/;
const CHECK_DELAY_MS = 400;

export const useCatalogueName = ({
	initialName,
	type,
	setFormData,
	setErrors,
	setTouched,
}: UseCatalogueNameProps): UseCatalogueNameReturn => {
	const [nameExists, setNameExists] = useState(false);

	// Ask the server whether the name is free once the user pauses typing.
	useEffect(() => {
		if (type !== "create") return;
		const name = initialName?.trim() ?? "";
		if (!name || !VALID_NAME.test(name)) {
			setNameExists(false);
			return;
		}

		let cancelled = false;
		const timer = setTimeout(async () => {
			try {
				const result = await checkCatalogueName(name);
				if (cancelled || "error" in result) return;
				const taken = !result.available;
				setNameExists(taken);
				setErrors?.((prev: any) => {
					if (taken) return { ...prev, name: NAME_TAKEN_ERROR };
					if (prev?.name !== NAME_TAKEN_ERROR) return prev;
					const { name: _removed, ...rest } = prev;
					return rest;
				});
			} catch (error) {
				console.error("Failed to check catalogue name:", error);
			}
		}, CHECK_DELAY_MS);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [initialName, type]);

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newName = e.target.value;
		setFormData((prev: any) => ({ ...prev, name: newName }));
		setNameExists(false);

		if (setTouched) {
			setTouched((prev: any) => ({ ...prev, name: true }));
		}

		const isValidFormat = VALID_NAME.test(newName);
		const isJustSpaces = newName.length > 0 && newName.trim().length === 0;

		if ((!isValidFormat || isJustSpaces) && setErrors) {
			setErrors((prev: any) => ({
				...prev,
				name: isJustSpaces
					? "Name cannot be just spaces."
					: "Name must only contain letters, numbers, and spaces (no special characters).",
			}));
			return;
		}

		// Valid input clears earlier name errors; the availability check re-adds one if needed.
		if (setErrors) {
			setErrors((prev: any) => {
				const newErrors = { ...prev };
				delete newErrors.name;
				return newErrors;
			});
		}
	};

	return { handleNameChange, nameExists };
};
