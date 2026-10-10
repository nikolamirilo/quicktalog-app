export type NavIcon = React.ComponentType<{
	size?: number;
	className?: string;
}>;

export interface NavItem {
	text: string;
	url: string;
	description: string;
	icon: NavIcon;
}

export interface NavMenu {
	label: string;
	items: NavItem[];
}
