// Functions deploy with verify_jwt = false, so this check is the only gate.
export function isAuthorizedWebhook(req: Request): boolean {
	const secret = Deno.env.get("WEBHOOK_SECRET");
	const header = req.headers.get("x-webhook-secret");
	if (secret && header && safeEqual(header, secret)) return true;

	// Transition: until Vault holds edge_webhook_secret, the triggers send the service_role bearer.
	const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
	const auth = req.headers.get("authorization");
	return Boolean(serviceKey && auth && safeEqual(auth, `Bearer ${serviceKey}`));
}

export function unauthorized(): Response {
	return new Response(JSON.stringify({ error: "Unauthorized" }), {
		status: 401,
		headers: { "Content-Type": "application/json" },
	});
}

function safeEqual(a: string, b: string): boolean {
	const x = new TextEncoder().encode(a);
	const y = new TextEncoder().encode(b);
	if (x.length !== y.length) return false;
	let diff = 0;
	for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
	return diff === 0;
}
