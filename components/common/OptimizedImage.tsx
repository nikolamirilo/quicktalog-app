"use client";
import Image from "next/image";
import { useState } from "react";

export const SkeletonLoader = ({ className }: { className?: string }) => (
	<div
		className={`${className} bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 relative overflow-hidden rounded-sm`}
	>
		{/* Shimmer effect */}
		<div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

		{/* Center placeholder div */}
		<div className="flex items-center justify-center h-full">
			<div className="w-[75%] h-[75%] bg-gray-200 rounded-xl" />
		</div>
	</div>
);

export const OptimizedImage = ({
	src,
	alt,
	className,
	priority = false,
	type = "basic",
}: {
	src: string;
	alt: string;
	className?: string;
	priority?: boolean;
	type?: "basic" | "next";
}) => {
	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [showImage, setShowImage] = useState(false);

	if (hasError) {
		return (
			<img
				alt={alt}
				className={`${className} absolute inset-0 transition-all duration-500 ease-out object-cover w-full h-full opacity-100 scale-100
				`}
				loading="eager"
				sizes="(max-width: 768px) 40vw, 20vw"
				src="https://vgrutvaw2q.ufs.sh/f/X7AUkOrs4vhbBxZSgiECZj8HKxV2bkXdTwltoU3hRaDYAm9q"
			/>
		);
	}

	return (
		<div className="relative w-full h-full">
			{/* Skeleton Loader - shown while loading */}
			{(isLoading || !showImage) && (
				<div className="absolute inset-0 z-10">
					<SkeletonLoader className="w-full h-full" />
				</div>
			)}

			{type === "next" ? (
				/* Next.js Image */
				<Image
					alt={alt}
					className={`${className} transition-all duration-500 ease-out ${
						showImage ? "opacity-100 scale-100" : "opacity-0 scale-102"
					}`}
					fill
					loading={priority ? "eager" : "lazy"}
					onError={() => {
						setHasError(true);
						setIsLoading(false);
						setShowImage(false);
					}}
					onLoad={() => {
						setIsLoading(false);
						setShowImage(true);
					}}
					onLoadStart={() => {
						setIsLoading(true);
						setShowImage(false);
					}}
					priority={priority}
					quality={85}
					sizes="(max-width: 768px) 40vw, 20vw"
					src={src}
				/>
			) : (
				/* Regular HTML img */
				<img
					alt={alt}
					className={`${className} absolute inset-0 transition-all duration-500 ease-out object-cover w-full h-full ${
						showImage ? "opacity-100 scale-100" : "opacity-0 scale-102"
					}`}
					decoding="async"
					loading={priority ? "eager" : "lazy"}
					onError={() => {
						setHasError(true);
						setIsLoading(false);
						setShowImage(false);
					}}
					onLoad={() => {
						setIsLoading(false);
						setShowImage(true);
					}}
					sizes="(max-width: 768px) 40vw, 20vw"
					src={src}
				/>
			)}
		</div>
	);
};
