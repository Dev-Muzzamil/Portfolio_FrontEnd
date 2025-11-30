import { motion, useInView, useAnimation } from 'framer-motion'
import { useEffect, useRef } from 'react'

const Reveal = ({ children, width = "fit-content", delay = 0, className = "" }) => {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" }) // Threshold approx 0.2 equivalent with margin
    const mainControls = useAnimation()

    useEffect(() => {
        if (isInView) {
            mainControls.start("visible")
        }
    }, [isInView, mainControls])

    return (
        <div ref={ref} style={{ position: "relative", width }} className={className}>
            <motion.div
                variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                animate={mainControls}
                transition={{
                    duration: 0.9,
                    delay: delay,
                    ease: [0.16, 1, 0.3, 1]
                }}
            >
                {children}
            </motion.div>
        </div>
    )
}

export default Reveal
