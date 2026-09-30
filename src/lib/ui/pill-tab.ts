/**
 * The pills of a horizontally scrolling tab bar on phones: dashboard tabs and
 * the builder's section type picker share them.
 */
export const pillTab = {
	base: "inline-flex h-10 flex-none items-center gap-[7px] whitespace-nowrap rounded-full border border-product-border bg-product-card px-3.5 text-sm font-semibold text-product-foreground-accent [&_svg]:size-4",
	active:
		"border-product-primary bg-product-primary-soft font-bold text-product-foreground [&_svg]:text-product-primary-ink",
};

/** The scrolling row the pills sit in; its scrollbar is hidden. */
export const pillTabBar =
	"flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
