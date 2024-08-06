
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });


export const metadata = {
  title: "Pantry List",
  description: "Your pantry management app",
};




export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
