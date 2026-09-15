"use client";

import type { CustomCodeBlock } from "@quicktalog/common";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import BlockControls from "../cards/common/BlockControls";

/**
 * Height the frame starts at, before the widget has reported its own. Small
 * enough not to leave a hole under a compact widget, big enough that the first
 * paint is not a sliver.
 */
const INITIAL_HEIGHT = 200;
/** A runaway widget must not produce an endless page. */
const MAX_HEIGHT = 5000;

/** Tells a height message apart from anything else on the message bus. */
export const WIDGET_MESSAGE = "quicktalog-widget-height";

/**
 * Runs inside the frame. Reports the document's height to the parent so the
 * frame can be sized to its content, which an iframe will not do on its own.
 *
 * `postMessage` still works from a sandboxed frame; the origin it arrives with
 * is "null", which is exactly why the parent matches on `event.source` instead.
 */
const heightReporter = (frameId: string) => `
(function () {
  var last = 0;
  function report() {
    var doc = document.documentElement;
    var height = Math.max(
      doc ? doc.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0
    );
    if (!height || height === last) return;
    last = height;
    parent.postMessage(
      { type: ${JSON.stringify(WIDGET_MESSAGE)}, id: ${JSON.stringify(frameId)}, height: height },
      "*"
    );
  }
  report();
  window.addEventListener("load", report);
  // Images and fonts settle after load; a few late looks cost nothing.
  [50, 250, 800, 2000].forEach(function (delay) { setTimeout(report, delay); });
  if (window.ResizeObserver) {
    new ResizeObserver(report).observe(document.documentElement);
  }
})();
`;

/**
 * The document the fragment is dropped into.
 *
 * Exported so a test can assert what a widget is handed without standing up an
 * iframe. Note there is no escaping of `code` anywhere: that is the point of
 * the sandbox. The markup is meant to run - just nowhere it can do harm.
 */
export function buildWidgetDocument(
	code: string,
	frameId: string,
	font?: string,
): string {
	const fontFamily = font || "system-ui, -apple-system, sans-serif";

	return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    font-family: ${fontFamily};
    /* The catalogue's own variables, so a fragment written against them still
       resolves rather than falling back to nothing. */
    --catalogue-font-body: ${fontFamily};
    --catalogue-font-heading: ${fontFamily};
    overflow-x: hidden;
  }
  img, video, iframe, table, canvas, svg { max-width: 100%; }
</style>
</head>
<body>
${code}
<script>${heightReporter(frameId)}</script>
</body>
</html>`;
}

interface CustomCodeBlockProps {
	block: CustomCodeBlock;
	slug: string;
	onDelete?: () => void;
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	onEdit?: () => void;
	isFirst?: boolean;
	isLast?: boolean;
	mode: "edit" | "view";
}

/**
 * A custom code block, run inside a sandboxed frame.
 *
 * The fragment is arbitrary HTML, CSS and JavaScript, and the AI editor writes
 * it while holding text it did not get from the user - a page read by
 * `fetchUrl`, the OCR of a photo handed over to scan. Mounted into the page it
 * would run same-origin with the app, and in the builder that means inside the
 * owner's signed-in session.
 *
 * No filter over JavaScript source fixes that while still letting widgets run,
 * so the control is isolation instead. `sandbox="allow-scripts"` WITHOUT
 * `allow-same-origin` gives the frame an opaque origin: the widget runs, and it
 * can reach no cookie, no storage, no parent DOM and no credentialed request.
 *
 * Do not add `allow-same-origin`. Together with `allow-scripts` it lets the
 * frame reach out and remove its own sandbox attribute, which undoes all of it.
 *
 * A frame does not size to its content, so the document carries a reporter that
 * posts its height out and the parent sets it here.
 */
const CustomCodeBlockComponent = ({
	block,
	slug,
	onDelete,
	onMoveUp,
	onMoveDown,
	onEdit,
	isFirst,
	isLast,
	mode,
}: CustomCodeBlockProps) => {
	const frameRef = useRef<HTMLIFrameElement>(null);
	const hostRef = useRef<HTMLDivElement>(null);
	const frameId = useId();
	const [height, setHeight] = useState(INITIAL_HEIGHT);
	const [font, setFont] = useState<string>();

	// The frame inherits nothing, so the catalogue's font is carried across by
	// hand. Read once from the host element, which sits inside the themed tree.
	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;
		const resolved = getComputedStyle(host).fontFamily;
		if (resolved) setFont(resolved);
	}, []);

	useEffect(() => {
		const onMessage = (event: MessageEvent) => {
			// The frame is an opaque origin, so `event.origin` is the string "null"
			// and worth nothing. `event.source` cannot be forged by another frame,
			// so identity comes from there and the id only guards against a widget
			// that relays someone else's message.
			if (
				!frameRef.current ||
				event.source !== frameRef.current.contentWindow
			) {
				return;
			}
			const data = event.data as
				| { type?: string; id?: string; height?: unknown }
				| undefined;
			if (data?.type !== WIDGET_MESSAGE || data.id !== frameId) return;

			const reported = Number(data.height);
			if (!Number.isFinite(reported) || reported <= 0) return;
			setHeight(Math.min(Math.ceil(reported), MAX_HEIGHT));
		};

		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [frameId]);

	const document_ = useMemo(
		() => buildWidgetDocument(block.code ?? "", frameId, font),
		[block.code, frameId, font],
	);

	return (
		<section
			aria-label={block.name || undefined}
			className="mb-5 group relative bg-transparent"
			id={`${slug}-${block.order}`}
		>
			{mode === "edit" && (
				<BlockControls
					isFirst={isFirst}
					isLast={isLast}
					onDelete={onDelete}
					onEdit={onEdit}
					onMoveDown={onMoveDown}
					onMoveUp={onMoveUp}
				/>
			)}
			<div className="bg-transparent" ref={hostRef}>
				<iframe
					className="block w-full border-0 bg-transparent"
					ref={frameRef}
					// No allow-same-origin. See the note above the component.
					sandbox="allow-scripts"
					srcDoc={document_}
					style={{ height }}
					title={block.name || "Custom content"}
				/>
			</div>
		</section>
	);
};

export default CustomCodeBlockComponent;
