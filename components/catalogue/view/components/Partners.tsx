import PartnerBadge from "@/components/general/PartnerBadge";

export const Partners = ({ activeData }: { activeData: any }) => {
	if (
		!activeData?.partners ||
		activeData?.partners.length === 0 ||
		!activeData?.footer.showPartners
	)
		return null;

	return (
		<div className="space-y-6">
			<h4 className="text-lg font-semibold flex items-center space-x-2 font-heading font-weight-heading tracking-heading text-catalogue-navigation-text">
				<div
					aria-hidden="true"
					className="w-1 h-5 bg-primary rounded-full"
				></div>
				<span>Trusted Partners</span>
			</h4>
			<ul className="space-y-3">
				{activeData?.partners.map((partner: any, index: number) => (
					<li key={`partner-${index}`}>
						<PartnerBadge partner={partner} />
					</li>
				))}
			</ul>
		</div>
	);
};

export default Partners;
