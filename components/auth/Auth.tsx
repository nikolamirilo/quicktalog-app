"use client";
import ClerkAuthForms from "@/components/auth/ClerkAuthForms";
import SupabaseAuthForms from "@/components/auth/SupabaseAuthForms";
import ConsentModal from "@/components/modals/ConsentModal";
import { AUTH_PROVIDER } from "@/lib/auth/provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Auth({
	termsVersion = null,
}: {
	/** Read on the server from `private.current_terms_version()`; only the Supabase forms use it. */
	termsVersion?: string | null;
}) {
	const searchParams = useSearchParams();
	const mode = searchParams.get("mode");
	const router = useRouter();
	const [showConsentModal, setShowConsentModal] = useState(false);
	const [showSignupForm, setShowSignupForm] = useState(false);

	useEffect(() => {
		if (mode === "signup") {
			const consent = localStorage.getItem("consent");
			if (consent === "true") {
				setShowSignupForm(true);
			} else {
				setShowConsentModal(true);
			}
		} else {
			setShowSignupForm(true);
		}
	}, [mode]);

	const handleConsentConfirm = () => {
		localStorage.setItem("consent", "true");
		setShowConsentModal(false);
		setShowSignupForm(true);
	};

	const handleConsentCancel = () => {
		setShowConsentModal(false);
		router.push("/");
	};

	return (
		<>
			<div className="product font-lora min-h-screen">
				<div className="flex justify-center items-center mt-[5vh] min-h-screen px-4">
					<div className="w-full max-w-md">
						{showSignupForm &&
							(AUTH_PROVIDER === "supabase" ? (
								<SupabaseAuthForms mode={mode} termsVersion={termsVersion} />
							) : (
								<ClerkAuthForms mode={mode} />
							))}
					</div>
				</div>
			</div>
			<ConsentModal
				isOpen={showConsentModal}
				onCancel={handleConsentCancel}
				onConfirm={handleConsentConfirm}
			/>
		</>
	);
}
