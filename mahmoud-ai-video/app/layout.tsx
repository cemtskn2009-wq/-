import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "MAHMOUD AI — Private Video Studio",
  description: "Mahmoud's private AI video creation studio",
  robots: { index: false, follow: false }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar"><body>{children}</body></html>;
}
