"use client";

import {
	AlertCircle,
	ChevronDown,
	Loader2,
	Mail,
	MessageSquare,
	Send,
	User,
} from "lucide-react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { ContactField } from "@/components/contact/ContactField";
import { TextLink } from "@/components/general/TextLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactSubjects } from "@/constants/details";
import {
	CONTACT_LIMITS,
	type ContactField as ContactFieldName,
	type ContactValues,
	getContactErrors,
} from "@/constants/schemas";
import { cn } from "@/lib/ui/cn";

type ValidatedField = "name" | "email" | "message";
type Errors = Partial<Record<ValidatedField, string>>;

const validatedFields: ValidatedField[] = ["name", "email", "message"];

const DEFAULT_SUBJECT = {
	page: "Custom Plan",
	support: "Technical Support",
} as const;

type ContactFormProps = {
	/** Resolves to true when the message was sent. */
	onSubmit: (values: ContactValues) => Promise<boolean>;
	/** Prefill, e.g. the signed-in user's name and email. Filled into empty fields only. */
	defaultValues?: Partial<ContactValues>;
	/**
	 * `page`: the public contact page, with its own heading and large fields.
	 * `support`: the dashboard support card (compact, no heading, Technical Support).
	 */
	variant?: "page" | "support";
};

/**
 * The contact / support message form. Field errors come from the shared
 * contact schema, the same one the server action parses with.
 */
export function ContactForm({
	onSubmit,
	defaultValues,
	variant = "page",
}: ContactFormProps) {
	const compact = variant === "support";
	const idBase = useId();
	const id = (field: string) => `contact-${field}${compact ? idBase : ""}`;
	const [values, setValues] = useState<ContactValues>({
		name: defaultValues?.name ?? "",
		email: defaultValues?.email ?? "",
		subject: defaultValues?.subject ?? DEFAULT_SUBJECT[variant],
		message: defaultValues?.message ?? "",
	});
	const [errors, setErrors] = useState<Errors>({});
	const [touched, setTouched] = useState<
		Partial<Record<ValidatedField, boolean>>
	>({});
	const [isLoading, setIsLoading] = useState(false);
	const [sendError, setSendError] = useState(false);
	const refs = {
		name: useRef<HTMLInputElement>(null),
		email: useRef<HTMLInputElement>(null),
		message: useRef<HTMLTextAreaElement>(null),
	};

	// The session may arrive after the first render; fill only empty fields.
	const defaultName = defaultValues?.name;
	const defaultEmail = defaultValues?.email;
	useEffect(() => {
		setValues((current) => ({
			...current,
			name: current.name || defaultName || "",
			email: current.email || defaultEmail || "",
		}));
	}, [defaultName, defaultEmail]);

	const errorFor = (field: ValidatedField, next: ContactValues) =>
		getContactErrors(next)[field] ?? "";

	const update = (field: ContactFieldName, value: string) => {
		const next = { ...values, [field]: value };
		setValues(next);
		// Re-check as the visitor types, but only once a field has been left.
		if (field !== "subject" && touched[field]) {
			setErrors((current) => ({ ...current, [field]: errorFor(field, next) }));
		}
	};

	const blur = (field: ValidatedField) => {
		setTouched((current) => ({ ...current, [field]: true }));
		setErrors((current) => ({ ...current, [field]: errorFor(field, values) }));
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		const allErrors = getContactErrors(values);
		const nextErrors: Errors = {};
		for (const field of validatedFields) nextErrors[field] = allErrors[field];
		setErrors(nextErrors);
		setTouched({ name: true, email: true, message: true });
		const firstInvalid = validatedFields.find((field) => nextErrors[field]);
		if (firstInvalid) {
			refs[firstInvalid].current?.focus();
			return;
		}

		setIsLoading(true);
		setSendError(false);
		try {
			const sent = await onSubmit(values);
			if (!sent) setSendError(true);
		} catch {
			setSendError(true);
		} finally {
			setIsLoading(false);
		}
	};

	const describedBy = (field: ValidatedField, extra?: string) =>
		[errors[field] ? `${id(field)}-error` : null, extra]
			.filter(Boolean)
			.join(" ") || undefined;

	const inputClass = compact ? "pr-[46px]" : "h-[52px] pr-[46px] text-base";

	return (
		<form noValidate onSubmit={handleSubmit}>
			{compact ? (
				<p className="text-[13px] text-product-muted">
					Fields marked <span aria-hidden="true">*</span>
					<span className="sr-only">with an asterisk</span> are required.
				</p>
			) : (
				<div>
					<h2 className="text-title-lg">Send us a message</h2>
					<p className="mt-1.5 text-sm text-product-muted">
						Fields marked <span aria-hidden="true">*</span>
						<span className="sr-only">with an asterisk</span> are required.
					</p>
				</div>
			)}

			<div
				className={cn(
					"grid grid-cols-1 sm:grid-cols-2",
					compact
						? "mt-3.5 gap-x-3.5 gap-y-3.5"
						: "mt-[22px] gap-x-[18px] gap-y-4",
				)}
			>
				<ContactField
					compact={compact}
					error={errors.name}
					icon={<User />}
					id={id("name")}
					label="Full name"
					required
				>
					<Input
						aria-describedby={describedBy("name")}
						aria-invalid={Boolean(errors.name)}
						aria-required="true"
						autoComplete="name"
						className={inputClass}
						id={id("name")}
						maxLength={CONTACT_LIMITS.name}
						onBlur={() => blur("name")}
						onChange={(e) => update("name", e.target.value)}
						placeholder="Jane Doe"
						ref={refs.name}
						type="text"
						value={values.name}
					/>
				</ContactField>

				<ContactField
					compact={compact}
					error={errors.email}
					icon={<Mail />}
					id={id("email")}
					label="Email"
					required
				>
					<Input
						aria-describedby={describedBy("email")}
						aria-invalid={Boolean(errors.email)}
						aria-required="true"
						autoComplete="email"
						className={inputClass}
						id={id("email")}
						inputMode="email"
						maxLength={CONTACT_LIMITS.email}
						onBlur={() => blur("email")}
						onChange={(e) => update("email", e.target.value)}
						placeholder="name@company.com"
						ref={refs.email}
						type="email"
						value={values.email}
					/>
				</ContactField>

				<ContactField
					compact={compact}
					full
					icon={<ChevronDown />}
					id={id("subject")}
					label="Subject"
				>
					<select
						className={cn(
							"flex w-full cursor-pointer appearance-none rounded-[14px] border-[1.5px] border-product-border-strong bg-product-card pl-4 pr-[46px] text-base text-product-foreground transition-[border-color,box-shadow] hover:border-product-border-hover focus-visible:border-product-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-product-primary/25",
							compact ? "h-11 md:text-[15px]" : "h-[52px]",
						)}
						id={id("subject")}
						onChange={(e) => update("subject", e.target.value)}
						value={values.subject}
					>
						{contactSubjects.map((option) => (
							<option key={option} value={option}>
								{option}
							</option>
						))}
					</select>
				</ContactField>

				<ContactField
					compact={compact}
					error={errors.message}
					footer={
						<span
							className="ml-auto mt-1.5 text-[12.5px] tabular-nums text-product-muted"
							id={`${id("message")}-count`}
						>
							{values.message.length} / {CONTACT_LIMITS.message}
						</span>
					}
					full
					icon={<MessageSquare />}
					id={id("message")}
					label="How can we help?"
					required
				>
					<Textarea
						aria-describedby={describedBy("message", `${id("message")}-count`)}
						aria-invalid={Boolean(errors.message)}
						aria-required="true"
						className={cn(
							"resize-y py-3.5 pr-[46px] text-base leading-[1.55]",
							compact ? "min-h-[130px]" : "min-h-[150px]",
						)}
						id={id("message")}
						maxLength={CONTACT_LIMITS.message}
						onBlur={() => blur("message")}
						onChange={(e) => update("message", e.target.value)}
						placeholder="Tell us about your business, goals, or any questions you have."
						ref={refs.message}
						rows={6}
						value={values.message}
					/>
				</ContactField>
			</div>

			{sendError && (
				<p
					className="mt-[18px] flex items-start gap-2.5 rounded-[14px] bg-product-error-soft px-4 py-3 text-sm font-medium text-product-error-ink"
					role="alert"
				>
					<AlertCircle
						aria-hidden="true"
						className="mt-0.5 h-4 w-4 flex-none text-product-error"
					/>
					We couldn't send your message. Please try again in a moment.
				</p>
			)}

			<div
				className={cn(
					"flex flex-col-reverse items-stretch gap-3.5 sm:flex-row sm:items-center sm:justify-between",
					compact ? "mt-4" : "mt-[22px]",
				)}
			>
				<p className="text-center text-[13.5px] text-product-muted sm:text-left">
					By submitting, you agree to our{" "}
					<TextLink href="/privacy-policy">Privacy Policy</TextLink>.
				</p>
				<Button
					aria-busy={isLoading}
					className="w-full sm:w-auto"
					disabled={isLoading}
					size={compact ? "default" : "lg"}
					type="submit"
				>
					{isLoading ? (
						<Loader2 aria-hidden="true" className="animate-spin" />
					) : (
						<Send aria-hidden="true" />
					)}
					{isLoading ? "Sending…" : "Send message"}
				</Button>
			</div>
		</form>
	);
}
