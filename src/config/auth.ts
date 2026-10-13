import { SITE } from "@/config/site";

/** Platforma 11 yoshdan: tug'ilgan yil chegarasi (server bilan bir xil). */
export const BIRTH_YEAR_MIN = 1940;
export const BIRTH_YEAR_MAX = SITE.year - 10;

export const AUTH_REDIRECT = "/student";
export const USERNAME_RE = /^[a-z0-9][a-z0-9_.]{2,23}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
