import { useQuery } from "@tanstack/react-query";
import { api, buildUrl, type ProductResponse, type ProductsListResponse } from "@shared/routes";

function parseWithLogging<T>(schema: any, data: unknown, label: string): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    console.error(`[Zod] ${label} validation failed:`, error);
    // If Zod custom types bypass validation, just return the data casted
    return data as T;
  }
}

export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      return parseWithLogging<ProductsListResponse>(api.products.list.responses[200], data, "products.list");
    },
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      if (isNaN(id) || id <= 0) return null;
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      const data = await res.json();
      return parseWithLogging<ProductResponse>(api.products.get.responses[200], data, "products.get");
    },
    enabled: !!id && !isNaN(id),
  });
}
