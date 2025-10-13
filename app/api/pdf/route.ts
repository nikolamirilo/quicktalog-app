//@ts-nocheck
import { NextResponse } from "next/server"
import puppeteer from "puppeteer"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fullURL = searchParams.get("url")
  const name = searchParams.get("name") || "catalogue"

  if (!fullURL) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  const page = await browser.newPage()
  await page.goto(fullURL, { waitUntil: "networkidle0", timeout: 60000 })

  // Remove navbar and footer elements
  await page.evaluate(() => {
    // Remove common navbar selectors
    const navbarSelectors = ["nav", "header", '[role="banner"]', ".navbar", ".header"]
    navbarSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => el.remove())
    })

    // Remove common footer selectors
    const footerSelectors = ["footer", '[role="contentinfo"]', ".footer"]
    footerSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => el.remove())
    })
  })

  // Measure full height of the webpage after removing elements
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight)

  const pdfBuffer = await page.pdf({
    printBackground: true,
    width: "210mm", // A4 width
    height: `${bodyHeight}px`, // full scroll height
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    preferCSSPageSize: false,
  })

  await browser.close()

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}.pdf"`,
    },
  })
}
