"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ContactFormProps {
	name: string;
	setName: (value: string) => void;
	company: string;
	setCompany: (value: string) => void;
	email: string;
	setEmail: (value: string) => void;
	subject: string;
	setSubject: (value: string) => void;
	message: string;
	setMessage: (value: string) => void;
	isLoading: boolean;
	handleSubmit: (e: React.MouseEvent) => void;
}

const subjectOptions = [
	"Custom Plan",
	"Pricing Questions",
	"Technical Support",
	"Feature Request",
	"Partnership",
	"General Inquiry",
	"Other",
];

// Email validation regex (simple version)
const isValidEmail = (email: string) =>
	/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const ContactForm = ({
	name,
	setName,
	company,
	setCompany,
	email,
	setEmail,
	subject,
	setSubject,
	message,
	setMessage,
	isLoading,
	handleSubmit,
}: ContactFormProps) => {
	return (
		<div className="bg-product-background rounded-3xl shadow-md p-8 md:p-12 border border-product-border">
			<div className="space-y-8">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Name Field */}
					<div className="space-y-2">
						<label
							className="block text-sm font-semibold text-product-foreground mb-2"
							htmlFor="name"
						>
							Full name
						</label>
						<div className="relative">
							<input
								className="w-full px-4 py-4 bg-product-background border-2 border-product-border rounded-xl text-product-foreground placeholder-product-foreground-accent/60 focus:outline-none focus:border-product-primary focus:bg-product-background-hover transition-all duration-300 shadow-product-shadow hover:shadow-product-shadow-hover"
								id="name"
								onChange={(e) => setName(e.target.value)}
								placeholder="Jane Doe"
								required
								type="text"
								value={name}
							/>
							<div className="absolute inset-y-0 right-4 flex items-center">
								<svg
									className="w-5 h-5 text-product-icon"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
									/>
								</svg>
							</div>
						</div>
					</div>

					{/* Company Field */}
					<div className="space-y-2">
						<label
							className="block text-sm font-semibold text-product-foreground mb-2"
							htmlFor="company"
						>
							Company (optional)
						</label>
						<div className="relative">
							<input
								className="w-full px-4 py-4 bg-product-background border-2 border-product-border rounded-xl text-product-foreground placeholder-product-foreground-accent/60 focus:outline-none focus:border-product-primary focus:bg-product-background-hover transition-all duration-300 shadow-product-shadow hover:shadow-product-shadow-hover"
								id="company"
								onChange={(e) => setCompany(e.target.value)}
								placeholder="Your Company"
								type="text"
								value={company}
							/>
							<div className="absolute inset-y-0 right-4 flex items-center">
								<svg
									className="w-5 h-5 text-product-icon"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Email Field */}
					<div className="space-y-2">
						<label
							className="block text-sm font-semibold text-product-foreground mb-2"
							htmlFor="email"
						>
							Email
						</label>
						<div className="relative">
							<input
								className={`w-full px-4 py-4 bg-product-background border-2 rounded-xl text-product-foreground placeholder-product-foreground-accent/60 focus:outline-none focus:border-product-primary focus:bg-product-background-hover transition-all duration-300 shadow-product-shadow hover:shadow-product-shadow-hover ${email && !isValidEmail(email) ? "border-red-500" : "border-product-border"}`}
								id="email"
								onChange={(e) => setEmail(e.target.value)}
								placeholder="name@company.com"
								required
								type="email"
								value={email}
							/>
							<div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
								<svg
									className="w-5 h-5 text-product-icon"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
									/>
								</svg>
							</div>
						</div>
						<div style={{ minHeight: "1.25rem" }}>
							{email && !isValidEmail(email) && (
								<p className="text-xs text-red-500 mt-1 ml-1">
									Enter a valid work email (for example, name@company.com).
								</p>
							)}
						</div>
					</div>

					{/* Subject Field */}
					<div className="space-y-2">
						<label
							className="block text-sm font-semibold text-product-foreground mb-2"
							htmlFor="subject"
						>
							Subject
						</label>
						<div className="relative">
							<select
								className="w-full px-4 py-4 bg-product-background border-2 border-product-border rounded-xl text-product-foreground focus:outline-none focus:border-product-primary focus:bg-product-background-hover transition-all duration-300 shadow-product-shadow hover:shadow-product-shadow-hover appearance-none cursor-pointer"
								id="subject"
								onChange={(e) => setSubject(e.target.value)}
								required
								value={subject}
							>
								{subjectOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
							<div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
								<svg
									className="w-5 h-5 text-product-icon"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M19 9l-7 7-7-7"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				{/* Message Field */}
				<div className="space-y-2">
					<label
						className="block text-sm font-semibold text-product-foreground mb-2"
						htmlFor="message"
					>
						How can we help?
					</label>
					<div className="relative">
						<textarea
							className="w-full px-4 py-4 bg-product-background border-2 border-product-border rounded-xl text-product-foreground placeholder-product-foreground-accent/60 focus:outline-none focus:border-product-primary focus:bg-product-background-hover transition-all duration-300 shadow-product-shadow hover:shadow-product-shadow-hover resize-none"
							id="message"
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Tell us about your business, goals, or any questions you have."
							required
							rows={6}
							value={message}
						/>
						<div className="absolute top-4 right-4">
							<svg
								className="w-5 h-5 text-product-icon"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
								/>
							</svg>
						</div>
					</div>
				</div>

				{/* Submit Button */}
				<div className="flex justify-center pt-4">
					<Button
						disabled={
							isLoading ||
							!name.trim() ||
							!email.trim() ||
							!message.trim() ||
							!isValidEmail(email)
						}
						type="submit"
						variant="contact"
					>
						{isLoading ? (
							<div className="flex items-center justify-center">
								<svg
									className="animate-spin -ml-1 mr-3 h-5 w-5 text-product-foreground"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										fill="currentColor"
									></path>
								</svg>
								Sending…
							</div>
						) : (
							<div
								className="flex items-center justify-center"
								onClick={handleSubmit}
							>
								Send message
								<svg
									className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
									/>
								</svg>
							</div>
						)}
					</Button>
				</div>
				<p className="text-xs text-product-foreground-accent text-center mt-3">
					By submitting, you agree to our
					<Link className="underline ml-2" href="/privacy-policy">
						Privacy Policy
					</Link>
					.
				</p>
			</div>
		</div>
	);
};

export default ContactForm;
