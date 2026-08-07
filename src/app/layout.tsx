import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { LanguageProvider } from "@/i18n/LanguageContext";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "Concours National de Logique",
    template: "%s · Concours National de Logique",
  },
  description:
    "Inscrivez-vous au Concours National de Logique, entraînez-vous toute l'année et passez le concours de sélection en ligne. Observez bien… la logique est partout !",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5fb" },
    { media: "(prefers-color-scheme: dark)", color: "#080b1e" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
