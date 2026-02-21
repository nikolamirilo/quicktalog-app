const ContentBlockButton = ({
	setIsAddContentOpen,
}: {
	setIsAddContentOpen: (open: boolean) => void;
}) => {
	return (
		<div className="max-w-6xl mx-auto px-4 block">
			<button
				className="mt-4 w-full group border-2 border-dashed border-border bg-background rounded-xl flex flex-col items-center justify-center relative cursor-pointer transition-all hover:bg-section-hover hover:border-primary hover:scale-[1.01] py-12"
				onClick={() => setIsAddContentOpen(true)}
			>
				<img
					alt="Add Content"
					className="w-[200px] h-[200px]"
					src="/builder/content.svg"
				/>
				<span className="text-2xl text-foreground">Add Content Block</span>
			</button>
		</div>
	);
};

export default ContentBlockButton;
