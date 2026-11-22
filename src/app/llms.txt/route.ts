export async function GET() {
	const content = `# Quicktalog

> Stop Losing Customers to Outdated Catalogues

Replace printed catalogues with an interactive, mobile-friendly online catalogue you can update in real time.

## Overview

Quicktalog empowers businesses to create, manage, and share interactive digital catalogues for products and services. Go from idea to live in minutes.

### Why Digital?

- **No Code Required**: No design skills needed. Professional results, zero experience needed.
- **Instant Updates**: Change prices, add new services, or run a promotion in seconds. Your catalogue is always up-to-date.
- **Share Anywhere**: Share your catalogue instantly with a link or QR code. Track views and reach unlimited customers.

## Key Features

- **Quick AI**: An assistant in the builder that drafts and edits your catalogue from a description. You see what it changed and accept or reject it.
- **Photo import**: Attach up to 10 photos of a printed menu or price list to a Quick AI message and it reads the items and prices into your catalogue.
- **Mobile-First Design**: Your catalogue will look amazing on smartphones, tablets, and desktops, guaranteed.
- **Real-Time Analytics**: See what's popular, what's not, and what your customers are looking for to make data-driven decisions.
- **Professional Templates**: Choose from a variety of professionally designed catalogue templates.

## How It Works

1. **Create**: Use the builder, with Quick AI to draft or edit for you.
2. **Go Live**: Publish in minutes and get a unique link.
3. **Grow**: Share via QR code and track performance with analytics.

## Pricing

Start with our **Free Plan**.
- One digital catalogue
- Basic customization
- QR code sharing
- Email support

Upgrade for:
- More catalogues
- More AI credits per month
- Advanced analytics

## Common Questions

**Q: What exactly is a digital catalogue and how is it different from a website?**
A: A digital catalogue is a mobile-friendly, interactive showcase of your products or services specifically designed for showcasing your offerings with easy updates, QR code sharing, and customer engagement features.

**Q: Do I need technical skills?**
A: Not at all! Our platform is designed for non-technical users. Most users create their first catalogue in under 5 minutes.

**Q: Can I update my catalogue easily?**
A: Absolutely! Changes go live instantly, so your customers always see the most current information.

**Q: Is my data secure?**
A: We use industry-standard encryption and security measures. Your catalogue information is private and secure.
`;

	return new Response(content, {
		headers: {
			"Content-Type": "text/plain",
		},
	});
}
