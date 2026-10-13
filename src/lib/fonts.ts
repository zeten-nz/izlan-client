import localFont from "next/font/local";

/**
 * Barcha shriftlar loyiha ichida (src/assets/fonts) saqlanadi, tashqi CDN yo‘q.
 * Litsenziyalar: src/assets/fonts/LICENSES.md
 */
export const archivo = localFont({
  src: "../assets/fonts/archivo-latin-wdth-normal.woff2",
  weight: "100 900",
  variable: "--font-archivo",
  display: "swap",
});

export const spaceGrotesk = localFont({
  src: "../assets/fonts/space-grotesk-latin-wght-normal.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
  display: "swap",
});

export const spaceMono = localFont({
  src: [
    { path: "../assets/fonts/space-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/space-mono-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space-mono",
  display: "swap",
});

export const instrumentSerif = localFont({
  src: [
    { path: "../assets/fonts/instrument-serif-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/instrument-serif-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const fontVariables = [
  archivo.variable,
  spaceGrotesk.variable,
  spaceMono.variable,
  instrumentSerif.variable,
].join(" ");
