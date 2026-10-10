"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			className="toaster group"
			theme="light"
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:rounded-2xl group-[.toaster]:border group-[.toaster]:border-product-border group-[.toaster]:bg-product-card group-[.toaster]:font-product-body group-[.toaster]:text-product-foreground group-[.toaster]:shadow-product-hover [&_[data-icon]]:text-product-primary-ink",
					description: "group-[.toast]:text-product-muted",
					actionButton:
						"group-[.toast]:!rounded-full group-[.toast]:!bg-product-primary group-[.toast]:!font-semibold group-[.toast]:!text-product-primary-ink",
					cancelButton:
						"group-[.toast]:!rounded-full group-[.toast]:!bg-product-background group-[.toast]:!text-product-foreground",
					error: "[&_[data-icon]]:!text-product-error",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
