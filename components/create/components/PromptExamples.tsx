import { RiLightbulbLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { examplePrompts } from "@/constants/ui";

import type { PromptExamplesProps } from "@/types/components";

const PromptExamples: React.FC<PromptExamplesProps> = ({
	setPrompt,
	disabled,
}) => {
	return (
		<div className="mt-8 pt-6 border-t border-product-border">
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-product-foreground flex items-center gap-2">
					<RiLightbulbLine className="text-primary-accent" />
					Business Examples
				</h3>
				<p className="text-product-foreground-accent text-sm">
					Choose your business type or get inspired
				</p>
			</div>
			<div className="grid gap-3">
				{examplePrompts.map((example, index) => (
					<Button
						className="text-left p-4 rounded-lg bg-transparent hover:bg-product-hover-background border border-product-border transition-all group !h-fit max-w-full text-wrap"
						disabled={disabled}
						key={`example-${index}`}
						onClick={() => setPrompt(example.prompt)}
						variant="ghost"
					>
						<div className="flex flex-row justify-start items-center w-full h-full gap-3">
							<div className="w-8 h-8 rounded-full bg-primary-accent/10 flex items-center justify-center group-hover:bg-primary-accent/20 transition-colors">
								<span className="text-product-primary">{example.icon}</span>
							</div>
							<div className="flex-1">
								<div className="text-product-foreground font-bold group-hover:text-product-primary mb-1">
									{example.category}
								</div>
								<div className="text-sm text-product-foreground-accent group-hover:text-product-primary">
									{example.prompt}
								</div>
							</div>
						</div>
					</Button>
				))}
			</div>
		</div>
	);
};

export default PromptExamples;
