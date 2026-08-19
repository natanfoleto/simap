export const queryKeys = {
  vehicles: {
    all: ["vehicles"] as const,
    list: (filters: Record<string, unknown>) => ["vehicles", "list", filters] as const,
    detail: (id: string) => ["vehicles", "detail", id] as const,
  },
  preventivePlans: {
    all: ["preventivePlans"] as const,
    list: (category?: string) => ["preventivePlans", "list", category] as const,
    detail: (id: string) => ["preventivePlans", "detail", id] as const,
  },
  project: {
    settings: ["project", "settings"] as const,
    milestones: ["project", "milestones"] as const,
    summary: ["project", "summary"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (filters?: Record<string, unknown>) => ["users", "list", filters] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  audit: {
    all: ["audit"] as const,
    list: (filters: Record<string, unknown>) => ["audit", "list", filters] as const,
  },
  odometer: {
    all: ["odometer"] as const,
    list: (filters: Record<string, unknown>) => ["odometer", "list", filters] as const,
    byVehicle: (vehicleId: string) => ["odometer", "byVehicle", vehicleId] as const,
  },
  checklists: {
    all: ["checklists"] as const,
    templates: (category?: string) => ["checklists", "templates", category] as const,
    inspections: (filters: Record<string, unknown>) => ["checklists", "inspections", filters] as const,
    detail: (id: string) => ["checklists", "detail", id] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (filters: Record<string, unknown>) => ["orders", "list", filters] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
    byVehicle: (vehicleId: string) => ["orders", "byVehicle", vehicleId] as const,
  },
  pilot: {
    all: ["pilot"] as const,
    list: () => ["pilot", "list"] as const,
    detail: (id: string) => ["pilot", "detail", id] as const,
  },
  assignments: {
    byUser: (userId: string) => ["assignments", "byUser", userId] as const,
    byVehicle: (vehicleId: string) => ["assignments", "byVehicle", vehicleId] as const,
  },
};
