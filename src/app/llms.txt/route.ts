export async function GET() {
	const content = `# Quicktalog

> Stop Losing Customers to Outdated Catalogs

Replace printed catalogs with an interactive, mobile-friendly online catalog you can update in real time.

## Overview

Quicktalog empowers businesses to create, manage, and share interactive digital catalogues for products and services. Go from idea to live in minutes.

### Why Digital?

- **No Code Required**: No design skills needed. Professional results, zero experience needed.
- **Instant Updates**: Change prices, add new services, or run a promotion in seconds. Your catalog is always up-to-date.
- **Share Anywhere**: Share your catalog instantly with a link or QR code. Track views and reach unlimited customers.

## Key Features

- **AI-Powered Creation**: Let our AI build your entire catalog for you. Just describe your business and watch the magic happen.
- **OCR Import Technology**: Convert existing paper catalogs instantly with AI technology.
- **Mobile-First Design**: Your catalog will look amazing on smartphones, tablets, and desktops, guaranteed.
- **Real-Time Analytics**: See what's popular, what's not, and what your customers are looking for to make data-driven decisions.
- **Professional Templates**: Choose from a variety of professionally designed catalog templates.

## How It Works

1. **Create**: Use our intuitive editor or AI generation tools.
2. **Go Live**: Publish in minutes and get a unique link.
3. **Grow**: Share via QR code and track performance with analytics.

## Pricing

Start with our **Free Plan**.
- One digital catalog
- Basic customization
- QR code sharing
- Email support

Upgrade for:
- More catalogs
- AI features
- OCR import
- Advanced analytics

## Common Questions

**Q: What exactly is a digital catalog and how is it different from a website?**
A: A digital catalog is a mobile-friendly, interactive showcase of your products or services specifically designed for showcasing your offerings with easy updates, QR code sharing, and customer engagement features.

**Q: Do I need technical skills?**
A: Not at all! Our platform is designed for non-technical users. Most users create their first catalog in under 5 minutes.

**Q: Can I update my catalog easily?**
A: Absolutely! Changes go live instantly, so your customers always see the most current information.

**Q: Is my data secure?**
A: We use industry-standard encryption and security measures. Your catalog information is private and secure.
`;

	return new Response(content, {
		headers: {
			"Content-Type": "text/plain",
		},
	});
}
