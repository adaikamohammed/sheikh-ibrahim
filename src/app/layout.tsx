import type { Metadata } from "next";
import { Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
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
    <html lang="ar" dir="rtl">
      <body
        className={`${amiri.variable} ${ibmPlexArabic.variable} font-sans antialiased bg-[#020617] text-white selection:bg-gold selection:text-black`}
      >
        <RealtimeProvider>
          {children}
        </RealtimeProvider>
      </body>
    </html>
  );
}
