import type { Skill } from "@/agent/skills/types";

export const responsiveDesign: Skill = {
	name: "responsive-design",
	description: "Layout rules every code fragment must follow.",
	load: "on-demand",
	when: "you are about to write or change the code of a custom_code or embedding section, before you write the fragment",
	applies: ({ sectionTypes }) =>
		sectionTypes.includes("custom_code") || sectionTypes.includes("embedding"),
	requiredFor: ({ tool, input }) =>
		(tool === "addSection" || tool === "updateSection") &&
		typeof input.code === "string" &&
		input.code.trim().length > 0,
	content: `RESPONSIVE DESIGN:
Applies to every fragment you write for a custom_code or embedding section. Most catalogues are opened from a QR code on a phone, so mobile is the default case, not the edge case.
- Design for 320px width first, then let the layout grow. Never assume a desktop viewport.
- Never set a fixed pixel width on anything that holds content. Use percentages, fr units, max-width, or let the box size itself.
- Always set "max-width: 100%" on images, tables, iframes and any embed, and "box-sizing: border-box" on your own elements. Nothing may cause sideways scrolling.
- Lay things out with flexbox or grid and let them reflow: "flex-wrap: wrap" on flex rows, and "grid-template-columns: repeat(auto-fit, minmax(Xpx, 1fr))" for card grids. Prefer a layout that reflows on its own over one that depends on breakpoints.
- Size text with clamp(), for example "clamp(0.9rem, 2.5vw, 1.1rem)". Never hard-code a font size that only reads well on one screen.
- Your widget can be rendered inside a narrow column, so never rely on the viewport matching the space it actually gets. When you do need a breakpoint, use a media query, and treat it as a refinement rather than the thing holding the layout together.
- Anything tappable needs a hit area of at least 44px by 44px, with enough spacing that neighbouring controls cannot be hit by mistake.
- Keep an iframe or video fluid with an aspect-ratio wrapper ("aspect-ratio: 16 / 9; width: 100%"), never a fixed height.
- Long words, prices and URLs must not force the page wider: use "overflow-wrap: anywhere" where text could be unbroken.
- Before you finish, check the fragment reads correctly at roughly 320px, 768px and 1200px wide.`,
};
