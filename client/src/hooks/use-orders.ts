import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateOrderInput, type OrderResponse } from "@shared/routes";

function parseWithLogging<T>(schema: any, data: unknown, label: string): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    console.error(`[Zod] ${label} validation failed:`, error);
    return data as T;
  }
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create order");
      }
      
      const responseData = await res.json();
      return parseWithLogging<OrderResponse>(api.orders.create.responses[201], responseData, "orders.create");
    },
    // Optional: invalidate queries if there were order lists
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: [api.orders.get.path, id],
    queryFn: async () => {
      if (isNaN(id) || id <= 0) return null;
      const url = buildUrl(api.orders.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch order");
      const data = await res.json();
      return parseWithLogging<OrderResponse>(api.orders.get.responses[200], data, "orders.get");
    },
    enabled: !!id && !isNaN(id),
  });
}
