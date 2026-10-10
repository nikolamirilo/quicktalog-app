/**
 * Sizes of the builder frame, shared by the frame itself and by the edit-mode
 * catalogue, which reserves room for it. Tailwind only sees literal class
 * names, so the widths are spelled out in each class rather than interpolated.
 *
 * - Rail: 72px on the right from `md`.
 * - Editor panel: 440px to the left of the rail. From 1280px it pushes the
 *   catalogue (72 + 440 = 512px of right padding); below that it overlays it.
 * - Phone bottom bar: 4rem plus the safe area.
 */
export const BUILDER_WIDE_QUERY = "(min-width: 1280px)";

/** Edit-mode padding on the catalogue root so no content sits under the frame. */
export const builderFramePadding = (isPanelOpen: boolean) =>
	[
		"pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0 md:pr-[72px]",
		"transition-[padding] duration-300 motion-reduce:transition-none",
		isPanelOpen ? "min-[1280px]:pr-[512px]" : "",
	].join(" ");
