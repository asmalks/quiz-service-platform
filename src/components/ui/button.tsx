import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-light shadow-card hover:shadow-lg hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-card hover:-translate-y-0.5",
        outline: "border-2 border-border bg-card hover:bg-secondary/50 hover:border-primary/30 shadow-sm hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted shadow-sm hover:shadow-md hover:-translate-y-0.5",
        ghost: "hover:bg-secondary/60 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        pill: "bg-primary text-primary-foreground hover:bg-primary-light rounded-full shadow-card hover:shadow-lg hover:-translate-y-1 transition-bounce",
        accent: "bg-accent text-accent-foreground hover:bg-accent-dark shadow-card hover:shadow-lg hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-14 rounded-2xl px-10 text-base",
        icon: "h-11 w-11",
        pill: "px-8 py-3.5 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
