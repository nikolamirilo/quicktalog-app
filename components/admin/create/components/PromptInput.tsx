import { Textarea } from "@/components/ui/textarea";

const PromptInput = ({ prompt, touched, errors, setPrompt }) => {
	return (
		<div className="space-y-1">
			<label
				className="text-sm font-medium text-product-foreground"
				htmlFor="prompt"
			>
				Prompt<span className="text-red-500 ml-1">*</span>
			</label>
			<Textarea
				className="resize-none border border-product-border focus:border-product-primary focus:ring-product-primary bg-transparent text-product-foreground transition-colors"
				id="prompt"
				onChange={(e) => setPrompt(e.target.value)}
				placeholder="e.g. Exotic sandwiches, tortillas & salads along with wide variety of fresh natural juices."
				rows={6}
				value={prompt}
			/>
			{touched.prompt && errors.prompt && (
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
