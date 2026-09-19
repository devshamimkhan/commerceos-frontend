import type { Metadata } from "next";
import '@fontsource-variable/montserrat';
import '@fontsource-variable/noto-sans-bengali';
import "./globals.css";

export const metadata: Metadata = {
  title: "SportsShop | Admin Workspace",
  description: "Unified online, retail and wholesale commerce workspace.",
  icons: { icon: "/branding/sportsshop-icon.webp" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body suppressHydrationWarning>{children}</body></html>;
}
