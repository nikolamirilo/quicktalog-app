interface ContactInfoProps {
	emailAddress?: string;
	phone?: string;
	phoneLabel?: string;
	officeLocation?: string;
}

const ContactInfo = ({
	emailAddress = "quicktalog@outlook.com",
	phone = "+1 (555) 123-4567",
	phoneLabel = "Mon-Fri, 9:00am-5:00pm ET",
	officeLocation = "New York, NY - Remote-first team",
}: ContactInfoProps) => {
	return (
		<div className="mt-20">
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
						{/* Email */}
						<div className="group text-center">
							<div className="relative">
								<div className="w-16 h-16 bg-product-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-product-shadow">
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
											d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>
								</div>
							</div>
							<h3 className="font-bold text-product-foreground mb-2 text-xl">
								Email
							</h3>
							<a
								href={`mailto:${emailAddress}`}
								aria-label={`Send an email to ${emailAddress}`}
								className="text-product-foreground-accent text-lg hover:text-product-primary underline-offset-4 hover:underline"
							>
								{emailAddress}
							</a>
							<p className="text-product-foreground-accent text-sm mt-1">
								We typically respond within 1 business day.
							</p>
							<div className="mt-4 h-1 bg-product-primary/20 rounded-full overflow-hidden">
								<div className="h-full bg-product-primary rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
							</div>
						</div>

						{/* Phone */}
						<div className="group text-center">
							<div className="relative">
								<div className="w-16 h-16 bg-product-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-product-shadow">
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
											d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
										/>
									</svg>
								</div>
							</div>
							<h3 className="font-bold text-product-foreground mb-2 text-xl">
								Phone
							</h3>
							<a
								href={`tel:${phone.replace(/[^+\d]/g, "")}`}
								aria-label={`Call ${phone}`}
								className="text-product-foreground-accent text-lg hover:text-product-primary underline-offset-4 hover:underline"
							>
								{phone}
							</a>
							<p className="text-product-foreground-accent text-sm mt-1">
								{phoneLabel}
							</p>
							<div className="mt-4 h-1 bg-product-primary/20 rounded-full overflow-hidden">
								<div className="h-full bg-product-primary rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 delay-100"></div>
							</div>
						</div>

						{/* Office */}
						<div className="group text-center">
							<div className="relative">
								<div className="w-16 h-16 bg-product-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-product-shadow">
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
							<h3 className="font-bold text-product-foreground mb-2 text-xl">
								Office
							</h3>
							<p className="text-product-foreground-accent text-lg">
								{officeLocation}
							</p>
							<div className="mt-4 h-1 bg-product-primary/20 rounded-full overflow-hidden">
								<div className="h-full bg-product-primary rounded-full transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 delay-200"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ContactInfo;
