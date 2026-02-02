import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Since clsx and tailwind-merge are NOT installed, we use a simple fallback.
// If the user installs them, we can switch to the standard implementation.
// Standard would be:
// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

export function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(" ");
}
