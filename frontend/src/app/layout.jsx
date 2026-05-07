import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TaskFlow — Team Task Manager",
  description: "Manage projects, assign tasks, and track progress with your team",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1e293b",
                color: "#f1f5f9",
                borderRadius: "10px",
                border: "1px solid #334155",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
