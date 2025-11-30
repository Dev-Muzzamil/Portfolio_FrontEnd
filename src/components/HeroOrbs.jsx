import { motion } from 'framer-motion'

const HeroOrbs = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Warm Orb */}
            <motion.div
                className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-warm-orb opacity-40 mix-blend-multiply filter blur-[80px] md:blur-[120px]"
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Cool Orb */}
            <motion.div
                className="absolute bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full bg-cool-orb opacity-40 mix-blend-multiply filter blur-[80px] md:blur-[120px]"
                animate={{
                    x: [0, -100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </div>
    )
}

export default HeroOrbs
