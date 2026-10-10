import { JSX } from "react";
import { BsGlobe2 } from "react-icons/bs";
import {
	FaFacebook,
	FaGithub,
	FaInstagram,
	FaLinkedin,
	FaThreads,
	FaTiktok,
	FaTwitter,
	FaXTwitter,
	FaYoutube,
} from "react-icons/fa6";
import { FiExternalLink, FiShield, FiUsers, FiZap } from "react-icons/fi";

export const getPlatformIconByName = (
	platformName: string,
): JSX.Element | null => {
	switch (platformName) {
		case "facebook": {
			return <FaFacebook className="min-w-fit" size={24} />;
		}
		case "github": {
			return <FaGithub className="min-w-fit" size={24} />;
		}
		case "instagram": {
			return <FaInstagram className="min-w-fit" size={24} />;
		}
		case "linkedin": {
			return <FaLinkedin className="min-w-fit" size={24} />;
		}
		case "threads": {
			return <FaThreads className="min-w-fit" size={24} />;
		}
		case "website": {
			return <BsGlobe2 className="min-w-fit" size={24} />;
		}
		case "twitter": {
			return <FaTwitter className="min-w-fit" size={24} />;
		}
		case "youtube": {
			return <FaYoutube className="min-w-fit" size={24} />;
		}
		case "x": {
			return <FaXTwitter className="min-w-fit" size={24} />;
		}
		case "tiktok": {
			return <FaTiktok className="min-w-fit" size={24} />;
		}
		default:
			console.log(
				"Platform name not supported, no icon is returned:",
				platformName,
			);
			return null;
	}
};

export const footerFeatures = [
	{
		icon: <FiZap className="w-4 h-4" />,
		title: "OCR Import Technology",
		description: "Scan existing catalogs",
	},
	{
		icon: <FiShield className="w-4 h-4" />,
		title: "Secure & Reliable",
		description: "Enterprise-grade security",
	},
	{
		icon: <FiUsers className="w-4 h-4" />,
		title: "Multi-device Access",
		description: "Works on all devices",
	},
	{
		icon: <FiExternalLink className="w-4 h-4" />,
		title: "QR Code Sharing",
		description: "One-click sharing",
	},
];
