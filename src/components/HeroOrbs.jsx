import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const HeroOrbs = () => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    if (isMobile) return null

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Warm Orb */}
            <motion.div
                className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-warm-orb dark:bg-warm-orb-dark opacity-40 mix-blend-multiply dark:mix-blend-soft-light filter blur-[80px] md:blur-[120px]"
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
                className="absolute bottom-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full bg-cool-orb dark:bg-cool-orb-dark opacity-40 mix-blend-multiply dark:mix-blend-soft-light filter blur-[80px] md:blur-[120px]"
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
