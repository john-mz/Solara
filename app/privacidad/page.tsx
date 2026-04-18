import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/solara-logo-2.webp"
              alt="Solara"
              width={40}
              height={40}
              className="size-10 rounded-lg object-contain drop-shadow-sm"
              priority
            />
            <div className="flex flex-col">
              <span className={cn("font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight text-foreground leading-none")}>
                Solara
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                by Techos Rentables
              </span>
            </div>
          </div>
          <Link href="/login" className="text-primary hover:text-primary/80 text-sm font-medium flex items-center transition-colors">
            &larr; Volver al inicio
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Política de Privacidad</h1>

        <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-5 mb-10 rounded-r-lg">
          <h3 className="text-lg text-yellow-700 dark:text-yellow-500 font-bold mb-2">
            ⚠️ Aviso Importante: Prototipo de Hackathon
          </h3>
          <p className="text-sm text-yellow-700/90 dark:text-yellow-500/90 leading-relaxed">
            Esta plataforma ha sido desarrollada exclusivamente como un <strong>prototipo para una hackathon (Tinku)</strong> por el equipo <em>"Ojalá hubiera pasado a la UTP"</em>. <strong>No es un producto final en producción</strong>. Las políticas descritas a continuación son de carácter demostrativo hasta que el cliente final asuma la implementación, revisión legal y despliegue oficial del sistema.
          </p>
        </div>

        <div className="space-y-10 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Información que recopilamos</h2>
            <p>
              Durante esta fase de prueba, podemos recopilar información básica de registro, como direcciones de correo electrónico, nombres y datos simulados de propiedades o inversiones. Toda esta información se recopila únicamente con el propósito de demostrar la funcionalidad de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Uso de la información</h2>
            <p>
              Los datos ingresados en este prototipo se utilizan exclusivamente para:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2">
              <li>Permitir el acceso y la navegación en la plataforma de prueba.</li>
              <li>Demostrar los flujos de inversión y gestión de la plataforma.</li>
              <li>Validar la viabilidad técnica del proyecto durante la hackathon.</li>
            </ul>
            <div className="mt-6 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-destructive font-medium text-sm">
                Recomendación de seguridad: Por favor, NO utilice contraseñas reales, datos personales sensibles, ni información financiera real durante el uso de este prototipo.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Almacenamiento y Seguridad</h2>
            <p>
              Aunque utilizamos servicios en la nube para el alojamiento y la base de datos de esta demostración, al ser un entorno de prueba, no garantizamos la persistencia, respaldo o seguridad absoluta de los datos ingresados. La base de datos podría ser reiniciada o borrada en cualquier momento sin previo aviso como parte de las pruebas de desarrollo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Cookies y Tecnologías Similares</h2>
            <p>
              El prototipo puede utilizar cookies técnicas estrictamente necesarias para mantener la sesión del usuario activa (por ejemplo, tokens de autenticación). No utilizamos cookies de rastreo, analíticas avanzadas o de marketing en esta fase de hackathon.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Transición al Cliente Final</h2>
            <p>
              Una vez que el proyecto sea entregado e implementado por el cliente final, esta política de privacidad deberá ser reemplazada por un documento oficial y legalmente vinculante. Dicho documento deberá ser redactado por profesionales legales para cumplir con las normativas de protección de datos aplicables en el país de operación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Contacto</h2>
            <p>
              Para cualquier consulta sobre este prototipo desarrollado durante la hackathon, puede contactar al equipo de desarrollo <strong>"Ojalá hubiera pasado a la UTP"</strong>.
            </p>
          </section>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border text-sm text-muted-foreground text-center">
          Última actualización: {new Date().toLocaleDateString('es-ES')} - Versión Hackathon
        </div>
      </div>
    </div>
  );
}
