import type { Metadata } from "next";
import { Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import { RealtimeProvider } from "@/hooks/useRealtime";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WirdProvider } from "@/hooks/useWird";
import Navigation from "@/components/Navigation";
import "./globals.css";

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex",
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "فوج الشيخ إبراهيم مراد | منصة حفظ القرآن",
  description: "منصة تعليمية متخصصة في متابعة حفظ القرآن الكريم لطلاب الشيخ إبراهيم مراد",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${amiri.variable} ${ibmPlexArabic.variable} font-sans antialiased bg-[#020617] text-white selection:bg-gold selection:text-black`}
      >
        <ThemeProvider>
          <WirdProvider>
            <RealtimeProvider>
              <Navigation />
              {/* محتوى الصفحة بمسافة آمنة من الشريط الجانبي */}
              <main className="md:pr-24 pb-32 md:pb-0 min-h-screen">
                {children}
              </main>
            </RealtimeProvider>
          </WirdProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
