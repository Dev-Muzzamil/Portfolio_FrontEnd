import React from 'react';
import { motion } from 'framer-motion';

const AnimatedSection = ({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
  direction = 'up',
  viewport = { once: true },
  ...props
}) => {
  const getAnimationProps = () => {
    const baseProps = {
      initial: { opacity: 0 },
      whileInView: { opacity: 1 },
      transition: { duration, delay },
      viewport,
      ...props
    };

    switch (direction) {
      case 'up':
        return {
          ...baseProps,
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 }
        };
      case 'down':
        return {
          ...baseProps,
          initial: { opacity: 0, y: -20 },
          whileInView: { opacity: 1, y: 0 }
        };
      case 'left':
        return {
          ...baseProps,
          initial: { opacity: 0, x: -20 },
          whileInView: { opacity: 1, x: 0 }
        };
      case 'right':
        return {
          ...baseProps,
          initial: { opacity: 0, x: 20 },
          whileInView: { opacity: 1, x: 0 }
        };
      case 'scale':
        return {
          ...baseProps,
          initial: { opacity: 0, scale: 0.9 },
          whileInView: { opacity: 1, scale: 1 }
        };
      case 'fade':
      default:
        return baseProps;
    }
  };

  return (
    <motion.div
      {...getAnimationProps()}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
