import { FiChevronDown } from "react-icons/fi"
import { Button } from "../ui/button"

const SectionHeader = ({
  title,
  code,
  isExpanded,
  onToggle,
}: {
  title: string
  code: string
  isExpanded: boolean
  onToggle: (code: string) => void
}) => {
  return (
    <Button
      onClick={() => onToggle(code)}
      aria-expanded={isExpanded}
      aria-controls={`section-content-${code}`}
      id={`section-header-${code}`}
      type="button"
      variant="section-header"
      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title} section`}
      style={{
        background: "var(--section-header-gradient)",
        fontFamily: "var(--font-family-heading)",
        fontWeight: "var(--font-weight-heading)",
        letterSpacing: "var(--letter-spacing-heading)",
      }}>
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-section-header-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-hidden="true"></div>

      <span className="relative inline-block z-10">
        <span className="relative">
          {title}
          {/* Animated underline */}
          <span
            className="absolute left-0 -bottom-1 h-[3px] w-0 bg-section-header-accent 
              transition-all duration-500 ease-out group-hover:w-full rounded-full"
            aria-hidden="true"></span>
        </span>
      </span>

      {/* Icon with enhanced styling */}
      <div className="relative z-10 flex items-center">
        <div
          className="w-8 h-8 bg-section-header-accent/10 rounded-full flex items-center justify-center mr-2 group-hover:bg-section-header-accent/20 transition-colors duration-300"
          aria-hidden="true">
          <FiChevronDown
            className={`text-2xl text-section-header-accent transition-all duration-300 
              ${isExpanded ? "rotate-180 scale-110" : "rotate-0 scale-100"}`}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 rounded-2xl bg-section-header-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
        aria-hidden="true"></div>
    </Button>
  )
}

export default SectionHeader
