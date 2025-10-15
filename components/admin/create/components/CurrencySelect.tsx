"use client";
import { useEffect, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { currencies } from "@/constants";

export function CurrencySelect({
	value,
	onChange,
}: {
	value: string;
	onChange: (val: string) => void;
}) {
	const [defaultCurrency, setDefaultCurrency] = useState<string>("");

	useEffect(() => {
		try {
			const userLocale = navigator.language;

			const matchedCurrency = currencies.find(
				(c) => c.locale === userLocale,
			)?.value;
			const fallbackCurrency = new Intl.NumberFormat(userLocale, {
				style: "currency",
				currency: "USD",
			}).resolvedOptions().currency;

			const detectedCurrency = matchedCurrency || fallbackCurrency || "USD";

			const isValidCurrency = currencies.some(
				(c) => c.value === detectedCurrency,
			);

			if (isValidCurrency) {
				setDefaultCurrency(detectedCurrency);
				if (!value) onChange(detectedCurrency);
			}
		} catch (err) {
			console.error("Could not detect currency", err);
		}
	}, [value, onChange]);

	return (
		<Select onValueChange={onChange} value={value || defaultCurrency}>
			<SelectTrigger>
				<SelectValue placeholder="Select currency" />
			</SelectTrigger>
			<SelectContent>
				{currencies
					.sort((a, b) => a.label.localeCompare(b.label))
					.map((currency) => (
						<SelectItem
							className="cursor-pointer"
							key={currency.value}
							value={currency.value}
						>
							{currency.label} ({currency.symbol})
						</SelectItem>
					))}
			</SelectContent>
		</Select>
	);
}
