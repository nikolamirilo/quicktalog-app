"use client";
import { useState } from "react";
import { FiPlay } from "react-icons/fi";

const Demo = () => {
	const [playing, setPlaying] = useState(false);

	return (
		<section className="py-10 lg:py-20 px-4 bg-product-background">
			<h2 className="text-center text-3xl font-bold text-product-foreground mb-3">
				See It in Action
			</h2>
			<p className="text-center text-product-foreground-accent max-w-xl mx-auto mb-8">
				Watch how easy it is to create a professional digital catalog in
				minutes.
			</p>

			<div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
				{/* iframe always in DOM inside a hidden wrapper — browser still preloads it */}
				<div className={playing ? "" : "hidden"}>
					<div
						style={{
							position: "relative",
							paddingBottom: "calc(53.35%)",
							height: 0,
						}}
					>
						<iframe
							allowFullScreen
							height="100%"
							src="https://app.usehexus.com/embed/254bfe62-3496-414e-93e8-5447b8fa54a9?hide_hotspot=true"
							style={{ position: "absolute", top: 0, left: 0, border: 0 }}
							title="Hexus Flow"
							width="100%"
						/>
					</div>
				</div>

				{/* thumbnail overlay — unmounted once playing so iframe takes over */}
				{!playing && (
					<button
						aria-label="Play demo video"
						className="group relative block w-full cursor-pointer focus:outline-none"
						onClick={() => setPlaying(true)}
					>
						<img
							alt="Quicktalog product preview"
							className="w-full object-cover"
							src="/images/quicktalog-banner.png"
						/>

						<div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

						<div className="absolute inset-0 flex items-center justify-center">
							<div className="flex h-20 w-20 items-center justify-center rounded-full bg-product-primary shadow-xl group-hover:scale-110 transition-transform duration-300">
								<FiPlay className="h-8 w-8 translate-x-0.5 text-white" />
							</div>
						</div>

						<div className="absolute bottom-6 left-0 right-0 flex justify-center">
							<span className="rounded-full bg-black/50 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
								Watch the demo
							</span>
						</div>
					</button>
				)}
			</div>
		</section>
	);
};

export default Demo;
