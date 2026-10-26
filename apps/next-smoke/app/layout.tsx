import type { ReactNode } from "react";
import "@northstar-js/tokens/tokens.css";
import "@northstar-js/fonts/fonts.css";
import "@northstar-js/react/styles.css";

export const metadata = { title: "Northstar smoke" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="night">
      <body>{children}</body>
    </html>
  );
}
