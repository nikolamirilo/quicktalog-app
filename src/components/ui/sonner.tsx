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
						"group toast group-[.toaster]:rounded-2xl group-[.toaster]:border-0 group-[.toaster]:bg-product-foreground group-[.toaster]:font-product-body group-[.toaster]:text-white group-[.toaster]:shadow-product-hover [&_[data-icon]]:text-product-primary",
					description: "group-[.toast]:text-white/75",
					actionButton:
						"group-[.toast]:!rounded-full group-[.toast]:!bg-product-primary group-[.toast]:!font-semibold group-[.toast]:!text-product-foreground",
					cancelButton:
						"group-[.toast]:!rounded-full group-[.toast]:!bg-white/10 group-[.toast]:!text-white",
					error: "[&_[data-icon]]:!text-[#ff8a80]",
				},
			}}
			{...props}
		/>
	);
};

export { Toaster };
