"use client";
import Contact from "@/components/contact/Contact";
import { InlineWidget } from "react-calendly";
import { IoMdHelpCircleOutline } from "react-icons/io";

const Support = ({
	pricingPlanId = 0,
	userEmail,
}: {
	pricingPlanId: number;
	userEmail: string;
}) => {
	return (
		<div className="max-w-5xl space-y-8">
			<h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-4 sm:mb-6 text-product-foreground flex items-center gap-2 sm:gap-3 font-heading">
				<IoMdHelpCircleOutline className="text-product-primary w-6 h-6 sm:w-8 sm:h-8" />{" "}
				Support
			</h2>
			<p className="text-lg text-product-foreground-accent mb-6">
				We're here to help you get the most out of Quicktalog. Choose your
				preferred support method below.
			</p>
			<div className="grid gap-8">
				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<div className="w-2 h-2 bg-product-primary rounded-full"></div>
						<h2 className="text-2xl font-semibold text-product-foreground">
							Email Support
						</h2>
					</div>
					<p className="text-product-foreground-accent mb-4">
						Send us a detailed message and we'll respond within 1 business day.
					</p>
					<Contact type="support" />
				</div>

				<div className="space-y-4">
					<div className="flex items-center gap-3">
						<div className="w-2 h-2 bg-product-primary rounded-full"></div>
						<h2 className="text-2xl font-semibold text-product-foreground">
							Schedule a Meeting
						</h2>
					</div>
					<p className="text-product-foreground-accent mb-4">
						Book a 30-minute consultation to discuss your needs or get
						personalized assistance.
					</p>
					<div className="h-[600px] w-full rounded-2xl overflow-hidden border border-product-border">
						<InlineWidget
							url={
								process.env.NEXT_PUBLIC_CALENDLY_URL ||
								"https://calendly.com/quicktalog/customer-support"
							}
							styles={{ height: "100%", width: "100%" }}
						/>
					</div>
				</div>

				{/* Quick Contact */}
				{/* <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-product-primary rounded-full"></div>
            <h2 className="text-2xl font-semibold text-product-foreground">Quick Contact</h2>
          </div>
          <p className="text-product-foreground-accent mb-4">
            Need immediate assistance? Reach out to us directly.
          </p>
          <div className="flex justify-start">
            <a
              href="mailto:support@quicktalog.com"
              className="bg-product-primary hover:bg-product-primary/90 text-white font-medium py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Email Support
            </a>
          </div>
        </div> */}
			</div>
		</div>
	);
};

export default Support;
