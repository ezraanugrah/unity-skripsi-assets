import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storyboard Studio — Unity Skripsi",
  description: "Galeri storyboard dan pelacak progres implementasi proyek Unity skripsi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
