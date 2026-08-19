"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Wrench, Shield, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage({ params }: { params: { tenantSlug: string } }) {
  const router = useRouter();
  const [email, setEmail] = useState("admin@simap.local");
  const [password, setPassword] = useState("admin_jaborandi_2025");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tenantName =
    params.tenantSlug === "jaborandi-sp"
      ? "Município de Jaborandi/SP"
      : `Organização ${params.tenantSlug}`;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
        tenantSlug: params.tenantSlug,
      });

      if (res?.error) {
        setError("Credenciais inválidas ou usuário sem permissão de acesso.");
        setLoading(false);
        return;
      }

      router.push(`/${params.tenantSlug}/dashboard`);
      router.refresh();
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Falha ao comunicar com o servidor. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/40 overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/15 blur-[140px] pointer-events-none" />

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/25 mb-2 animate-in zoom-in-90 duration-300">
            <Wrench className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">SIMAP</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Sistema Municipal de Manutenção Preventiva
          </p>
        </div>

        {/* Login Card */}
        <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/5">
          <CardHeader className="border-b border-border/30 p-6 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground/90">
                Acesso Seguro
              </CardTitle>
              <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {tenantName}
              </span>
            </div>
            <CardDescription>
              Informe suas credenciais para entrar no sistema
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2.5 animate-in fade-in-50">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  E-mail institucional
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@simap.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Senha de acesso
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-11"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar no SIMAP"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border/30 text-center">
              <p className="text-xs text-muted-foreground">
                Programa Pro Inova • Linha Temática: Transporte Público
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
