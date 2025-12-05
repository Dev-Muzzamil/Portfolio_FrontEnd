import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const CursorSystem = () => {
    const [isHovering, setIsHovering] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const cursorX = useMotionValue(-100)
    const cursorY = useMotionValue(-100)

    const springConfig = { damping: 20, stiffness: 400, mass: 0.2 }
    const outlineX = useSpring(cursorX, springConfig)
    const outlineY = useSpring(cursorY, springConfig)

    useEffect(() => {
        // Detect if device is touch/mobile
        const checkMobile = () => {
            const isTouchDevice = () => {
                return (
                    (typeof window !== 'undefined' && 'ontouchstart' in window) ||
                    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
                    (typeof navigator !== 'undefined' && navigator.msMaxTouchPoints > 0)
                )
            }
            setIsMobile(isTouchDevice() || window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        const moveCursor = (e) => {
            cursorX.set(e.clientX)
            cursorY.set(e.clientY)
        }

        const handleMouseOver = (e) => {
            if (
                e.target.tagName === 'A' ||
                e.target.tagName === 'BUTTON' ||
                e.target.closest('a') ||
                e.target.closest('button') ||
                e.target.classList.contains('hover-trigger')
            ) {
                setIsHovering(true)
            } else {
                setIsHovering(false)
            }
        }

        window.addEventListener('mousemove', moveCursor)
        window.addEventListener('mouseover', handleMouseOver)

        return () => {
            window.removeEventListener('mousemove', moveCursor)
            window.removeEventListener('mouseover', handleMouseOver)
        }
    }, [cursorX, cursorY, isMobile])

    // Don't render cursor on mobile/touch devices
    if (isMobile) return null

    return (
        <>
            {/* Main Dot */}
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 bg-ink rounded-full pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: cursorX,
                    y: cursorY,
                    translateX: '-50%',
                    translateY: '-50%'
                }}
            />

            {/* Lagging Outline */}
            <motion.div
                className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] border border-ink/50"
                style={{
                    x: outlineX,
                    y: outlineY,
                    translateX: '-50%',
                    translateY: '-50%',
                    width: isHovering ? 80 : 40,
                    height: isHovering ? 80 : 40,
                    backgroundColor: isHovering ? 'rgba(212, 163, 115, 0.18)' : 'transparent',
                    transition: 'width 0.2s, height 0.2s, background-color 0.2s'
                }}
            />
        </>
    )
}

export default CursorSystem
