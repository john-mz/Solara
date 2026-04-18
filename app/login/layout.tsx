import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description:
    "Accede con el número de tu instalación o como administrador con Google",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ animation: "kenburns 22s ease-in-out infinite alternate" }}
        aria-hidden="true"
      >
        <Image
          src="/login-background.png"
          alt=""
          fill
          className="object-cover opacity-[0.10]"
          priority
          sizes="110vw"
        />
      </div>
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
