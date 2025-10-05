import Link from "next/link"
import { Button } from "../ui/button"

const JoinOurCommunity = () => {
  return (
    <div className="bg-gradient-to-r items-center justify-center from-product-primary/10 to-product-primary/5 border border-product-primary rounded-2xl p-6 gap-3 flex flex-col text-center mb-4">
      <h2 className="text-xl font-semibold text-product-foreground">Join Our Beta Community</h2>
      <p className="text-product-foreground-accen text-sm">
        Be the first to shape the future of Quicktalog. Get priority support, early updates, and
        share your feedback directly with our team in our Discord group. Open until December 31,
        2025.
      </p>
      <div className="flex justify-center w-[50%]">
        <Button variant="cta" asChild>
          <Link href="https://discord.gg/t6bdJQGG">Join on Discord</Link>
        </Button>
      </div>
    </div>
  )
}

export default JoinOurCommunity
