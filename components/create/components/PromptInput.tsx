import { Textarea } from "@/components/ui/textarea";

const PromptInput = ({ prompt, errors, setPrompt }) => {
	return (
		<div className="space-y-1">
			<label
				className="text-sm font-medium flex flex-col gap-2"
				htmlFor="prompt"
			>
				<span className="text-product-foreground ">
					Prompt<span className="text-red-500 ml-1">*</span>
				</span>
				<div>
					<span className="text-product-primary font-bold">Hint: </span>
					<span className="text-product-foreground-accent">
						For best results, provide a detailed prompt describing your business
						type and the categories you want to include.
					</span>
				</div>
			</label>
			<Textarea
				className="resize-none border border-product-border focus:border-product-primary focus:ring-product-primary bg-transparent text-product-foreground transition-colors"
				id="prompt"
				onChange={(e) => setPrompt(e.target.value)}
				placeholder="e.g. A burger place that serves classic and specialty burgers, crispy fries, fresh salads, and homemade milkshakes. You can also add sides like onion rings and drinks for a full meal experience."
				rows={6}
				value={prompt}
			/>
			{errors.prompt && (
				<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
					{errors.prompt}
				</div>
			)}
			<p className="text-xs text-product-foreground-accent">
				{prompt.length} characters
			</p>
		</div>
	);
};

export default PromptInput;
