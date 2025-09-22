import BenefitSection from "./BenefitSection"

import { benefits } from "@/constants/ui"

const Benefits: React.FC = () => {
  return (
    <div id="features" className="text-product-foreground">
      <h2 className="sr-only">Features</h2>
      {benefits.map((item, index) => {
        return <BenefitSection key={index} benefit={item} imageAtRight={index % 2 !== 0} />
      })}
    </div>
  )
}

export default Benefits
