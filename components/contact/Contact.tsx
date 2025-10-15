"use client";
import { sendContactEmail } from "@/actions/email";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

const Contact = ({ type = "regular" }: { type?: string }) => {
	const [name, setName] = useState("");
	const [company, setCompany] = useState("");
	const [subject, setSubject] = useState(
		type !== "support" ? "Custom Plan" : "Technical Support",
	);
	const [message, setMessage] = useState("");
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	// Email validation regex (simple version)
	const isValidEmail = (email: string) =>
		/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

	const subjectOptions = [
		"Custom Plan",
		"Pricing Questions",
		"Technical Support",
		"Feature Request",
		"Partnership",
		"General Inquiry",
		"Other",
	];

	async function handleSubmit(e) {
		e.preventDefault();
		setIsLoading(true);

		const res = await sendContactEmail({
			message,
			email,
			name,
			subject: `Contact Form: ${subject}`,
		});
		if (res == true) {
			setIsOpen(true);
			setIsLoading(false);
			setName("");
			setCompany("");
			setSubject("Custom Plan");
			setMessage("");
			setEmail("");
		} else {
			alert("Error occured");
		}
	}

	return (
		<section
			id="contact"
			className={`font-lora ${type !== "support" ? "bg-product-background pt-32 md:pt-40 pb-32" : ""}`}
		>
			{isOpen && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="bg-product-background rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-product-border">
						<div className="text-center">
							<div className="w-16 h-16 bg-product-primary rounded-full flex items-center justify-center mx-auto mb-4">
								<svg
									className="w-8 h-8 text-product-foreground"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-semibold text-product-foreground mb-2">
								{type === "support"
									? "Thank you for submitting your request."
									: "Thanks-your message is on its way!"}
							</h3>
							<p className="text-product-foreground-accent mb-6">
								We've received your message and will reply via email within 1
								business day.
							</p>
							<Button onClick={() => setIsOpen(false)} variant="contact">
								Close
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="container mx-auto  max-w-4xl">
				{/* Header */}
				{type !== "support" && (
					<div className="text-center mb-16">
						<h1 className="text-5xl font-bold text-product-foreground mb-4">
							Contact Quicktalog
						</h1>
						<p className="text-xl text-product-foreground-accent max-w-2xl mx-auto">
							Have questions about our digital catalog builder? Our sales and
							support teams are here to help and typically respond within 1
							business day.
						</p>
					</div>
				)}

				{/* Contact Form */}
				<div className="bg-product-background rounded-3xl shadow-md p-8 md:p-12 border border-product-border">
					<div className="space-y-8">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{/* Name Field */}
							<div className="space-y-2">
								<label
									htmlFor="name"
									className="block text-sm font-semibold text-product-foreground mb-2"
								>
									Full name
								</label>
								<div className="relative">
									<input
										id="name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										type="text"
										placeholder="Jane Doe"
										className="w-full px-4 py-4 bg-product-background border-2 border-product-border rounded-xl text-product-foreground placeholder-product-foreground-accent/60 focus:outline-none focus:border-product-primary focus:bg-product-hover-background transition-all duration-300 shadow-product-shadow hover:shadow-product-hover-shadow"
										required
									/>
									<div className="absolute inset-y-0 right-4 flex items-center">
										<svg
											className="w-5 h-5 text-product-icon"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
											/>
										</svg>
									</div>
								</div>
							</div>

							{/* Company Field */}
							<div className="space-y-2">
								<label
									htmlFor="company"
									className="block text-sm font-semibold text-product-foreground mb-2"
								>
									Company (optional)
								</label>
								<div className="relative">
									<input
										id="company"
										value={company}
										onChange={(e) => setCompany(e.target.value)}
										type="text"
										placeholder="Your Company"
										className="w-full px-4 py-4 bg-product-background border-2 border-product-border rounded-xl text-product-foreground placeholder-product-foreground-accent/60 focus:outline-none focus:border-product-primary focus:bg-product-hover-background transition-all duration-300 shadow-product-shadow hover:shadow-product-hover-shadow"
									/>
									<div className="absolute inset-y-0 right-4 flex items-center">
										<svg
											className="w-5 h-5 text-product-icon"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
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
									htmlFor="email"
									className="block text-sm font-semibold text-product-foreground mb-2"
								>
									Email
								</label>
								<div className="relative">
									<input
										id="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										type="email"
										placeholder="name@company.com"
										className={`w-full px-4 py-4 bg-product-background border-2 rounded-xl text-product-foreground placeholder-product-foreground-accent/60 focus:outline-none focus:border-product-primary focus:bg-product-hover-background transition-all duration-300 shadow-product-shadow hover:shadow-product-hover-shadow ${email && !isValidEmail(email) ? "border-red-500" : "border-product-border"}`}
										required
									/>
									<div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
										<svg
											className="w-5 h-5 text-product-icon"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
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
									htmlFor="subject"
									className="block text-sm font-semibold text-product-foreground mb-2"
								>
									Subject
								</label>
								<div className="relative">
									<select
										id="subject"
										value={subject}
										onChange={(e) => setSubject(e.target.value)}
										className="w-full px-4 py-4 bg-product-background border-2 border-product-border rounded-xl text-product-foreground focus:outline-none focus:border-product-primary focus:bg-product-hover-background transition-all duration-300 shadow-product-shadow hover:shadow-product-hover-shadow appearance-none cursor-pointer"
										required
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
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</div>
								</div>
							</div>
						</div>

						{/* Message Field */}
						<div className="space-y-2">
							<label
								htmlFor="message"
								className="block text-sm font-semibold text-product-foreground mb-2"
							>
								How can we help?
							</label>
							<div className="relative">
								<textarea
									id="message"
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									rows={6}
									placeholder="Tell us about your business, goals, or any questions you have."
									className="w-full px-4 py-4 bg-product-background border-2 border-product-border rounded-xl text-product-foreground placeholder-product-foreground-accent/60 focus:outline-none focus:border-product-primary focus:bg-product-hover-background transition-all duration-300 shadow-product-shadow hover:shadow-product-hover-shadow resize-none"
									required
								/>
								<div className="absolute top-4 right-4">
									<svg
										className="w-5 h-5 text-product-icon"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
										/>
									</svg>
								</div>
							</div>
						</div>

						{/* Submit Button */}
						<div className="flex justify-center pt-4">
							<Button
								type="submit"
								disabled={
									isLoading ||
									!name.trim() ||
									!email.trim() ||
									!message.trim() ||
									!isValidEmail(email)
								}
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
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
											/>
										</svg>
									</div>
								)}
							</Button>
						</div>
						<p className="text-xs text-product-foreground-accent text-center mt-3">
							By submitting, you agree to our
							<Link href="/privacy-policy" className="underline ml-2">
								Privacy Policy
							</Link>
							.
						</p>
					</div>
				</div>

				{/* <div className="mt-20">
          <div className="bg-product-background rounded-3xl shadow-md p-8 md:p-12 border border-product-border">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-product-primary/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-product-primary/20 rounded-full translate-y-16 -translate-x-16"></div>

            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-product-foreground mb-4">
                  Other ways to reach us
                </h2>
                <p className="text-product-foreground-accent text-lg">
                  Choose the channel that works best for you.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="group text-center">
                  <div className="relative">
                    <div className="w-16 h-16 bg-product-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-product-shadow">
                      <svg
                        className="w-8 h-8 text-product-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-product-foreground mb-2 text-xl">Email</h3>
                  <a
                    href="mailto:quicktalog@outlook.com"
                    aria-label="Send an email to quicktalog@outlook.com"
                    className="text-product-foreground-accent text-lg hover:text-product-primary underline-offset-4 hover:underline">
                    quicktalog@outlook.com
                  </a>
                  <p className="text-product-foreground-accent text-sm mt-1">
                    We typically respond within 1 business day.
                  </p>
                  <div className="mt-4 h-1 bg-product-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-product-primary rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  </div>
                </div>

                <div className="group text-center">
                  <div className="relative">
                    <div className="w-16 h-16 bg-product-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-product-shadow">
                      <svg
                        className="w-8 h-8 text-product-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-product-foreground mb-2 text-xl">Phone</h3>
                  <a
                    href="tel:+15551234567"
                    aria-label="Call +1 (555) 123-4567"
                    className="text-product-foreground-accent text-lg hover:text-product-primary underline-offset-4 hover:underline">
                    +1 (555) 123-4567
                  </a>
                  <p className="text-product-foreground-accent text-sm mt-1">
                    Mon–Fri, 9:00am–5:00pm ET
                  </p>
                  <div className="mt-4 h-1 bg-product-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-product-primary rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 delay-100"></div>
                  </div>
                </div>

                <div className="group text-center">
                  <div className="relative">
                    <div className="w-16 h-16 bg-product-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-product-shadow">
                      <svg
                        className="w-8 h-8 text-product-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="font-bold text-product-foreground mb-2 text-xl">Office</h3>
                  <p className="text-product-foreground-accent text-lg">
                    New York, NY - Remote‑first team
                  </p>
                  <div className="mt-4 h-1 bg-product-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-product-primary rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div> */}
			</div>
		</section>
	);
};

export default Contact;
