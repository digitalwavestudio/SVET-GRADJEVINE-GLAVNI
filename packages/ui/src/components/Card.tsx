import React from 'react';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isHoverable?: boolean;
}

export const Card = ({
  children,
  className = '',
  onClick,
  isHoverable = true,
}: CardProps) => {
  return (
    <motion.div
      whileHover={isHoverable ? { y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' } : undefined}
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </motion.div>
  );
};
