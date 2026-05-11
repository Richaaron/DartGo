import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  GraduationCap, 
  Pencil, 
  Compass, 
  Calculator, 
  Library,
  Atom,
  Pi,
  Binary,
  Globe
} from 'lucide-react';

const icons = [
  BookOpen, 
  GraduationCap, 
  Pencil, 
  Compass, 
  Calculator, 
  Library,
  Atom,
  Pi,
  Binary,
  Globe
];

const FloatingAcademicBackground: React.FC = () => {
  const floatingElements = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => {
      const Icon = icons[Math.floor(Math.random() * icons.length)];
      const size = Math.floor(Math.random() * 40) + 20;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const duration = Math.random() * 20 + 20;
      const delay = Math.random() * -40;
      
      return (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
          animate={{ 
            opacity: [0, 0.1, 0.1, 0],
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            rotate: [0, 360]
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay,
            ease: "linear"
          }}
          className="absolute pointer-events-none text-royal-purple-500/20 dark:text-royal-purple-400/10"
          style={{
            left: `${left}%`,
            top: `${top}%`,
          }}
        >
          <Icon size={size} strokeWidth={1} />
        </motion.div>
      );
    });
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {floatingElements}
    </div>
  );
};

export default FloatingAcademicBackground;
