"use client";
import { Button } from "@/components/ui/button";
import { sendContactEmail } from "@/server_actions/email";
import { useState } from "react";
import ContactForm from "./ContactForm";

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

	async function handleSubmit(e: React.FormEvent) {
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
			className={`font-lora ${type !== "support" ? "bg-product-background pt-32 md:pt-40 pb-32" : ""}`}
			id="contact"
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
										d="M5 13l4 4L19 7"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
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
				<ContactForm
					company={company}
					email={email}
					handleSubmit={handleSubmit}
					isLoading={isLoading}
					message={message}
					name={name}
					setCompany={setCompany}
					setEmail={setEmail}
					setMessage={setMessage}
					setName={setName}
					setSubject={setSubject}
					subject={subject}
				/>

				{/* Uncomment to show contact info section:
				<ContactInfo /> */}
			</div>
		</section>
	);
};

export default Contact;
