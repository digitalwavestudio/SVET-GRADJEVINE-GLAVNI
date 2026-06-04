import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const cardVariants = cva(
  "bg-[#0A0F14] border border-white/5 rounded-[10px]",
  {
    variants: {
      padding: {
        default: "p-8",
        lg: "p-10",
        none: "p-0",
      },
      layout: {
        default: "",
        flexCol: "flex flex-col justify-between",
        flexColFull: "h-full flex flex-col min-h-[400px]",
      },
    },
    defaultVariants: {
      padding: "default",
      layout: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, padding, layout, ...props }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ padding, layout, className }))}
      {...props}
    />
  );
}
