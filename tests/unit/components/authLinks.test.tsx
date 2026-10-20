// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
	state: {
		isLoaded: true,
		isSignedIn: true,
		user: { id: "u1", name: "John Doe", email: "john@example.com" },
		accountHref: "/admin/dashboard?tab=settings",
		signOut: async () => {},
	},
	pathname: "/",
}));

vi.mock("@/context/AuthContext", () => ({ useAuth: () => auth.state }));
vi.mock("next/navigation", () => ({
	usePathname: () => auth.pathname,
	useRouter: () => ({ push: vi.fn() }),
}));
// The avatar menu is Radix; what matters here is only whether it is rendered.
vi.mock("@/components/navigation/UserMenu", () => ({
	UserMenu: () => <button type="button">Account menu</button>,
	UserAvatar: () => <span />,
}));

import { AuthLinks } from "@/components/navigation/AuthLinks";

describe("AuthLinks", () => {
	beforeEach(() => {
		auth.state.isLoaded = true;
		auth.state.isSignedIn = true;
		auth.pathname = "/";
	});
	afterEach(cleanup);

	it("shows Dashboard and the account menu to a signed-in user", () => {
		render(<AuthLinks />);
		expect(screen.getByText("Dashboard")).toBeTruthy();
		expect(screen.getByText("Account menu")).toBeTruthy();
		expect(screen.queryByText("Log In")).toBeNull();
	});

	it("renders no auth corner on the consent step", () => {
		auth.pathname = "/auth/consent";
		const { container } = render(<AuthLinks />);
		expect(container.firstChild).toBeNull();
	});

	it.each(["mobile-cta", "sheet"] as const)(
		"renders nothing in the %s variant on the consent step",
		(variant) => {
			auth.pathname = "/auth/consent";
			const { container } = render(<AuthLinks variant={variant} />);
			expect(container.firstChild).toBeNull();
		},
	);

	it("renders no auth corner on the consent step before auth state loads", () => {
		auth.pathname = "/auth/consent";
		auth.state.isLoaded = false;
		const { container } = render(<AuthLinks />);
		expect(container.firstChild).toBeNull();
	});

	it("does not treat other auth routes as part of the consent step", () => {
		auth.pathname = "/auth/consents";
		render(<AuthLinks />);
		expect(screen.getByText("Dashboard")).toBeTruthy();
	});
});
