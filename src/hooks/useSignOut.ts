"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/context/AuthContext";

/** Signs out through whichever auth provider is live, then goes home. */
export function useSignOut() {
	const { signOut } = useAuth();
	const router = useRouter();
	const [signingOut, setSigningOut] = useState(false);

	const handleSignOut = async () => {
		setSigningOut(true);
		try {
			await signOut();
			router.push("/");
		} finally {
			setSigningOut(false);
		}
	};

	return { signingOut, handleSignOut };
}
