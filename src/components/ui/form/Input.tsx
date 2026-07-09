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
          className={`w-full bg-[#070d14] border ${error ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-white/10'} rounded-[10px] px-6 py-5 text-white focus:border-[#ffad3a]/50 focus:bg-[#070d14] focus:shadow-[0_0_20px_rgba(254,191,13,0.1)] outline-none transition-all duration-300 font-bold group-hover:bg-white/[0.06] group-hover:border-white/20 placeholder:text-white/20 [-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s,color_0s_ease-in-out_0s] [-webkit-autofill]:[background-color:#070d14!important] [-webkit-autofill]:[-webkit-text-fill-color:white!important] [-webkit-autofill]:[box-shadow:0_0_0px_1000px_#070d14_inset!important]`}
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
