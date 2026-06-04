import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { UI_TOKENS } from '@/src/lib/uiTokens';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'premium' | 'post-ad' | 'ghost' | 'blue' | 'nav-premium';
  to?: string;
  icon?: string;
  asChild?: boolean;
  className?: string;
  motionProps?: any;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  to,
  icon,
  children,
  className = '',
  motionProps = {},
  ...props
}) => {
  const variantClasses = {
    primary: UI_TOKENS.BTN_PRIMARY,
    secondary: UI_TOKENS.BTN_SECONDARY,
    premium: UI_TOKENS.BTN_PREMIUM,
    'post-ad': UI_TOKENS.BTN_POST_AD,
    'nav-premium': "group flex bg-gradient-to-br from-[#ffeb3b] to-[#fb8c00] hover:from-[#fb8c00] hover:to-[#ffeb3b] text-slate-950 px-5 py-2 rounded-[10px] font-bold transition-all duration-300 hover:shadow-lg hover:shadow-secondary/30 text-[11px] uppercase tracking-widest items-center gap-2 leading-[1.1] text-center",
    ghost: "text-on-surface-variant hover:text-secondary hover:bg-secondary/10 transition-all px-4 py-2 rounded-[10px]",
    blue: "group bg-gradient-to-br from-blue-400 to-blue-700 text-white px-6 py-2 rounded-[10px] font-black transition-all duration-300 hover:from-blue-500 hover:to-blue-800 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] text-xs uppercase tracking-widest flex items-center gap-2"
  };

  const finalClasses = `${variantClasses[variant as keyof typeof variantClasses] || variantClasses.primary} ${className} transition-all duration-300 flex items-center justify-center gap-2 group`;

  const content = (
    <>
      {icon && (
        <span className="material-symbols-outlined transition-transform duration-500 group-hover:rotate-[360deg]">
          {icon}
        </span>
      )}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={finalClasses} {...(props as import('react').AnchorHTMLAttributes<HTMLAnchorElement>)}>
        <motion.span 
          className="flex items-center gap-2"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          {...motionProps}
        >
          {content}
        </motion.span>
      </Link>
    );
  }

  return (
    <motion.button
      className={finalClasses}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      {...motionProps}
      {...props}
    >
      <span className="flex items-center gap-2">
        {content}
      </span>
    </motion.button>
  );
};
