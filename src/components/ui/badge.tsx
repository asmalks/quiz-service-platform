import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-smooth focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary-light shadow-sm hover:shadow-md",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-muted shadow-sm",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
        outline: "text-foreground border-2 border-border hover:bg-secondary/50",
        accent: "border-transparent bg-accent text-accent-foreground hover:bg-accent-dark shadow-sm hover:shadow-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
