export type NavIcon = React.ComponentType<{
	size?: number;
	className?: string;
}>;

export interface NavLinkProps {
	href: string;
	children: React.ReactNode;
	icon?: React.ComponentType<{ className?: string }>;
	className?: string;
}

export interface MobileNavLinkProps {
	href: string;
	children: React.ReactNode;
	icon?: NavIcon;
	onClick: () => void;
}

export interface NavItem {
	text: string;
	url: string;
	description: string;
	icon: NavIcon;
}

export interface NavMenu {
	label: string;
	icon: NavIcon;
	items: NavItem[];
}

export interface NavDropdownProps {
	menu: NavMenu;
	isOpen: boolean;
	onToggle: (label: string) => void;
	onClose: () => void;
}

export interface MobileNavSectionProps {
	menu: NavMenu;
	isOpen: boolean;
	onToggle: (label: string) => void;
	onLinkClick: () => void;
}
