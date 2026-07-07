import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from '@/src/components/ui/form/FormField';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label: string;
  description?: string;
}

export function Textarea({ name, label, description, required, ...props }: TextareaProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <FormField name={name} label={label} description={description} required={required}>
      <textarea
        {...register(name)}
        {...props}
        className={`w-full bg-white/[0.03] border ${error ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-white/10'} rounded-[10px] px-6 py-5 text-white focus:border-[#ffad3a]/50 focus:bg-[#070d14]/80 focus:shadow-[0_0_20px_rgba(254,191,13,0.1)] outline-none transition-all duration-300 font-bold resize-none group-hover:bg-white/[0.06] group-hover:border-white/20 placeholder:text-white/20`}
      />
    </FormField>
  );
}
