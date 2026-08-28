"use client";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

interface PasteListModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (rawText: string) => void;
}

const PasteListModal = ({ isOpen, onClose, onSubmit }: PasteListModalProps) => {
	const [text, setText] = useState("");

	useEffect(() => {
		if (isOpen) setText("");
	}, [isOpen]);

	const handleSubmit = () => {
		const trimmed = text.trim();
		if (!trimmed) return;
		// Fire and forget: the block starts loading and fills in on its own.
		onSubmit(trimmed);
		onClose();
	};

	return (
		<AlertDialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<AlertDialogContent className="w-[98vw] sm:w-[95vw] md:max-w-2xl p-0 overflow-hidden bg-white border-none shadow-2xl gap-0 max-h-[90dvh] flex flex-col">
				<AlertDialogTitle className="p-4 sm:p-6 pb-4 relative border-b border-gray-100 flex-shrink-0">
					<button
						className="absolute right-4 sm:right-6 top-4 sm:top-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
						onClick={onClose}
						type="button"
					>
						<X className="w-5 h-5 text-gray-400" />
					</button>
					<div className="text-xl sm:text-2xl font-bold text-gray-900">
						Generate Items
					</div>
					<p className="text-sm text-gray-500 mt-1 font-normal">
						Write prompt or paste your items list. AI will generate items for
						you.
					</p>
				</AlertDialogTitle>

				<div className="flex-1 overflow-y-auto p-4 sm:p-6">
					<Textarea
						className="resize-none min-h-[200px] font-mono text-sm"
						onChange={(e) => setText(e.target.value)}
						placeholder="Wirte instructions"
						value={text}
					/>
				</div>

				<div className="p-3 sm:p-6 pt-3 sm:pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-gray-100 flex-shrink-0 bg-white">
					<Button
						className="w-full sm:w-auto"
						onClick={onClose}
						variant="outline"
					>
						Cancel
					</Button>
					<Button
						className="w-full sm:w-auto gap-2"
						disabled={!text.trim()}
						onClick={handleSubmit}
					>
						<Sparkles className="w-4 h-4" />
						Generate items
					</Button>
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default PasteListModal;
