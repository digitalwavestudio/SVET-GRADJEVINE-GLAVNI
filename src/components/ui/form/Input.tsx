import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from '@/src/components/ui/form/FormField';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  description?: string;
  icon?: string;
}

export function Input({ name, label, description, icon, required, ...props }: InputProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <FormField name={name} label={label} description={description} required={required}>
      <div className="relative">
        <input
          {...register(name, { valueAsNumber: props.type === 'number' })}
          {...props}
          className={`w-full bg-white/5 border-2 ${error ? 'border-[#ff4d4d] shadow-[0_0_10px_rgba(255,77,77,0.2)]' : 'border-white/5'} rounded-[10px] px-6 py-5 text-white focus:border-[#ffad3a]/50 outline-none transition-all font-bold group-hover:bg-white/[0.08] placeholder:text-white/20`}
        />
        {icon && (
          <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-[#a2acb9] pointer-events-none group-hover:text-[#ffad3a] transition-colors">
            {icon}
          </span>
        )}
      </div>
    </FormField>
  );
}
