"use client"
import { stats } from "@/constants/ui"
import { motion, Variants } from "framer-motion"

const containerVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 100,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      bounce: 0.2,
      duration: 0.9,
      delayChildren: 0.2,
      staggerChildren: 0.1,
    },
  },
}

const childVariants = {
  offscreen: {
    opacity: 0,
    y: 50,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      bounce: 0.2,
      duration: 0.8,
    },
  },
}

const Stats: React.FC = () => {
  return (
    <section id="stats" className="py-10 lg:py-20">
      <motion.div
        className="grid sm:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true }}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="text-center sm:text-left max-w-md sm:max-w-full mx-auto"
            variants={childVariants}>
            <h3 className="mb-5 flex items-center gap-2 text-3xl font-semibold justify-center sm:justify-start">
              {stat.icon}
              {stat.title}
            </h3>
            <p className="text-product-foreground-accent">{stat.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

export default Stats
