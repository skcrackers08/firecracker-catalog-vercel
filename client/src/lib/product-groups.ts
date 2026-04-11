export interface ProductGroup {
  name: string;
  categories: string[];
  image: string;
  color: string;
}

export const PRODUCT_GROUPS: ProductGroup[] = [
  {
    name: "Sparklers",
    categories: ["Sparklers"],
    image: "https://images.unsplash.com/photo-1516040045611-4393d2aef1cd?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#FFD700",
  },
  {
    name: "Flower Pots",
    categories: ["Flower Pots"],
    image: "https://images.unsplash.com/photo-1603739903239-8b6e64c3b185?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#FF6B35",
  },
  {
    name: "Twinkling Star",
    categories: ["Twinkling Star"],
    image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#FFC0CB",
  },
  {
    name: "Chakkars",
    categories: ["Chakkars"],
    image: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#FF8C00",
  },
  {
    name: "Fancy Wheels",
    categories: ["Fancy Wheels"],
    image: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#32CD32",
  },
  {
    name: "Fancy Fountains",
    categories: ["Fancy Fountains", "Peacock Series", "Mini Fancy"],
    image: "https://images.unsplash.com/photo-1602075432246-7e1f55f1b0e4?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#1E90FF",
  },
  {
    name: "Colour Shots",
    categories: ["Fancy Colour Shots", "Sky Shots"],
    image: "https://images.unsplash.com/photo-1489481698775-6ba40ea0e948?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#9B59B6",
  },
  {
    name: "Sound Crackers",
    categories: ["One Sound Crackers", "Bomb Varieties", "Bijili Crackers"],
    image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#FF4444",
  },
  {
    name: "Rockets",
    categories: ["Rockets"],
    image: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#E74C3C",
  },
  {
    name: "Wala",
    categories: ["Wala"],
    image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#F39C12",
  },
  {
    name: "Kids Items",
    categories: ["Kids Item"],
    image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=400&h=400",
    color: "#2ECC71",
  },
];
