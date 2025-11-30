import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const Cursor = () => {
    const [isHovered, setIsHovered] = useState(false);
    const mouseX = useMotionValue(-100);
    const mouseY = useMotionValue(-100);

    // Spring configuration for the lagging effect
    const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
    const outlineX = useSpring(mouseX, springConfig);
    const outlineY = useSpring(mouseY, springConfig);

    useEffect(() => {
        const moveCursor = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        const handleMouseOver = (e) => {
            // Check if the target or its parents are interactive
            const target = e.target;
            const isInteractive =
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('a') ||
                target.closest('button') ||
                target.closest('.cursor-hover') || // Custom class for other interactive elements
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovered(isInteractive);
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [mouseX, mouseY]);

    return (
        <>
            {/* Main Dot */}
            <motion.div
                className="fixed top-0 left-0 w-2 h-2 bg-ink rounded-full pointer-events-none z-[9999]"
                style={{
                    x: mouseX,
                    y: mouseY,
                    translateX: '-50%',
                    translateY: '-50%'
                }}
            />

            {/* Lagging Outline */}
            <motion.div
                className={`fixed top-0 left-0 rounded-full pointer-events-none z-[9998] transition-all duration-300 ease-out ${isHovered
                        ? 'w-20 h-20 bg-accent/30 border-transparent mix-blend-multiply'
                        : 'w-8 h-8 border border-ink/50 bg-transparent'
                    }`}
                style={{
                    x: outlineX,
                    y: outlineY,
                    translateX: '-50%',
                    translateY: '-50%'
                }}
            />
        </>
    );
};

export default Cursor;
