import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CP — Catholic Professionals",
  description: "Catholic Professional group portal: membership, finance, events, and reports.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#367C00",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased overscroll-x-none">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
