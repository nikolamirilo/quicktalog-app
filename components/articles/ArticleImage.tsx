import Image from "next/image";

interface Props {
	/** /public path OR https remote URL (next.config allows any host) */
	src: string;
	/** Real, descriptive alt text for SEO and accessibility */
	alt: string;
	caption?: string;
	credit?: { name: string; url: string };
	priority?: boolean;
}

/** Captioned next/image with a soft rounded frame. Works with local or remote src. */
export default function ArticleImage({
	src,
	alt,
	caption,
	credit,
	priority,
}: Props) {
	return (
		<figure className="my-8">
			<div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl ring-1 ring-product-border shadow-md">
				<Image
					alt={alt}
					className="object-cover"
					fill
					priority={priority}
					sizes="(max-width: 768px) 100vw, 768px"
					src={src}
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
