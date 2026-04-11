import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DEFAULT_GROUP_IMAGES } from "@/lib/product-groups";

const SETTING_KEY = "group-images";

export function useGroupImages() {
  const { data } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings/group-images"],
    staleTime: 60000,
  });

  let customImages: Record<string, string> = {};
  if (data?.value) {
    try {
      customImages = JSON.parse(data.value);
    } catch {}
  }

  function getGroupImage(groupName: string): string {
    return customImages[groupName] || DEFAULT_GROUP_IMAGES[groupName] || DEFAULT_GROUP_IMAGES["Sparklers"];
  }

  return { customImages, getGroupImage };
}

export function useSaveGroupImages() {
  return useMutation({
    mutationFn: async (images: Record<string, string>) => {
      const res = await apiRequest("POST", `/api/settings/${SETTING_KEY}`, {
        value: JSON.stringify(images),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/group-images"] });
    },
  });
}
