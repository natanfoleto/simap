import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
        secondary:
          "border border-secondary-foreground/10 bg-secondary/60 text-secondary-foreground hover:bg-secondary",
        destructive:
          "border border-destructive/20 bg-destructive/10 text-destructive dark:bg-destructive/20 hover:bg-destructive/20",
        success:
          "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/20 hover:bg-emerald-500/20",
        warning:
          "border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300 dark:bg-amber-500/20 hover:bg-amber-500/20",
        neutral:
          "border border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300 dark:bg-slate-500/20 hover:bg-slate-500/20",
        outline: "border border-border/80 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
