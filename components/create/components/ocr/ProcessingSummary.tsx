"use client";
import { OCRImageData } from "@quicktalog/common";
import { CheckCircle2, XCircle } from "lucide-react";
import { BiScan } from "react-icons/bi";

interface ProcessingSummaryProps {
	images: OCRImageData[];
	hasExtractedText: boolean;
	allImagesProcessed: boolean;
}

const ProcessingSummary = ({
	images,
	hasExtractedText,
	allImagesProcessed,
}: ProcessingSummaryProps) => {
	return (
		<div className="flex flex-col gap-6 w-full mb-8">
			<div className="p-8 rounded-2xl border-2 border-product-border bg-gradient-to-br from-product-background-hero to-product-background shadow-xl">
				<div className="flex items-center gap-3 mb-6">
					<div className="p-2 bg-product-primary rounded-lg">
						<BiScan color="black" size={24} />
					</div>
					<h3 className="font-bold text-2xl text-product-foreground">
						Processing Summary
					</h3>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="bg-product-background/50 p-4 rounded-xl border border-product-border">
						<p className="text-sm text-product-foreground-accent mb-1">
							Images Selected
						</p>
						<p className="text-3xl font-bold text-product-primary">
							{images.length}
						</p>
					</div>
					<div className="bg-product-background/50 p-4 rounded-xl border border-product-border">
						<p className="text-sm text-product-foreground-accent mb-1">
							Images Processed
						</p>
						<p className="text-3xl font-bold text-product-secondary">
							{images.filter((img) => img.isProcessed).length}
						</p>
					</div>
					<div className="bg-product-background/50 p-4 rounded-xl border border-product-border">
						<p className="text-sm text-product-foreground-accent mb-1">
							Text Extracted
						</p>
						<div className="flex items-center gap-2">
							{hasExtractedText ? (
								<>
									<CheckCircle2 className="text-green-600" size={24} />
									<p className="text-2xl font-bold text-green-600">Yes</p>
								</>
							) : (
								<>
									<XCircle className="text-gray-400" size={24} />
									<p className="text-2xl font-bold text-gray-400">No</p>
								</>
							)}
						</div>
					</div>
				</div>

				{allImagesProcessed && !hasExtractedText && (
					<div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
						<p className="text-yellow-800 font-medium text-center">
							No text was extracted from the images. Please try different
							images.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default ProcessingSummary;
