import { Inter } from "next/font/google";
import "./globals.css";




const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pantry List",
  description: "Your pantry management app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
    <head>
      {/* Add your custom font links here */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" />

    </head>
    <body className={inter.className}>
      {children}
    </body>
  </html>
  );
}
