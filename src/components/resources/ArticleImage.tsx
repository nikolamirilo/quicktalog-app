import Image from "next/image";

import { textLinkClass } from "@/components/general/TextLink";

interface Props {
	/** /public path OR https remote URL (next.config allows any host) */
	src: string;
	/** Real, descriptive alt text for SEO and accessibility */
	alt: string;
	caption?: string;
	credit?: { name: string; url: string };
	priority?: boolean;
	/** Cap the rendered width, e.g. "400px" or "60%". */
	maxWidth?: string;
	/** Cap the rendered height, e.g. "300px". Image scales down to fit. */
	maxHeight?: string;
	/**
	 * Tailwind classes on the image wrapper - use to control alignment.
	 * "mr-auto" = left · "mx-auto" = center (default when maxWidth is set) · "ml-auto" = right
	 */
	className?: string;
}

/** Captioned illustration or photo in a soft framed panel. Natural aspect ratio, no cropping. */
export function ArticleImage({
	src,
	alt,
	caption,
	credit,
	priority,
	maxWidth,
	maxHeight,
	className,
}: Props) {
	const wrapperClass = className ?? (maxWidth ? "mx-auto" : undefined);

	return (
		<figure className="!my-7">
			<div className="overflow-hidden rounded-product-card border border-product-border bg-[radial-gradient(90%_90%_at_80%_0%,#fff1d2_0%,#fffbf1_55%,#fffdf8_100%)] p-3 shadow-product sm:p-4">
				<div className={wrapperClass} style={{ maxWidth }}>
					<Image
						alt={alt}
						className="rounded-[14px]"
						height={0}
						priority={priority}
						sizes="(max-width: 768px) 100vw, 720px"
						src={src}
						style={{ height: "auto", maxHeight, width: "100%" }}
						width={0}
					/>
				</div>
			</div>
			{(caption || credit) && (
				<figcaption className="mt-2.5 text-center text-[13.5px] leading-[1.5] text-product-muted">
					{caption}
					{credit && (
						<>
							{" "}
							Photo via{" "}
							<a
								className={textLinkClass}
								href={credit.url}
								rel="nofollow noopener"
								target="_blank"
							>
								{credit.name}
							</a>
							.
						</>
					)}
				</figcaption>
			)}
		</figure>
	);
}
