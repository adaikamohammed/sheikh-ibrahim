import type { Metadata, Viewport } from "next";
import { RealtimeProvider } from "@/hooks/useRealtime";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WirdProvider } from "@/hooks/useWird";
import Navigation from "@/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "فوج الشيخ إبراهيم مراد | منصة حفظ القرآن",
  description: "منصة تعليمية متخصصة في متابعة حفظ القرآن الكريم لطلاب الشيخ إبراهيم مراد",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-[#020617] text-white selection:bg-gold selection:text-black"
      >
        <ThemeProvider>
          <WirdProvider>
            <RealtimeProvider>
              <div className="md:flex min-h-screen">
                <Navigation />
                <main className="flex-1 pb-24 md:pb-0 min-h-screen min-w-0">
                  {children}
                </main>
              </div>
            </RealtimeProvider>
          </WirdProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
