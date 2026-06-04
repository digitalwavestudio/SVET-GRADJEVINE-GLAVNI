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
        className={`w-full bg-white/5 border-2 ${error ? 'border-[#ff4d4d] shadow-[0_0_10px_rgba(255,77,77,0.2)]' : 'border-white/5'} rounded-[10px] px-6 py-5 text-white focus:border-[#ffad3a]/50 outline-none transition-all font-bold resize-none group-hover:bg-white/[0.08] placeholder:text-white/20`}
      />
    </FormField>
  );
}
