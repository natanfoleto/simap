import { useQuery } from "@tanstack/react-query";
import { TimelineEvent } from "@/app/api/vehicles/[id]/timeline/route";

interface TimelineResponse {
  vehicle: {
    id: string;
    fleetCode: string;
    plate: string;
    model: string;
    category: string;
    currentOdometer: number;
    status: string;
  };
  events: TimelineEvent[];
}

export function useVehicleTimeline(vehicleId: string) {
  return useQuery<TimelineResponse>({
    queryKey: ["vehicles", "timeline", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/${vehicleId}/timeline`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar timeline do veículo.");
      return json.data;
    },
    enabled: Boolean(vehicleId),
  });
}
