import { motion } from 'framer-motion'

const HeroMarquee = ({ text = "CREATIVE DEVELOPER • DESIGN ENGINEER • " }) => {
    // Duplicate text enough times to ensure smooth scrolling
    const marqueeText = Array(4).fill(text).join("")

    return (
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 overflow-hidden pointer-events-none z-0 opacity-[0.08] dark:opacity-[0.05] mix-blend-multiply dark:mix-blend-normal select-none">
            <motion.div
                className="whitespace-nowrap font-serif text-[12rem] md:text-[16rem] leading-none text-ink dark:text-ink-dark"
                animate={{ x: [0, -1000] }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 30,
                }}
            >
                {marqueeText}
            </motion.div>
        </div>
    )
}

export default HeroMarquee
