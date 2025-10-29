import { FiChevronDown } from "react-icons/fi";
import { Button } from "../ui/button";

const SectionHeader = ({
	title,
	code,
	isExpanded,
	onToggle,
}: {
	title: string;
	code: string;
	isExpanded: boolean;
	onToggle: (code: string) => void;
}) => {
	return (
		<Button
			aria-controls={`section-content-${code}`}
			aria-expanded={isExpanded}
			aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title} section`}
			className="group relative overflow-hidden will-change-transform"
			id={`section-header-${code}`}
			onClick={() => onToggle(code)}
			style={{
				background: "var(--section-header-gradient)",
				fontFamily: "var(--font-family-heading)",
				fontWeight: "var(--font-weight-heading)",
				letterSpacing: "var(--letter-spacing-heading)",
				// Use transform3d to enable hardware acceleration
				transform: "translate3d(0, 0, 0)",
			}}
			type="button"
			variant="section-header"
		>
			{/* Simplified hover effect - single gradient overlay */}
			<div
				aria-hidden="true"
				className="absolute inset-0 bg-gradient-to-r from-transparent via-section-header-accent/8 to-transparent 
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out"
				style={{ willChange: "opacity" }}
			/>

			{/* Title with simplified underline animation */}
			<span className="relative z-10">
				<span className="relative inline-block">
					{title}
					<span
						aria-hidden="true"
						className="absolute left-0 -bottom-1 h-0.5 bg-section-header-accent rounded-full
              transition-all duration-200 ease-out origin-left"
						style={{
							width: isExpanded ? "100%" : "0%",
							willChange: "width",
						}}
					/>
				</span>
			</span>

			<div className="relative z-10 flex items-center">
				<div
					aria-hidden="true"
					className="w-7 h-7 bg-section-header-accent/10 rounded-full flex items-center justify-center
            group-hover:bg-section-header-accent/15 transition-colors duration-150 ease-out"
					style={{ willChange: "background-color" }}
				>
					<FiChevronDown
						aria-hidden="true"
						className="text-lg text-foreground transition-transform duration-200 ease-out"
						style={{
							transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
							willChange: "transform",
						}}
					/>
				</div>
			</div>
		</Button>
	);
};

export default SectionHeader;
