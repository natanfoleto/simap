import { NextRequest, NextResponse } from "next/server";
import { getSessionWithPermissions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { unauthorizedResponse, forbiddenResponse, internalErrorResponse } from "@/lib/api-helpers";
import Papa from "papaparse";
import { Prisma, VehicleCategory, VehicleStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionWithPermissions();
    if (!session?.user) return unauthorizedResponse();

    if (!hasPermission(session.user.role, "veiculos", "ver", session.user.permissions)) {
      return forbiddenResponse();
    }

    const tenantId = session.user.tenantId;
    if (!tenantId && session.user.role !== "ADMIN") {
      return forbiddenResponse("Tenant obrigatório.");
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category") as VehicleCategory | undefined;
    const status = searchParams.get("status") as VehicleStatus | undefined;
    const active = searchParams.get("active") === "false" ? false : true;

    const where: Prisma.VehicleWhereInput = {
      ...(tenantId ? { tenantId } : {}),
      active,
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { plate: { contains: search.toUpperCase() } },
              { fleetCode: { contains: search.toUpperCase() } },
              { model: { contains: search, mode: "insensitive" } },
              { brand: { contains: search, mode: "insensitive" } },
              { department: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: [{ fleetCode: "asc" }],
    });

    const exportRows = vehicles.map((v) => ({
      codigo_frota: v.fleetCode,
      placa: v.plate,
      categoria: v.category,
      marca: v.brand,
      modelo: v.model,
      ano: v.year,
      combustivel: v.fuelType,
      finalidade: v.purpose,
      setor: v.department || "",
      criticidade: v.criticality,
      status: v.status,
      quilometragem_atual: v.currentOdometer,
      piloto: v.isPilot ? "SIM" : "NAO",
      ativo: v.active ? "SIM" : "NAO",
      observacoes: v.notes || "",
    }));

    const csvString = Papa.unparse(exportRows);

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="frota_simap_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/vehicles/export error:", error);
    return internalErrorResponse();
  }
}
