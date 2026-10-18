import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "گروه ساختمانی نیکا بنا | ساخت، اجرا و سرمایه‌گذاری",
  description:
    "گروه ساختمانی نیکا بنا — طراحی، ساخت و اجرای پروژه‌های معماری لوکس در مشهد؛ مشاوره سرمایه‌گذاری املاک، فروش ویلا و آپارتمان، همکاری با تامین‌کنندگان و پیمانکاران، و پایش شفاف پروژه‌ها.",
  keywords: ["ساختمان", "معماری", "پیمانکاری", "سرمایه‌گذاری", "مشهد", "نیکا بنا"],
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a1424",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('nikabana-theme')||localStorage.getItem('mojarrad-theme')||'navy';if(t!=='dark'&&t!=='light'&&t!=='pastel'&&t!=='navy')t='navy';document.documentElement.classList.add('theme-'+t);}catch(e){document.documentElement.classList.add('theme-navy');}`,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
