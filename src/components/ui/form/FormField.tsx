import React from 'react';
import { useFormContext } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';

interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  children: React.ReactNode;
  required?: boolean;
}

export function FormField({ name, label, description, children, required }: FormFieldProps) {
  const { formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className="space-y-3 group">
      <label className="block text-[10px] font-black text-[#a2acb9] uppercase tracking-[0.2em] ml-1">
        {label} {required && <span className="text-[#ffad3a]">*</span>}
      </label>
      
      {children}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[#ff4d4d] text-[10px] font-bold mt-1 ml-1 uppercase tracking-wider"
          >
            {error.message as string}
          </motion.p>
        )}
      </AnimatePresence>

      {description && !error && (
        <p className="text-sm text-[#a2acb9]/60 font-medium mt-2 ml-1">
          {description}
        </p>
      )}
    </div>
  );
}
