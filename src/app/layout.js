import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata = {
  title: "Voice AI - پردازش سیگنال و بهینه‌سازی تکاملی",
  description: "بازسازی سیگنال صوتی با الگوریتم‌های فراابتکاری",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={`${vazir.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-vazir">{children}</body>
    </html>
  );
}
