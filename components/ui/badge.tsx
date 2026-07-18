import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-5 max-w-full items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none tracking-[0.01em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-background text-foreground",
        neutral: "border-border/70 bg-muted/70 text-muted-foreground",
        info: "border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-800/70 dark:bg-blue-950/50 dark:text-blue-300",
        success:
          "border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300",
        warning:
          "border-amber-200/70 bg-amber-50 text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-300",
        destructive:
          "border-red-200/70 bg-red-50 text-red-700 dark:border-red-800/70 dark:bg-red-950/50 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";

    return (
      <Comp
        className={cn(badgeVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
