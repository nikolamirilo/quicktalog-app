export async function fetchImageFromUnsplash(query: string): Promise<string> {
	try {
		const res = await fetch(
			`https://api.unsplash.com/search/photos?page=1&per_page=1&query=${encodeURIComponent(query)}`,
			{
				headers: {
					Authorization: `Client-ID ${process.env.UNSPLASH_API_KEY}`,
				},
			},
		);

		const data = await res.json();

		if (data?.results?.[0]?.urls?.regular) {
			return data.results[0].urls.regular;
		}
	} catch (err) {
		console.error(`Failed to fetch image for "${query}":`, err);
	}

	return "https://static1.squarespace.com/static/5898e29c725e25e7132d5a5a/58aa11bc9656ca13c4524c68/58aa11e99656ca13c45253e2/1487540713345/600x400-Image-Placeholder.jpg?format=original";
}

export const generateUniqueSlug = (name: string) => {
	const slug = name
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	return slug;
};

// npm publish --access public
