/** Up to two initials from a display name, for use when there is no avatar. */
export function initialsFrom(name: string | null | undefined): string {
	return (
		(name ?? "")
			.split(" ")
			.map((part) => part.trim()[0])
			.filter(Boolean)
			.slice(0, 2)
			.join("")
			.toUpperCase() || "Q"
	);
}
