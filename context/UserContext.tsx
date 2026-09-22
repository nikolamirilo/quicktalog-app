"use client";

import { getUserData } from "@/actions/users";
import { useAuth } from "@/context/AuthContext";
import { UserData } from "@quicktalog/common";
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

interface UserContextType {
	userData: UserData | null;
	loading: boolean;
	refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserContextProvider({ children }: { children: ReactNode }) {
	const { user: authUser, isLoaded: isAuthLoaded } = useAuth();
	const [userData, setUserData] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchUserData = async () => {
		if (!authUser?.id) {
			setUserData(null);
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const data = await getUserData();
			setUserData(data);
		} catch (error) {
			console.error("Failed to fetch user data:", error);
			// Optionally handle error state
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isAuthLoaded) {
			fetchUserData();
		}
	}, [isAuthLoaded, authUser?.id]);

	const refreshUserData = async () => {
		await fetchUserData();
	};

	return (
		<UserContext.Provider value={{ userData, loading, refreshUserData }}>
			{children}
		</UserContext.Provider>
	);
}

export function useUserContext() {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error("useUserContext must be used within a UserContextProvider");
	}
	return context;
}
