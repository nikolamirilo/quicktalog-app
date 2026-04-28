import { FiMapPin } from "react-icons/fi";
import { MdTitle } from "react-icons/md";

export const CompanyInfo = ({ activeData }: { activeData: any }) => {
	if (!activeData?.legal?.legalName && !activeData?.legal?.address) return null;

	return (
		<div className="space-y-6">
			<h4 className="text-lg font-semibold flex items-center space-x-2 font-heading font-weight-heading tracking-heading text-catalogue-navigation-text">
				<div
					aria-hidden="true"
					className="w-1 h-5 bg-primary rounded-full"
				></div>
				<span>Company Information</span>
			</h4>
			<ul className="space-y-4">
				{activeData?.legal?.legalName && (
					<li className="flex items-center space-x-3">
						<MdTitle className="w-4 h-4 flex-shrink-0 text-catalogue-navigation-text" />
						<span className="text-sm text-catalogue-navigation-text">
							{activeData?.legal?.legalName}
						</span>
					</li>
				)}
				{activeData?.legal?.address && (
					<li className="flex items-start space-x-3">
						<FiMapPin className="w-4 h-4 mt-1 flex-shrink-0 text-catalogue-navigation-text" />
						<div className="text-sm text-catalogue-navigation-text">
							<div>{activeData?.legal?.address}</div>
						</div>
					</li>
				)}
			</ul>
		</div>
	);
};

export default CompanyInfo;
