// @vitest-environment happy-dom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

import {
	GUARD_STATE_KEY,
	inAppDestination,
	useNavigationGuard,
} from "@/hooks/useBeforeUnload";

const EDITOR = "/admin/bean-there/qr-editor";

beforeEach(() => {
	window.history.replaceState({ __NA: true }, "", EDITOR);
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	document.body.innerHTML = "";
});

const guardEntries = (push: ReturnType<typeof vi.spyOn>) =>
	push.mock.calls.filter(([state]) =>
		Boolean((state as Record<string, unknown>)?.[GUARD_STATE_KEY]),
	);

/** What the browser does on Back from our guard entry: same URL, the old state. */
const pressBack = () => {
	window.history.replaceState({ __NA: true }, "", EDITOR);
	window.dispatchEvent(
		new PopStateEvent("popstate", { state: { __NA: true } }),
	);
};

describe("useNavigationGuard: history", () => {
	it("adds one tagged entry that keeps Next's state", () => {
		const push = vi.spyOn(window.history, "pushState");
		renderHook(() => useNavigationGuard(true));
		expect(push).toHaveBeenCalledTimes(1);
		expect(push.mock.calls[0][0]).toEqual({
			__NA: true,
			[GUARD_STATE_KEY]: true,
		});
		expect(window.history.state[GUARD_STATE_KEY]).toBe(true);
	});

	it("does not stack entries when the page turns dirty again", () => {
		const push = vi.spyOn(window.history, "pushState");
		const { rerender } = renderHook(({ dirty }) => useNavigationGuard(dirty), {
			initialProps: { dirty: true },
		});
		rerender({ dirty: false });
		rerender({ dirty: true });
		rerender({ dirty: false });
		rerender({ dirty: true });
		expect(guardEntries(push)).toHaveLength(1);
	});

	it("adds nothing while the page is clean", () => {
		const push = vi.spyOn(window.history, "pushState");
		renderHook(() => useNavigationGuard(false));
		expect(push).not.toHaveBeenCalled();
	});

	it("asks on Back, puts the entry back, and on Leave goes past both copies", () => {
		const go = vi.spyOn(window.history, "go").mockImplementation(() => {});
		const push = vi.spyOn(window.history, "pushState");
		vi.spyOn(window.history, "length", "get").mockReturnValue(5);
		const onLeave = vi.fn();
		const { result } = renderHook(() => useNavigationGuard(true, onLeave));

		act(() => pressBack());
		expect(result.current.isOpen).toBe(true);
		expect(guardEntries(push)).toHaveLength(2);
		expect(window.history.state[GUARD_STATE_KEY]).toBe(true);

		act(() => result.current.confirm());
		expect(onLeave).toHaveBeenCalledTimes(1);
		expect(go).toHaveBeenCalledWith(-2);
		expect(router.push).not.toHaveBeenCalled();
	});

	it("goes to the dashboard when the tab opened on this page", () => {
		const go = vi.spyOn(window.history, "go").mockImplementation(() => {});
		vi.spyOn(window.history, "length", "get").mockReturnValue(2);
		const { result } = renderHook(() => useNavigationGuard(true));
		act(() => pressBack());
		act(() => result.current.confirm());
		expect(go).not.toHaveBeenCalled();
		expect(router.push).toHaveBeenCalledWith("/admin/dashboard");
	});

	it("stays on Stay, and ignores its own popstate after Leave", () => {
		vi.spyOn(window.history, "go").mockImplementation(() => {});
		const { result } = renderHook(() => useNavigationGuard(true));
		act(() => pressBack());
		act(() => result.current.cancel());
		expect(result.current.isOpen).toBe(false);

		act(() => pressBack());
		act(() => result.current.confirm());
		act(() => pressBack());
		expect(result.current.isOpen).toBe(false);
	});
});

describe("useNavigationGuard: links and unload", () => {
	const link = (href: string, attrs: Record<string, string> = {}) => {
		const a = document.createElement("a");
		a.href = href;
		for (const [k, v] of Object.entries(attrs)) a.setAttribute(k, v);
		a.textContent = "go";
		document.body.append(a);
		return a;
	};

	it("holds an in-app link and continues with the router on Leave", () => {
		const { result } = renderHook(() => useNavigationGuard(true));
		const a = link("/admin/dashboard?tab=all");
		const event = new MouseEvent("click", { bubbles: true, cancelable: true });
		act(() => {
			a.dispatchEvent(event);
		});
		expect(event.defaultPrevented).toBe(true);
		expect(result.current.isOpen).toBe(true);
		act(() => result.current.confirm());
		expect(router.push).toHaveBeenCalledWith("/admin/dashboard?tab=all");
	});

	it("prompts before unload only while dirty", () => {
		const { rerender } = renderHook(({ dirty }) => useNavigationGuard(dirty), {
			initialProps: { dirty: true },
		});
		const dirtyEvent = new Event("beforeunload", { cancelable: true });
		window.dispatchEvent(dirtyEvent);
		expect(dirtyEvent.defaultPrevented).toBe(true);

		rerender({ dirty: false });
		const cleanEvent = new Event("beforeunload", { cancelable: true });
		window.dispatchEvent(cleanEvent);
		expect(cleanEvent.defaultPrevented).toBe(false);
	});
});

describe("inAppDestination", () => {
	const here = {
		href: `https://app.test${EDITOR}`,
		origin: "https://app.test",
		pathname: EDITOR,
		search: "",
	};
	const click = (over: Partial<MouseEvent> = {}) => ({
		button: 0,
		metaKey: false,
		ctrlKey: false,
		shiftKey: false,
		altKey: false,
		defaultPrevented: false,
		...over,
	});
	const a = (href: string, attrs: Record<string, string> = {}) => {
		const el = document.createElement("a");
		el.setAttribute("href", href);
		for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
		return el;
	};

	it("returns the path of a same-origin link", () => {
		expect(inAppDestination(click(), a("/pricing#faq"), here)).toBe(
			"/pricing#faq",
		);
	});

	it("leaves links that open elsewhere to the browser", () => {
		for (const over of [
			{ metaKey: true },
			{ ctrlKey: true },
			{ shiftKey: true },
			{ altKey: true },
			{ button: 1 },
		]) {
			expect(inAppDestination(click(over), a("/pricing"), here)).toBeNull();
		}
		expect(
			inAppDestination(click(), a("/pricing", { target: "_blank" }), here),
		).toBeNull();
		expect(
			inAppDestination(click(), a("/file.png", { download: "" }), here),
		).toBeNull();
		expect(
			inAppDestination(click(), a("https://other.test/"), here),
		).toBeNull();
	});

	it("ignores fragment links on the same page", () => {
		expect(inAppDestination(click(), a("#preview"), here)).toBeNull();
		expect(inAppDestination(click(), a(`${EDITOR}#x`), here)).toBeNull();
	});
});
