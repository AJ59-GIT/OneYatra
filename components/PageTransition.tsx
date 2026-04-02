import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

const routeLevels: Record<string, number> = {
  '/': 0,
  '/login': -1,
  '/results': 1,
  '/booking': 2,
  '/booking-success': 3,
  '/saved-trips': 1,
  '/my-trips': 1,
  '/wallet': 1,
  '/profile': 1,
  '/loyalty': 2,
  '/support': 1,
  '/alerts': 1,
  '/admin': 2,
  '/complete-profile': 0.5,
};

const mainTabs = ['/', '/saved-trips', '/my-trips', '/wallet', '/profile', '/alerts'];

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [direction, setDirection] = useState<'forward' | 'backward' | 'fade'>('fade');
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    if (prevPath !== location.pathname) {
      const prevLevel = routeLevels[prevPath] ?? 0;
      const currentLevel = routeLevels[location.pathname] ?? 0;

      const isPrevMain = mainTabs.includes(prevPath);
      const isCurrentMain = mainTabs.includes(location.pathname);

      if (isPrevMain && isCurrentMain) {
        setDirection('fade');
      } else if (currentLevel > prevLevel) {
        setDirection('forward');
      } else if (currentLevel < prevLevel) {
        setDirection('backward');
      } else {
        setDirection('fade');
      }
      
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  const variants = {
    forward: {
      initial: { x: 30, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -30, opacity: 0 },
    },
    backward: {
      initial: { x: -30, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 30, opacity: 0 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[direction]}
      transition={{ 
        duration: 0.25,
        ease: "easeInOut"
      }}
      className="w-full h-full flex flex-col flex-grow"
    >
      {children}
    </motion.div>
  );
};
