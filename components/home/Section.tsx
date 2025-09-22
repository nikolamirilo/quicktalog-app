import React from "react"
import SectionTitle from "./SectionTitle"

interface Props {
  id: string
  title: string
  description: string
}

const Section: React.FC<React.PropsWithChildren<Props>> = ({
  id,
  title,
  description,
  children,
}: React.PropsWithChildren<Props>) => {
  return (
    <section id={id} className="py-10 lg:py-20 lg:px-0 bg-product-background">
      <div className="px-4">
      <SectionTitle>
        <h2 className="text-center mb-4">{title}</h2>
      </SectionTitle>
      
        <p className="mb-12 text-center">{description}</p>
        </div>
        {children}
      
    </section>
  )
}

export default Section
