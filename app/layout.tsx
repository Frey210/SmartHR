import type { Metadata, Viewport } from "next";
import { Poppins, Roboto } from "next/font/google";
import { AppSplash } from "@/app/_components/app-splash";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const heading = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const body = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MTC Attendance",
  description: "Pencatatan kehadiran dan dokumentasi kerja PT Media Teknologi Celebes",
  applicationName: "MTC Attendance",
  icons: { icon: "/mtc-logo.jpg", apple: "/mtc-logo.jpg" },
  appleWebApp: { capable: true, title: "MTC Attendance", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#198AFF" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${heading.variable} ${body.variable} font-[family-name:var(--font-body)] antialiased`}>
        <AppSplash />
        {children}
      </body>
    </html>
  );
}
