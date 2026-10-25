import Link from "next/link";
import { FiPlus } from "react-icons/fi";

/** Last column of the Quicktalog footer: an invitation to build a catalogue. */
const DefaultActions = () => (
	<div className="cat-foot-wide">
		<h2>Create your own</h2>
		<p className="cat-foot-tag mb-4 mt-0 text-[15px]">
			Build a catalogue like this one in minutes.
		</p>
		<Link className="cat-foot-btn" href="/auth?mode=signup">
			<FiPlus aria-hidden="true" />
			Create Your Digital Catalog
		</Link>
	</div>
);

export default DefaultActions;
