import { useEffect, useMemo, useState } from "react";

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
	names: string[];
	refetchNames: () => void;
}

const normalize = (str: string) =>
	str.trim().toLowerCase().replace(/\s+/g, "-");

export const useCatalogueName = ({
	initialName,
	type,
	setFormData,
	setErrors,
	setTouched,
}: UseCatalogueNameProps): UseCatalogueNameReturn => {
	const [names, setNames] = useState<any[]>([]);

	const nameExists = useMemo(() => {
		if (type !== "create" || !initialName || !names.length) return false;
		return names.some((n) => normalize(n.name) === normalize(initialName));
	}, [initialName, names, type]);

	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newName = e.target.value;
		setFormData((prev: any) => ({ ...prev, name: newName }));

		if (setTouched) {
			setTouched((prev: any) => ({ ...prev, name: true }));
		}

		const isValidFormat = /^[a-zA-Z0-9\s]*$/.test(newName);
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

		// Clear any existing name errors when user types valid input
		if (isValidFormat && !isJustSpaces && setErrors) {
			setErrors((prev: any) => {
				const newErrors = { ...prev };
				// Clear all name-related errors
				delete newErrors.name;
				return newErrors;
			});
		}

		// Check for duplicates (only in create flow)
		if (type === "create") {
			if (newName.trim() && names.length > 0) {
				const exists = names.some(
					(n) => normalize(n.name) === normalize(newName),
				);

				if (exists && setErrors) {
					setErrors((prev: any) => ({
						...prev,
						name: "This name is already in use. Please choose a different name.",
					}));
				}
			}
		}
	};
	const fetchNames = async () => {
		try {
			const res = await fetch("/api/items?type=name", {
				method: "GET",
				cache: "no-store",
			});
			const data = await res.json();
			setNames(data);

			// Check if initial name already exists
			if (initialName && data.length > 0) {
				const exists = data.some(
					(n) => normalize(n.name) === normalize(initialName),
				);
				if (exists && setErrors) {
					setErrors((prev: any) => ({
						...prev,
						name: "This name is already in use. Please choose a different name.",
					}));
				}
			}
		} catch (error) {
			console.error("Failed to fetch names:", error);
			setNames([]);
		}
	};

	useEffect(() => {
		if (type !== "create") return;
		fetchNames();
	}, [type]);

	return {
		handleNameChange,
		nameExists,
		names,
		refetchNames: fetchNames,
	};
};
