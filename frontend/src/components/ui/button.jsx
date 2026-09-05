import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7743db] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#7743db] text-white shadow-sm shadow-[#7743db]/20 hover:bg-[#6334b8] active:bg-[#4f2795]",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
        outline:
          "border border-[#eae0d5] bg-white text-[#1e1b24] shadow-xs hover:bg-[#f7efe5] hover:text-[#1e1b24] active:bg-[#ede3d5]",
        secondary:
          "bg-[#f7efe5] text-[#1e1b24] border border-[#eae0d5] shadow-xs hover:bg-[#ede3d5] active:bg-[#e2d5c3]",
        ghost:
          "text-slate-700 hover:bg-[#f7efe5] hover:text-[#1e1b24] active:bg-[#ede3d5]",
        link:
          "text-[#7743db] underline-offset-4 hover:underline hover:text-[#6334b8]",
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
