import Link from "next/link";
import { FiPlus } from "react-icons/fi";

import { CATALOGUE_BADGE_UTM } from "@/constants/marketing";

/**
 * Last column of the Quicktalog footer: an invitation to build a catalogue. The link
 * is tagged, so a signup that started on somebody's published catalogue is counted as
 * one - the badge is the product's own referral channel and used to be invisible.
 */
const DefaultActions = () => (
	<div className="cat-foot-wide">
		<h2>Create your own</h2>
		<p className="cat-foot-tag mb-4 mt-0 text-[15px]">
			Build a catalogue like this one in minutes.
		</p>
		<Link
			className="cat-foot-btn"
			href={`/auth?mode=signup&${CATALOGUE_BADGE_UTM}`}
		>
			<FiPlus aria-hidden="true" />
			Create Your Digital Catalogue
		</Link>
	</div>
);

export default DefaultActions;
