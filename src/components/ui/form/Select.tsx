import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from '@/src/components/ui/form/FormField';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label: string;
  description?: string;
  icon?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export function Select({ name, label, description, icon, options, required, ...props }: SelectProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <FormField name={name} label={label} description={description} required={required}>
      <div className="relative">
        <select
          {...register(name)}
          {...props}
          className={`w-full bg-white/5 border-2 ${error ? 'border-[#ff4d4d] shadow-[0_0_10px_rgba(255,77,77,0.2)]' : 'border-white/5'} rounded-[10px] px-6 py-5 text-white focus:border-[#ffad3a]/50 outline-none appearance-none transition-all font-bold group-hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <option value="" disabled className="bg-[#050f19]">{props.placeholder || 'Izaberite opciju'}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value} className="bg-[#050f19]">{opt.label}</option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-[#a2acb9] pointer-events-none group-hover:text-[#ffad3a] transition-colors">
          {icon || 'expand_more'}
        </span>
      </div>
    </FormField>
  );
}
