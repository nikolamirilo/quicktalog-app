"use client";
import type { CatalogueChatMessage } from "@/types/ai";
import { AlertTriangle, Check } from "lucide-react";

/**
 * One turn in the AI chat. Assistant turns also list the edits that were
 * applied to the builder, so the user can see exactly what changed.
 */
const ChatMessageBubble = ({ message }: { message: CatalogueChatMessage }) => {
	const isUser = message.role === "user";
	const changes = message.changes ?? [];
	const skipped = message.skipped ?? [];

	return (
		<div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
					isUser
						? "bg-product-primary text-product-foreground rounded-br-md"
						: "bg-gray-100 text-gray-800 rounded-bl-md"
				}`}
			>
				<p className="whitespace-pre-wrap">{message.content}</p>

				{changes.length > 0 && (
					<ul className="mt-2.5 space-y-1 border-t border-gray-200 pt-2">
						{changes.map((change) => (
							<li className="flex items-start gap-1.5 text-xs" key={change}>
								<Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
								<span className="text-gray-600">{change}</span>
							</li>
						))}
					</ul>
				)}

				{skipped.length > 0 && (
					<ul className="mt-2 space-y-1">
						{skipped.map((reason) => (
							<li className="flex items-start gap-1.5 text-xs" key={reason}>
								<AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
								<span className="text-gray-500">{reason}</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default ChatMessageBubble;
