export interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
}

export interface MobileNavLinkProps {
    href: string;
    children: React.ReactNode;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    onClick: () => void;
}