// Extract every ```sql block of Appendix A of FINAL_PLAN.md verbatim (fences stripped) into ordered files.
import fs from "node:fs";
import path from "node:path";
const PLAN = new URL(
	"../../../.claude/plans/active/supabase-auth-migration/PLAN.md",
	import.meta.url,
).pathname;
const OUT = new URL("../plan-sql", import.meta.url).pathname;
const lines = fs.readFileSync(PLAN, "utf8").split("\n");
const start = lines.findIndex((l) => l.startsWith("## Appendix A."));
const end = lines.findIndex(
	(l, i) => i > start && l.startsWith("## Appendix B."),
);
const blocks = [];
let heading = null,
	inBlock = false,
	buf = [],
	blockStart = 0;
for (let i = start; i < end; i++) {
	const l = lines[i];
	if (!inBlock && l.startsWith("### "))
		heading = { text: l.slice(4), line: i + 1 };
	if (!inBlock && /^```sql\s*$/.test(l)) {
		inBlock = true;
		buf = [];
		blockStart = i + 2;
		continue;
	}
	if (inBlock && /^```\s*$/.test(l)) {
		inBlock = false;
		blocks.push({
			heading,
			text: buf.join("\n") + "\n",
			firstLine: blockStart,
			lastLine: i,
		});
		continue;
	}
	if (inBlock) buf.push(l);
}
const name = (h) => {
	const m = /^(A\.[0-9R]+)\s+`(?:MIGRATION\s+)?([^`]+)`/.exec(h.text);
	if (m) return `${m[1]}_${path.basename(m[2]).replace(/\.sql$/, "")}`;
	return h.text.replace(/[^A-Za-z0-9.]+/g, "_").slice(0, 40);
};
const order = [
	"A.0",
	"A.1",
	"A.2",
	"A.3",
	"A.4",
	"A.5",
	"A.6",
	"A.7",
	"A.8",
	"A.9",
	"A.10",
	"A.R1",
	"A.R2",
	"A.11",
	"A.12",
	"A.13",
	"A.14",
	"A.15",
	"A.16",
];
fs.mkdirSync(OUT, { recursive: true });
const index = [];
for (const b of blocks) {
	const id = /^(A\.[0-9R]+)/.exec(b.heading.text)[1];
	const n = String(order.indexOf(id)).padStart(2, "0");
	const f = `${n}_${name(b.heading)}.sql`;
	fs.writeFileSync(path.join(OUT, f), b.text);
	index.push({
		file: f,
		heading: b.heading.text,
		planLines: `${b.firstLine}-${b.lastLine}`,
	});
}
// A.14 split per migration on lines "-- Mnn:" / "-- Mnn (" / "-- R1:"
const a14 = blocks.find((b) => b.heading.text.startsWith("A.14"));
const parts = [];
let cur = { key: "header", lines: [], first: a14.firstLine };
a14.text.split("\n").forEach((l, i) => {
	const m = /^-- (M\d\d|R1)[: (]/.exec(l);
	if (m) {
		parts.push(cur);
		cur = { key: m[1], lines: [], first: a14.firstLine + i };
	}
	cur.lines.push(l);
});
parts.push(cur);
fs.mkdirSync(path.join(OUT, "A.14_split"), { recursive: true });
for (const p of parts) {
	if (p.key === "header") continue;
	const f = `rollback_${p.key}.sql`;
	fs.writeFileSync(
		path.join(OUT, "A.14_split", f),
		p.lines.join("\n").replace(/\n+$/, "") + "\n",
	);
	index.push({
		file: `A.14_split/${f}`,
		heading: `A.14 rollback part ${p.key}`,
		planLines: `${p.first}-${p.first + p.lines.length - 1}`,
	});
}
fs.writeFileSync(path.join(OUT, "INDEX.json"), JSON.stringify(index, null, 2));
console.log(JSON.stringify(index, null, 2));
// verify: concatenation of extracted text equals plan text between fences
for (const b of blocks) {
	const orig = lines.slice(b.firstLine - 1, b.lastLine).join("\n") + "\n";
	if (orig !== b.text) console.log("MISMATCH", b.heading.text);
}
