import { ScaleLoader } from "react-spinners";

/** Full-screen loader shown by the route `loading.tsx` files. */
export const Loader = () => {
	return (
		<div
			aria-busy="true"
			aria-live="polite"
			className="flex h-screen w-full items-center justify-center bg-product-background"
			role="status"
		>
			<ScaleLoader color="var(--product-primary)" height={40} width={6} />
			<span className="sr-only">Loading…</span>
		</div>
	);
};
