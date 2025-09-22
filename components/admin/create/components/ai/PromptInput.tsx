import { Textarea } from "@/components/ui/textarea"

const PromptInput = ({ prompt, touched, errors, setPrompt }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="prompt" className="text-sm font-medium text-product-foreground">
        Services Description<span className="text-red-500 ml-1">*</span>
      </label>
      <Textarea
        id="prompt"
        placeholder="e.g., A modern beauty salon specializing in premium hair treatments, nail services, and skincare..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={6}
        className="resize-none border border-product-border focus:border-product-primary focus:ring-product-primary bg-transparent text-product-foreground transition-colors"
      />
      {touched.prompt && errors.prompt && (
        <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
          {errors.prompt}
        </div>
      )}
      <p className="text-xs text-product-foreground-accent">{prompt.length} characters</p>
    </div>
  )
}

export default PromptInput
