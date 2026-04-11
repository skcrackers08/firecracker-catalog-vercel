export interface ProductGroup {
  name: string;
  categories: string[];
  image: string;
  color: string;
}

export const PRODUCT_GROUPS: ProductGroup[] = [
  {
    name: "Flower Pots",
    categories: ["Flower Pots"],
    image: "https://images.unsplash.com/photo-1603739903239-8b6e64c3b185?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#FF6B35",
  },
  {
    name: "Rockets",
    categories: ["Rockets", "Aerial Shots"],
    image: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#1E90FF",
  },
  {
    name: "Sparklers",
    categories: ["Sparklers", "Twinkling Stars"],
    image: "https://images.unsplash.com/photo-1516040045611-4393d2aef1cd?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#FFD700",
  },
  {
    name: "Bombs",
    categories: ["Sound Crackers", "Bijili Crackers", "Ground Crackers"],
    image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#FF4444",
  },
  {
    name: "Wheels",
    categories: ["Wala", "Fancy Fountains"],
    image: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#FF8C00",
  },
  {
    name: "Kids",
    categories: ["Kids Items"],
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#32CD32",
  },
  {
    name: "Gift Boxes",
    categories: ["Gift Box"],
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#9B59B6",
  },
];
