import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Duration helpers - returns milliseconds */
export const seconds = (n: number) => n * 1000;
export const minutes = (n: number) => n * 60 * 1000;
export const hours = (n: number) => n * 60 * 60 * 1000;
