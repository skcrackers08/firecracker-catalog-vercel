export interface ProductGroup {
  name: string;
  category: string;
  image: string;
  color: string;
  emoji: string;
}

export const DEFAULT_GROUP_IMAGES: Record<string, string> = {
  "Sparklers": "https://images.unsplash.com/photo-1516040045611-4393d2aef1cd?auto=format&fit=crop&q=80&w=400&h=400",
  "Flower Pots": "https://images.unsplash.com/photo-1603739903239-8b6e64c3b185?auto=format&fit=crop&q=80&w=400&h=400",
  "Twinkling Star": "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&q=80&w=400&h=400",
  "Chakkars": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&q=80&w=400&h=400",
  "Fancy Wheels": "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&q=80&w=400&h=400",
  "Fancy Fountains": "https://images.unsplash.com/photo-1602075432246-7e1f55f1b0e4?auto=format&fit=crop&q=80&w=400&h=400",
  "Peacock Series": "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=400&h=400",
  "Mini Fancy": "https://images.unsplash.com/photo-1481023848149-166fb94b2853?auto=format&fit=crop&q=80&w=400&h=400",
  "Fancy Colour Shots": "https://images.unsplash.com/photo-1489481698775-6ba40ea0e948?auto=format&fit=crop&q=80&w=400&h=400",
  "Sky Shots": "https://images.unsplash.com/photo-1498843516560-6b66d5ed330a?auto=format&fit=crop&q=80&w=400&h=400",
  "One Sound Crackers": "https://images.unsplash.com/photo-1514304859873-1025ee74eb3a?auto=format&fit=crop&q=80&w=400&h=400",
  "Bomb Varieties": "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=400&h=400",
  "Rockets": "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&q=80&w=400&h=400",
  "Wala": "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=400&h=400",
  "Kids Item": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=400&h=400",
  "Bijili Crackers": "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&q=80&w=400&h=400",
};

export const PRODUCT_GROUPS: ProductGroup[] = [
  { name: "Sparklers", category: "Sparklers", image: DEFAULT_GROUP_IMAGES["Sparklers"], color: "#FFD700", emoji: "✨" },
  { name: "Flower Pots", category: "Flower Pots", image: DEFAULT_GROUP_IMAGES["Flower Pots"], color: "#FF6B35", emoji: "🌸" },
  { name: "Twinkling Star", category: "Twinkling Star", image: DEFAULT_GROUP_IMAGES["Twinkling Star"], color: "#FFC0CB", emoji: "⭐" },
  { name: "Chakkars", category: "Chakkars", image: DEFAULT_GROUP_IMAGES["Chakkars"], color: "#FF8C00", emoji: "🌀" },
  { name: "Fancy Wheels", category: "Fancy Wheels", image: DEFAULT_GROUP_IMAGES["Fancy Wheels"], color: "#32CD32", emoji: "🎡" },
  { name: "Fancy Fountains", category: "Fancy Fountains", image: DEFAULT_GROUP_IMAGES["Fancy Fountains"], color: "#1E90FF", emoji: "⛲" },
  { name: "Peacock Series", category: "Peacock Series", image: DEFAULT_GROUP_IMAGES["Peacock Series"], color: "#00CED1", emoji: "🦚" },
  { name: "Mini Fancy", category: "Mini Fancy", image: DEFAULT_GROUP_IMAGES["Mini Fancy"], color: "#DA70D6", emoji: "🎆" },
  { name: "Fancy Colour Shots", category: "Fancy Colour Shots", image: DEFAULT_GROUP_IMAGES["Fancy Colour Shots"], color: "#9B59B6", emoji: "🎇" },
  { name: "Sky Shots", category: "Sky Shots", image: DEFAULT_GROUP_IMAGES["Sky Shots"], color: "#3498DB", emoji: "🚀" },
  { name: "One Sound Crackers", category: "One Sound Crackers", image: DEFAULT_GROUP_IMAGES["One Sound Crackers"], color: "#E67E22", emoji: "💥" },
  { name: "Bomb Varieties", category: "Bomb Varieties", image: DEFAULT_GROUP_IMAGES["Bomb Varieties"], color: "#FF4444", emoji: "💣" },
  { name: "Rockets", category: "Rockets", image: DEFAULT_GROUP_IMAGES["Rockets"], color: "#E74C3C", emoji: "🎆" },
  { name: "Wala", category: "Wala", image: DEFAULT_GROUP_IMAGES["Wala"], color: "#F39C12", emoji: "🎉" },
  { name: "Kids Item", category: "Kids Item", image: DEFAULT_GROUP_IMAGES["Kids Item"], color: "#2ECC71", emoji: "🎈" },
  { name: "Bijili Crackers", category: "Bijili Crackers", image: DEFAULT_GROUP_IMAGES["Bijili Crackers"], color: "#C0392B", emoji: "⚡" },
];
