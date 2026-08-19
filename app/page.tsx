import { redirect } from "next/navigation";

export default function RootPage() {
  // Redireciona o acesso da raiz para o tenant inicial de Jaborandi/SP
  redirect("/jaborandi-sp/dashboard");
}
