import type { Metadata } from "next";
import '@fontsource-variable/montserrat';
import '@fontsource-variable/noto-sans-bengali';
import "./globals.css";

export const metadata: Metadata = {
  title: "CommerceXLab | Admin Workspace",
  description: "Unified online, retail and wholesale commerce workspace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body suppressHydrationWarning>{children}</body></html>;
}
