/**
 * Root classes for a panel tab. The panel's ScrollArea lays its content out as
 * a table, which grows to fit the widest unbroken line (a long partner name,
 * a pasted URL). `contain: inline-size` stops the tab's content from sizing
 * it, so the tab always takes the panel's width and long text truncates.
 */
export const PANEL_TAB_ROOT = "font-product-body [contain:inline-size]";
