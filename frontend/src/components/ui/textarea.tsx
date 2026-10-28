import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 max-h-48 w-full overflow-y-auto rounded-xl border border-input bg-input/30 px-[18px] py-[14px] text-[15px] transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-emerald-light focus-visible:shadow-[0_0_20px_rgba(52,211,153,0.2)] disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
