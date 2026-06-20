import http from "node:http";
import { chromium } from "@playwright/test";
const srv = http.createServer((_, res) => res.end("ok"));
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${srv.address().port}/`;

async function tryLaunch(label, opts) {
	try {
		const b = await chromium.launch(opts);
		const exe = b.constructor.name;
		const page = await b.newPage();
		await page.goto(url, { timeout: 8000 });
		console.log(`${label}: LAUNCH OK, loopback OK`);
		await b.close();
	} catch (e) {
		console.log(`${label}: ${e.message.split("\n")[0]}`);
	}
}
// system Google Chrome channel
await tryLaunch("channel=chrome ", { channel: "chrome", headless: false });
// bundled chromium via host browsers path
process.env.PLAYWRIGHT_BROWSERS_PATH = "/home/nikola/.cache/ms-playwright";
srv.close();
