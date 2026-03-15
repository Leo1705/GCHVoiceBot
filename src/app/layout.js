import "./globals.css";
import { DM_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata = {
  title: "Greater Change Therapy — Voice Wellbeing",
  description: "On-demand voice wellbeing. Calm, supportive conversations anytime.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-sans antialiased text-gray-800">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
