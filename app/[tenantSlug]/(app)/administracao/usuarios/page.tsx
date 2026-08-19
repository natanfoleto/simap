"use client";

import React, { useState } from "react";
import { useUsers, useCreateUser, useDeleteUser } from "@/hooks/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { formatUTCDate } from "@/lib/formatters";
import { Users, Plus, Shield, Trash2, Loader2, UserCheck, Mail } from "lucide-react";

export default function UsersAdminPage() {
  const { toast } = useToast();
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "OPERADOR",
  });

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();

    try {
      await createUser.mutateAsync(formData);
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: "OPERADOR" });
      toast({
        title: "Usuário cadastrado",
        description: `O usuário ${formData.name} foi criado com sucesso.`,
      });
    } catch (err: unknown) {
      toast({
        title: "Erro ao criar",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  async function handleInactivate(id: string, name: string) {
    if (!confirm(`Deseja realmente inativar o acesso de ${name}?`)) return;

    try {
      await deleteUser.mutateAsync(id);
      toast({
        title: "Usuário inativado",
        description: "O status do usuário foi alterado para inativo.",
      });
    } catch (err: unknown) {
      toast({
        title: "Erro",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  }

  const roleLabels: Record<string, { label: string; variant: "default" | "success" | "warning" | "neutral" | "destructive" }> = {
    ADMIN: { label: "Administrador", variant: "default" },
    GESTOR: { label: "Gestor", variant: "success" },
    OPERADOR: { label: "Operador", variant: "warning" },
    MOTORISTA: { label: "Motorista", variant: "neutral" },
    AUDITOR: { label: "Auditor", variant: "neutral" },
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Gestão de Usuários & Acessos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de contas, perfis operacionais e isolamento por organização
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="rounded-2xl gap-2 shadow-md shadow-primary/20">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/30 backdrop-blur-md shadow-sm">
        <CardHeader className="p-6 pb-4 border-b border-border/30">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Usuários Cadastrados
          </CardTitle>
          <CardDescription className="text-xs">
            Lista de operadores, gestores, motoristas e auditores autorizados
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Nenhum usuário cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail / Login</TableHead>
                  <TableHead>Cargo / Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u: {
                  id: string;
                  name: string;
                  email: string;
                  role: string;
                  active: boolean;
                  createdAt: string;
                }) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-bold text-foreground">{u.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleLabels[u.role]?.variant || "neutral"}>
                        {roleLabels[u.role]?.label || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.active ? "success" : "neutral"} className="text-[10px]">
                        {u.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatUTCDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleInactivate(u.id, u.name)}
                        className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                        title="Inativar acesso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação de Usuário */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Informe os dados para cadastrar um novo operador ou gestor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="userName">Nome Completo *</Label>
                <Input
                  id="userName"
                  placeholder="ex: João da Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="userEmail">E-mail *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  placeholder="ex: joao@simap.local"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="userPassword">Senha Inicial *</Label>
                <Input
                  id="userPassword"
                  type="password"
                  placeholder="Mínimo de 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Perfil de Acesso (Cargo) *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(val) => setFormData({ ...formData, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">ADMIN — Gestão total e permissões</SelectItem>
                    <SelectItem value="GESTOR">GESTOR — Frota, indicadores e relatórios</SelectItem>
                    <SelectItem value="OPERADOR">OPERADOR — Ordens e rotinas</SelectItem>
                    <SelectItem value="MOTORISTA">MOTORISTA — Checklists e hodômetro</SelectItem>
                    <SelectItem value="AUDITOR">AUDITOR — Leitura e relatórios imutáveis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={createUser.isPending} className="rounded-xl gap-2 shadow-sm">
                {createUser.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Cadastrar Usuário"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
