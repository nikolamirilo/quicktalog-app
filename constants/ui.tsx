import { IBenefit } from "@/types/components"
import { JSX } from "react"
import { BsGlobe2 } from "react-icons/bs"
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
} from "react-icons/fa6"
import {
  FiBarChart2,
  FiCalendar,
  FiCheck,
  FiClock,
  FiEdit3,
  FiExternalLink,
  FiPieChart,
  FiSettings,
  FiShare2,
  FiShield,
  FiSmartphone,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from "react-icons/fi"
import { RiGamepadLine, RiHeartPulseLine, RiScissorsLine, RiStore2Line } from "react-icons/ri"

import { IStats } from "@/types/components"
import { IoMdHelpCircleOutline } from "react-icons/io"
import { TbFileAnalytics } from "react-icons/tb"

export const stats: IStats[] = [
  {
    title: "5 Minutes",
    icon: <FiClock size={34} className="text-product-primary" />,
    description: "Average time to create your first digital catalog.",
  },
  {
    title: "Any Industry",
    icon: <FiUsers size={34} className="text-product-primary" />,
    description: "Perfect for any business that needs to showcase products or services.",
  },
  {
    title: "OCR Import",
    icon: <FiZap size={34} className="text-product-primary" />,
    description: "Convert existing paper catalogs instantly with AI technology.",
  },
]
export const examplePrompts = [
  {
    icon: <RiStore2Line size={18} />,
    category: "Italian Specialties",
    prompt:
      "Handmade pasta, wood-fired pizza, and regional wines from Lombardy—crafted with authentic flavors and seasonal ingredients",
  },
  {
    icon: <RiScissorsLine size={18} />,
    category: "Beauty Treatments",
    prompt:
      "Professional haircuts, vibrant coloring, nourishing facials, and luxury manicures using premium salon products",
  },
  {
    icon: <RiHeartPulseLine size={18} />,
    category: "Fitness Programs",
    prompt:
      "Personal training sessions, dynamic group classes, strength workouts, and cardio routines designed for every fitness level",
  },
  {
    icon: <RiGamepadLine size={18} />,
    category: "Leisure Activities",
    prompt:
      "Exciting bowling games, interactive arcade fun, birthday packages, and group-friendly entertainment options",
  },
  {
    icon: <RiStore2Line size={18} />,
    category: "Coffee & Pastries",
    prompt:
      "Specialty espresso drinks, freshly baked pastries, light bites, and signature blends for coffee lovers",
  },
]

export const benefits: IBenefit[] = [
  {
    title: "Go from Idea to Live in Minutes",
    description:
      "You don't have time for complicated software. Our platform is designed for speed. Create a beautiful, professional catalog in less time than it takes to make a cup of coffee.",
    bullets: [
      {
        title: "No Learning Curve",
        description: "Our intuitive editor is so simple, you'll feel like a pro in minutes.",
        icon: <FiCheck size={26} />,
      },
      {
        title: "Instant Updates",
        description:
          "Change prices, add new services, or run a promotion in seconds. Your catalog is always up-to-date.",
        icon: <FiClock size={26} />,
      },
      {
        title: "AI-Powered Creation",
        description:
          "Let our AI build your entire catalog for you. Just describe your business and watch the magic happen.",
        icon: <FiZap size={26} />,
      },
    ],
    imageSrc: "/images/mockup-1.svg",
  },
  {
    title: "Look Professional, Build Trust",
    description:
      "Your catalog is often the first impression a customer has of your business. Make it a great one with a beautiful, mobile-friendly design that builds trust and drives sales.",
    bullets: [
      {
        title: "Professional Catalog Templates",
        description:
          "Choose from a variety of professionally designed catalog templates that look great on any device.",
        icon: <FiEdit3 size={26} />,
      },
      {
        title: "Mobile-First Design",
        description:
          "Your catalog will look amazing on smartphones, tablets, and desktops, guaranteed.",
        icon: <FiSmartphone size={26} />,
      },
      {
        title: "Easy Sharing",
        description: "Share your catalog with a simple link or QR code. No app downloads required.",
        icon: <FiShare2 size={26} />,
      },
    ],
    imageSrc: "/images/mockup-2.svg",
  },
  {
    title: "Grow Your Business, Not Your Workload",
    description:
      "Our platform is designed to help you grow your business, without adding to your to-do list. Track your performance, understand your customers, and make smarter decisions.",
    bullets: [
      {
        title: "Real-Time Analytics",
        description: "See what's popular, what's not, and what your customers are looking for.",
        icon: <FiBarChart2 size={26} />,
      },
      {
        title: "Customer Insights",
        description:
          "Understand your customers better and make data-driven decisions to grow your business.",
        icon: <FiPieChart size={26} />,
      },
      {
        title: "Scale with Confidence",
        description:
          "Our secure and reliable platform grows with you, so you can focus on what you do best.",
        icon: <FiTrendingUp size={26} />,
      },
    ],
    imageSrc: "/images/mockup-3.svg",
  },
]

export const getPlatformIconByName = (platformName: string): JSX.Element | null => {
  switch (platformName) {
    case "facebook": {
      return <FaFacebook size={24} className="min-w-fit" />
    }
    case "github": {
      return <FaGithub size={24} className="min-w-fit" />
    }
    case "instagram": {
      return <FaInstagram size={24} className="min-w-fit" />
    }
    case "linkedin": {
      return <FaLinkedin size={24} className="min-w-fit" />
    }
    case "threads": {
      return <FaThreads size={24} className="min-w-fit" />
    }
    case "website": {
      return <BsGlobe2 size={24} className="min-w-fit" />
    }
    case "twitter": {
      return <FaTwitter size={24} className="min-w-fit" />
    }
    case "youtube": {
      return <FaYoutube size={24} className="min-w-fit" />
    }
    case "x": {
      return <FaXTwitter size={24} className="min-w-fit" />
    }
    case "tiktok": {
      return <FaTiktok size={24} className="min-w-fit" />
    }
    default:
      console.log("Platform name not supported, no icon is returned:", platformName)
      return null
  }
}

export const tabs = [
  { value: "overview", label: "Overview", icon: <TbFileAnalytics className="mr-2" size={20} /> },
  { value: "subscription", label: "Subscription", icon: <FiCalendar className="mr-2" size={20} /> },
  { value: "usage", label: "Usage", icon: <FiBarChart2 className="mr-2" size={20} /> },
  { value: "settings", label: "Settings", icon: <FiSettings className="mr-2" size={20} /> },
  {
    value: "support",
    label: "Support",
    icon: <IoMdHelpCircleOutline className="mr-2" size={20} />,
  },
]

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
]
