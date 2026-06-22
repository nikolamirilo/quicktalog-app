import Image from "next/image";

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

/** Captioned next/image. Renders at natural aspect ratio - no cropping. */
export default function ArticleImage({
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
		<figure className="my-6">
			<div className={wrapperClass} style={{ maxWidth }}>
				<Image
					alt={alt}
					height={0}
					priority={priority}
					sizes="(max-width: 768px) 100vw, 768px"
					src={src}
					style={{ height: "auto", maxHeight, width: "100%" }}
					width={0}
				/>
			</div>
			{(caption || credit) && (
				<figcaption className="mt-3 text-center text-sm text-product-foreground-accent">
					{caption}
					{credit && (
						<>
							{" "}
							Photo via{" "}
							<a
								className="underline"
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
