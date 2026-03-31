import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { getSessionUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Đông Quân GearHub",
  description: "Máy tính - Laptop - Điện thoại",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <html lang="vi">
      <body>
        <Providers initialUser={user}>{children}</Providers>
      </body>
    </html>
  );
}
