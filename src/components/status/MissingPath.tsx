"use client";
import { useEffect, useState } from "react";

/**
 * "We looked for /x but it isn't here." Read after mount: the 404 page can be
 * served prerendered, so the server never knows the requested path.
 */
export function MissingPath() {
	const [path, setPath] = useState<string | null>(null);

	useEffect(() => {
		setPath(window.location.pathname);
	}, []);

	if (!path || path === "/") return null;

	return (
		<p className="mt-3 max-w-full text-[14.5px] text-product-muted [overflow-wrap:anywhere]">
			We looked for{" "}
			<code className="rounded-lg border border-product-border bg-product-background-hero px-2 py-0.5 font-mono text-[13.5px] font-medium text-product-foreground">
				{path}
			</code>{" "}
			but it isn't here.
		</p>
	);
}
