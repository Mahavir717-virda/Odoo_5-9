import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-teal-700 text-white shadow-sm hover:bg-teal-800 active:bg-teal-900",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
        outline:
          "border border-slate-200 bg-white text-slate-800 shadow-xs hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100",
        secondary:
          "bg-slate-100 text-slate-800 border border-slate-200 shadow-xs hover:bg-slate-200 active:bg-slate-300",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
        link:
          "text-teal-700 underline-offset-4 hover:underline hover:text-teal-800",
        success:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800",
        warning:
          "bg-amber-500 text-slate-900 shadow-sm hover:bg-amber-600 active:bg-amber-700",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs:      "h-7 rounded-md px-2.5 text-xs",
        sm:      "h-8 rounded-md px-3 text-xs",
        lg:      "h-10 rounded-lg px-6",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
