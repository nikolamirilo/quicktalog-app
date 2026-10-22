import { FaqAccordion } from "@/components/general/FaqAccordion";
import { faqs } from "@/constants/details";

/** Home FAQ: the first five questions, with "Load More Questions" for the rest. */
export const FAQ = () => <FaqAccordion initialCount={5} items={faqs} />;
