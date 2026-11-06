import { Inter, Poppins, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ weight: ["400", "500", "600", "700", "800"], subsets: ["latin"], variable: "--font-poppins" });
const arabic = Noto_Naskh_Arabic({ weight: ["400", "600", "700"], subsets: ["arabic"], variable: "--font-arabic" });
export const metadata = { title: "QCM — Réviser avec clarté", description: "Une plateforme calme et accessible pour progresser dans vos QCM.", manifest: "/manifest.json", icons: { icon: "/icon.png", apple: "/icon.png" } };
export const viewport = { themeColor: "#4f63d8", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }) { return <html lang="fr" suppressHydrationWarning><body className={`${inter.variable} ${poppins.variable} ${arabic.variable}`}><ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>{children}</ThemeProvider></body></html>; }
