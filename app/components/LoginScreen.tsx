"use client";

import Image from "next/image";
import { LoginForm } from "@/app/components/LoginForm";
import clarosLogo from "@/app/Claros-logo-Color-large-TM.png";
import worldCupTrophy from "@/app/wct-removebg-preview.png";

export function LoginScreen() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface-blue-50 px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-primary"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        <header className="mb-8">
          <div className="flex flex-col items-center gap-5">
            <div className="flex items-center justify-center gap-5 sm:gap-6">
              <Image
                src={clarosLogo}
                alt="Claros Analytics"
                width={200}
                height={52}
                className="h-11 w-auto object-contain sm:h-12"
                priority
              />

              <div
                className="h-10 w-px shrink-0 bg-secondary-border"
                aria-hidden="true"
              />

              <Image
                src={worldCupTrophy}
                alt="World Cup trophy"
                width={80}
                height={80}
                className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
                priority
              />
            </div>

            <div className="text-center">
              <p className="text-[15px] leading-relaxed text-primary-text">
                Are you ready for the World Cup, Team Claros?
              </p>
              <p className="mt-1 text-sm text-secondary-text">
                Let&apos;s see how good you are with predictions !!
              </p>
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-secondary-border bg-background shadow-accordion">
          <div className="border-b border-secondary-border bg-surface-blue-200/60 px-6 py-3">
            <p className="text-center text-xs font-medium tracking-wide text-secondary-500">
              Sign in to continue
            </p>
          </div>
          <div className="p-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
