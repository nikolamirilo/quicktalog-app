const ContentBlockButton = ({
	setIsAddContentOpen,
}: {
	setIsAddContentOpen: (open: boolean) => void;
}) => {
	return (
		<div className="max-w-6xl mx-auto px-4 block">
			<button
				className="
					mt-4 w-full group
					border-2 border-dashed border-border
					bg-background rounded-xl
					flex flex-col items-center justify-center gap-3
					cursor-pointer relative overflow-hidden
					transition-all duration-300 ease-out
					py-14
					hover:border-primary hover:bg-catalogue-section-background
					hover:-translate-y-0.5 hover:shadow-lg
					active:translate-y-0 active:shadow-sm
				"
				onClick={() => setIsAddContentOpen(true)}
			>
				{/* Subtle radial glow on hover */}
				<span
					className="
						pointer-events-none absolute inset-0 opacity-0
						group-hover:opacity-100 transition-opacity duration-300
						bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,hsl(var(--catalogue-primary)/0.07),transparent)]
					"
					aria-hidden="true"
				/>

				<img
					alt=""
					aria-hidden="true"
					className="
						w-[180px] h-[180px] relative z-10
						transition-transform duration-300 ease-out
						group-hover:-translate-y-1 group-hover:scale-105
					"
					src="/builder/content.svg"
				/>

				<div className="relative z-10 flex flex-col items-center gap-1">
					<span className="text-xl font-medium text-foreground transition-colors duration-200 group-hover:text-primary">
						Add Section
					</span>
					<span className="text-sm text-muted-foreground opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
						Click to choose a section type
					</span>
				</div>
			</button>
		</div>
	);
};

export default ContentBlockButton;
