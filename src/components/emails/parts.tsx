import type { ReactNode } from "react";
import * as s from "./style";

const table = {
	role: "presentation",
	cellPadding: 0,
	cellSpacing: 0,
	border: 0,
} as const;

export function Badge({
	children,
	tone = "amber",
}: {
	children: string;
	tone?: "amber" | "neutral";
}) {
	return (
		<table {...table}>
			<tbody>
				<tr>
					<td style={{ ...s.badgeCell, ...s.badge[tone] }}>{children}</td>
				</tr>
			</tbody>
		</table>
	);
}

export function Title({ children }: { children: ReactNode }) {
	return (
		<h1 className="qt-title" style={s.title}>
			{children}
		</h1>
	);
}

export function Lead({ children }: { children: ReactNode }) {
	return <p style={s.lead}>{children}</p>;
}

export function Paragraph({
	children,
	last,
}: {
	children: ReactNode;
	last?: boolean;
}) {
	return (
		<p style={last ? { ...s.paragraph, margin: 0 } : s.paragraph}>{children}</p>
	);
}

export function Heading({ children }: { children: ReactNode }) {
	return <h2 style={s.heading}>{children}</h2>;
}

export function FinePrint({ children }: { children: ReactNode }) {
	return <p style={s.finePrint}>{children}</p>;
}

type ButtonSpec = { label: string; href: string; secondary?: boolean };

/** One primary button at most; any others should be `secondary`. */
export function Buttons({ buttons }: { buttons: ButtonSpec[] }) {
	return (
		<table {...table} style={s.buttonRow}>
			<tbody>
				<tr>
					{buttons.flatMap((b, i) => {
						const cell = (
							<td
								key={b.href}
								style={
									b.secondary ? s.secondaryButtonCell : s.primaryButtonCell
								}
							>
								<a href={b.href} style={s.buttonLink}>
									{b.label}
								</a>
							</td>
						);
						return i === 0
							? [cell]
							: [<td key={`gap-${b.href}`} style={s.buttonGap} />, cell];
					})}
				</tr>
			</tbody>
		</table>
	);
}

export function Chips({ items }: { items: string[] }) {
	return (
		<table {...table} style={s.chipRow}>
			<tbody>
				<tr>
					{items.map((item) => (
						<td key={item} style={s.chipCell}>
							<span style={s.chip}>{item}</span>
						</td>
					))}
				</tr>
			</tbody>
		</table>
	);
}

export function DetailRows({
	rows,
}: {
	rows: { label: string; value: ReactNode }[];
}) {
	return (
		<table {...table} style={s.detailTable} width="100%">
			<tbody>
				{rows.map((row, i) => (
					<tr key={row.label}>
						<td style={i === 0 ? s.detailCell : s.detailCellDivided}>
							<p style={s.detailLabel}>{row.label}</p>
							<p style={s.detailValue}>{row.value}</p>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

export function FallbackLink({ href }: { href: string }) {
	return (
		<p style={s.fallbackText}>
			Button not working? Paste this link into your browser:
			<br />
			<a href={href} style={s.fallbackLink}>
				{href}
			</a>
		</p>
	);
}

export function Divider() {
	return <hr style={s.divider} />;
}

/** A quiet closing block: what happens if the reader ignores the email. */
export function SafetyNote({
	heading,
	children,
}: {
	heading: string;
	children: ReactNode;
}) {
	return (
		<>
			<Divider />
			<p style={s.noteHeading}>{heading}</p>
			<p style={s.noteText}>{children}</p>
		</>
	);
}

export function Steps({
	steps,
}: {
	steps: { title: string; description: string }[];
}) {
	return (
		<table {...table} style={s.stepsTable} width="100%">
			<tbody>
				{steps.map((step, i) => (
					<tr key={step.title}>
						<td style={s.stepNumberCell}>
							<div style={s.stepNumber}>{i + 1}</div>
						</td>
						<td style={s.stepTextCell}>
							<p style={s.stepTitle}>{step.title}</p>
							<p style={s.stepDescription}>{step.description}</p>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

export function MessageBox({ children }: { children: string }) {
	return (
		<table {...table} style={s.buttonRow} width="100%">
			<tbody>
				<tr>
					<td style={s.messageBox}>{children}</td>
				</tr>
			</tbody>
		</table>
	);
}

export function TextLink({
	href,
	children,
}: {
	href: string;
	children: ReactNode;
}) {
	return (
		<a href={href} style={s.link}>
			{children}
		</a>
	);
}
