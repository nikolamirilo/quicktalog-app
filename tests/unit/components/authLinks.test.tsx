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

	it("keeps Log In and Start free on the consent step", () => {
		auth.pathname = "/auth/consent";
		render(<AuthLinks />);
		expect(screen.getByText("Log In")).toBeTruthy();
		expect(screen.getByText("Start free")).toBeTruthy();
		expect(screen.queryByText("Dashboard")).toBeNull();
		expect(screen.queryByText("Account menu")).toBeNull();
	});

	it("keeps the mobile Start free button on the consent step", () => {
		auth.pathname = "/auth/consent";
		render(<AuthLinks variant="mobile-cta" />);
		expect(screen.getByText("Start free")).toBeTruthy();
	});

	it("keeps the logged-out block in the mobile sheet on the consent step", () => {
		auth.pathname = "/auth/consent";
		render(<AuthLinks variant="sheet" />);
		expect(screen.getByText("Log In")).toBeTruthy();
		expect(screen.queryByText("Sign out")).toBeNull();
	});

	it("does not treat other auth routes as part of the consent step", () => {
		auth.pathname = "/auth/consents";
		render(<AuthLinks />);
		expect(screen.getByText("Dashboard")).toBeTruthy();
	});
});
