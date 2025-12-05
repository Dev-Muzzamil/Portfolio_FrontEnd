import { useState, useEffect, useRef } from 'react'

const LazySection = ({ children, threshold = 0.1, minHeight = '50vh' }) => {
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { 
                threshold,
                rootMargin: '200px' // Load 200px before it comes into view
            }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [threshold])

    return (
        <div ref={ref} style={{ minHeight: isVisible ? 'auto' : minHeight }}>
            {isVisible ? children : null}
        </div>
    )
}

export default LazySection
