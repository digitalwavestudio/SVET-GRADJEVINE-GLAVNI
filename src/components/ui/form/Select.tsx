import React, { useState, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from '@/src/components/ui/form/FormField';
import { motion, AnimatePresence } from 'motion/react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label: string;
  description?: string;
  icon?: string;
  options: { value: string | number; label: string; className?: string }[];
  placeholder?: string;
}

export function Select({ name, label, description, icon, options, required, ...props }: SelectProps) {
  const { register, formState: { errors }, watch, setValue } = useFormContext();
  const error = errors[name];
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const value = watch(name);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string | number) => {
    setValue(name, val, { shouldValidate: true, shouldDirty: true });
    setIsOpen(false);
  };

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <FormField name={name} label={label} description={description} required={required}>
      <div className="relative group" ref={dropdownRef}>
        <select
          {...register(name, { required })}
          {...props}
          className="sr-only"
          tabIndex={-1}
          value={value || ''}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <option value="" disabled>{props.placeholder || 'Izaberite opciju'}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className={opt.className || ''}>{opt.label}</option>
          ))}
        </select>
        
        <button
          type="button"
          onClick={() => !props.disabled && setIsOpen(!isOpen)}
          className={`w-full text-left bg-white/[0.03] border ${error ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : isOpen ? 'border-[#ffad3a]/50 bg-[#070d14]/80 shadow-[0_0_20px_rgba(254,191,13,0.1)]' : 'border-white/10'} rounded-[10px] px-6 py-5 text-white outline-none transition-all duration-300 font-bold group-hover:bg-white/[0.06] group-hover:border-white/20 ${props.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'} flex items-center justify-between`}
        >
          <span className={!selectedOption ? 'text-white/50 font-medium' : 'text-white'}>
            {selectedOption ? selectedOption.label : (props.placeholder || 'Izaberite opciju')}
          </span>
          <span className={`material-symbols-outlined text-[#a2acb9] pointer-events-none transition-all duration-300 ${isOpen ? 'rotate-180 text-[#ffad3a]' : 'group-hover:text-[#ffad3a]'}`}>
            {icon || 'expand_more'}
          </span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-2 bg-[#0B131A] backdrop-blur-xl border border-white/10 rounded-[12px] shadow-[0_15px_40px_rgba(0,0,0,0.7)] overflow-hidden max-h-64 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
            >
              <div className="flex flex-col p-2">
                {options.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`text-left px-4 py-3.5 rounded-[8px] transition-all duration-200 text-[13px] font-bold tracking-wide ${
                      String(value) === String(opt.value)
                        ? 'bg-secondary/15 text-secondary border border-secondary/20 shadow-[inset_0_1px_1px_rgba(254,191,13,0.1)]'
                        : 'text-white/80 hover:bg-white/5 hover:text-white border border-transparent'
                    } ${opt.className || ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormField>
  );
}
