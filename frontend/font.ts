import localFont from "next/font/local";

export const aeonik = localFont({
  src: [
    {
      path: "src/fonts/Aeonik/AeonikTRIAL-Light.otf", // 👈 no ../public
      weight: "300", // Light
      style: "normal",
    },
    {
      path: "src/fonts/Aeonik/fonnts.com-Aeonik-Regular.ttf",
      weight: "400", // Regular
      style: "normal",
    },
  ],
  variable: "--font-aeonik",
  display: "swap",
});
