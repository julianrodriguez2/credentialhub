import * as React from "react";

import { cn } from "@/lib/utils";

const Form = React.forwardRef<HTMLFormElement, React.ComponentProps<"form">>(
  ({ className, ...props }, ref) => (
    <form ref={ref} className={cn("space-y-4", className)} {...props} />
  ),
);
Form.displayName = "Form";

const FormItem = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  ),
);
FormItem.displayName = "FormItem";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm font-medium text-red-600", className)}
    {...props}
  />
));
FormMessage.displayName = "FormMessage";

export { Form, FormItem, FormMessage };
