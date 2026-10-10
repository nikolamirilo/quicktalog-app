"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ContactAside } from "@/components/contact/ContactAside";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactSent } from "@/components/contact/ContactSent";
import { Container } from "@/components/general/Container";
import { contactSubjects } from "@/constants/details";
import { useContactSubmit } from "@/hooks/useContactSubmit";

/** Matches a `?subject=` param (e.g. "feature-request") against the exact option strings. */
const matchSubjectParam = (param: string | null) => {
	if (!param) return undefined;
	const normalized = param
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ");
	return contactSubjects.find((option) => option.toLowerCase() === normalized);
};

/** Contact page body: the message card and the other ways to reach us. */
export function Contact() {
	const searchParams = useSearchParams();
	const [initialSubject] = useState(() =>
		matchSubjectParam(searchParams.get("subject")),
	);
	const { sent, submit, reset } = useContactSubmit();

	return (
		<section aria-label="Contact options" id="contact">
			<Container className="grid grid-cols-1 gap-5 pb-14 pt-2 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start lg:gap-7">
				<div className="rounded-product-card border border-product-border bg-product-card px-5 py-6 shadow-product lg:px-[34px] lg:pb-[30px] lg:pt-[34px]">
					{sent ? (
						<ContactSent onReset={reset} sent={sent} />
					) : (
						<ContactForm
							defaultValues={{ subject: initialSubject }}
							onSubmit={submit}
						/>
					)}
				</div>
				<ContactAside />
			</Container>
		</section>
	);
}
