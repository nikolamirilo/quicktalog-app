import { Button } from "@/components/ui/button";
import { FiCheck } from "react-icons/fi";

const Newsletter = ({
	handleNewsletterSubmit,
	newsletterEmail,
	setNewsletterEmail,
	isSubmitting,
	submitSuccess,
	submitError,
	alreadySubscribed,
}: {
	handleNewsletterSubmit: (e: React.FormEvent) => void;
	newsletterEmail: string;
	setNewsletterEmail: (e: string) => void;
	isSubmitting: boolean;
	submitSuccess: boolean;
	submitError: string;
	alreadySubscribed: boolean;
}) => {
	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 flex items-center">
				<form
					aria-label="Newsletter subscription"
					className="flex items-center space-x-2 w-full"
					onSubmit={handleNewsletterSubmit}
					role="form"
				>
					<div className="relative">
						<label className="sr-only" htmlFor="newsletter-email">
							Email address
						</label>
						<input
							aria-describedby="newsletter-description"
							aria-invalid={submitError ? "true" : "false"}
							className="w-48 text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-catalogue-card-background text-catalogue-card-text border border-catalogue-card-border"
							disabled={isSubmitting || submitSuccess || alreadySubscribed}
							id="newsletter-email"
							onChange={(e) => setNewsletterEmail(e.target.value)}
							placeholder="your@email.com"
							required
							type="email"
							value={newsletterEmail}
						/>
					</div>
					<Button
						aria-label="Subscribe to newsletter"
						className={`font-heading tracking-heading text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:scale-105 border footer-cta-button flex items-center gap-2 ${
							submitSuccess
								? "bg-green-500 text-white border-green-500 hover:bg-green-600"
								: alreadySubscribed
									? "bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
									: "hover:bg-primary/10 hover:text-primary bg-catalogue-card-background text-foreground border-primary"
						}`}
						disabled={isSubmitting || submitSuccess || alreadySubscribed}
						size="default"
						type="submit"
						variant="outline"
					>
						{isSubmitting ? (
							<span>Subscribing...</span>
						) : submitSuccess ? (
							<div className="flex items-center gap-2">
								<FiCheck className="w-4 h-4" />
								<span>Subscribed</span>
							</div>
						) : alreadySubscribed ? (
							<div className="flex items-center gap-2">
								<FiCheck className="w-4 h-4" />
								<span>Already subscribed</span>
							</div>
						) : (
							<span>Subscribe</span>
						)}
					</Button>
					{submitError && (
						<p
							aria-live="polite"
							className="text-red-500 text-xs absolute -bottom-6 left-0"
							role="alert"
						>
							{submitError}
						</p>
					)}
				</form>
			</div>
		</div>
	);
};

export default Newsletter;
