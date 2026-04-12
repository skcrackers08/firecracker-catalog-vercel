import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, insertProductSchema, updateProductSchema } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Video, Image as ImageIcon, IndianRupee, CheckCircle2, ShieldCheck, LogOut, Eye, EyeOff, Lock, ChevronDown, ChevronRight, Package, Tag, LayoutGrid, Save, Upload, X, Link as LinkIcon } from "lucide-react";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@shared/schema";
import { PRODUCT_GROUPS, DEFAULT_GROUP_IMAGES } from "@/lib/product-groups";
import { useSaveGroupImages } from "@/hooks/use-group-images";

function SectionPanel({
  icon,
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="mb-4 overflow-hidden">
      <button
        type="button"
        data-testid={`section-toggle-${title.toLowerCase().replace(/\s+/g, "-")}`}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-primary">{icon}</span>
          <span className="font-semibold text-base">{title}</span>
          {badge && (
            <span className="ml-1 text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border">
          <CardContent className="pt-5 pb-6">
            {children}
          </CardContent>
        </div>
      )}
    </Card>
  );
}

const DEFAULT_UPI = "9344468937@axl";
const CREDS_KEY = "sk-admin-creds";
const SESSION_KEY = "sk-admin-session";
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "admin123";

function getStoredCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) return JSON.parse(raw) as { username: string; password: string };
  } catch {}
  return { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const creds = getStoredCreds();
    if (username.trim() === creds.username && password === creds.password) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setError("");
      onLogin();
    } else {
      setError("Incorrect username or password.");
      toast({ title: "Login Failed", description: "Incorrect username or password.", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">SK Crackers – Admin Panel</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Username</label>
                <Input
                  data-testid="input-admin-username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Password</label>
                <div className="relative">
                  <Input
                    data-testid="input-admin-password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-sm text-destructive" data-testid="text-login-error">{error}</p>
              )}
              <Button type="submit" className="w-full" data-testid="button-login">
                Login
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Default: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PaymentSettings() {
  const { toast } = useToast();
  const [upiId, setUpiId] = useState(() => localStorage.getItem("sk-merchant-upi") || DEFAULT_UPI);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const trimmed = upiId.trim();
    if (!trimmed) return;
    localStorage.setItem("sk-merchant-upi", trimmed);
    setSaved(true);
    toast({ title: "Saved", description: `UPI ID updated to ${trimmed}` });
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
      <div className="flex-1">
        <label className="text-sm font-medium mb-1 block text-muted-foreground">
          Company UPI ID
        </label>
        <Input
          data-testid="input-upi-id"
          value={upiId}
          onChange={(e) => { setUpiId(e.target.value); setSaved(false); }}
          placeholder="e.g. yourname@upi"
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Pre-filled when customers pay via PhonePe, GPay or Paytm.
        </p>
      </div>
      <Button
        data-testid="button-save-upi"
        onClick={handleSave}
        className="flex items-center gap-2"
      >
        {saved ? <CheckCircle2 className="h-4 w-4" /> : null}
        {saved ? "Saved!" : "Save UPI ID"}
      </Button>
    </div>
  );
}

const changeCredsSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function SecuritySettings() {
  const { toast } = useToast();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm({
    resolver: zodResolver(changeCredsSchema),
    defaultValues: { username: getStoredCreds().username, currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  function onSubmit(data: z.infer<typeof changeCredsSchema>) {
    const creds = getStoredCreds();
    if (data.currentPassword !== creds.password) {
      form.setError("currentPassword", { message: "Current password is incorrect" });
      return;
    }
    localStorage.setItem(CREDS_KEY, JSON.stringify({ username: data.username, password: data.newPassword }));
    toast({ title: "Credentials Updated", description: "Your admin username and password have been changed." });
    form.reset({ username: data.username, currentPassword: "", newPassword: "", confirmPassword: "" });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Username</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-new-username" placeholder="New username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} type={showCurrent ? "text" : "password"} data-testid="input-current-password" placeholder="Enter current password" className="pr-10" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrent(!showCurrent)}>
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} type={showNew ? "text" : "password"} data-testid="input-new-password" placeholder="Min. 6 characters" className="pr-10" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNew(!showNew)}>
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} type={showConfirm ? "text" : "password"} data-testid="input-confirm-password" placeholder="Re-enter new password" className="pr-10" />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" data-testid="button-save-credentials">
              Update Credentials
            </Button>
          </form>
    </Form>
  );
}

async function resizeImageToDataUrl(file: File, maxSize = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function GroupImagesSection() {
  const { toast } = useToast();
  const saveGroupImages = useSaveGroupImages();
  const [images, setImages] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("sk-group-images-draft");
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return {};
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: settingData } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings/group-images"],
  });

  const serverImages: Record<string, string> = (() => {
    if (!settingData?.value) return {};
    try { return JSON.parse(settingData.value); } catch { return {}; }
  })();

  function getImage(groupName: string): string {
    return images[groupName] ?? serverImages[groupName] ?? DEFAULT_GROUP_IMAGES[groupName] ?? "";
  }

  function setImage(groupName: string, url: string) {
    setImages(prev => {
      const next = { ...prev, [groupName]: url };
      localStorage.setItem("sk-group-images-draft", JSON.stringify(next));
      return next;
    });
  }

  function clearImage(groupName: string) {
    setImages(prev => {
      const next = { ...prev, [groupName]: "" };
      localStorage.setItem("sk-group-images-draft", JSON.stringify(next));
      return next;
    });
  }

  async function handleFileChange(groupName: string, file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 10MB.", variant: "destructive" });
      return;
    }
    setUploading(groupName);
    try {
      const dataUrl = await resizeImageToDataUrl(file, 400, 0.85);
      setImage(groupName, dataUrl);
      toast({ title: "Image ready", description: `${groupName} image loaded. Click Save to apply.` });
    } catch {
      toast({ title: "Upload failed", description: "Could not process image.", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    const merged = { ...serverImages, ...images };
    await saveGroupImages.mutateAsync(merged);
    localStorage.removeItem("sk-group-images-draft");
    toast({ title: "Group Images Saved", description: "All group icons updated successfully." });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Upload a gallery image or paste a URL for each product category group.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRODUCT_GROUPS.map((group) => {
          const imgSrc = getImage(group.name);
          const hasCustom = !!(images[group.name] || serverImages[group.name]);
          const showUrl = urlMode[group.name] ?? false;
          const isUploading = uploading === group.name;
          const testId = group.name.toLowerCase().replace(/\s+/g, "-");

          return (
            <div key={group.name} className="flex flex-col gap-2 bg-muted/30 rounded-xl p-3 border border-border">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black/40 group/img">
                  <img
                    src={imgSrc || DEFAULT_GROUP_IMAGES[group.name]}
                    alt={group.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_GROUP_IMAGES[group.name]; }}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold mb-2 text-foreground">{group.name}</p>
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={(el) => { fileInputRefs.current[group.name] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid={`file-input-group-${testId}`}
                      onChange={(e) => handleFileChange(group.name, e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      data-testid={`button-upload-${testId}`}
                      onClick={() => fileInputRefs.current[group.name]?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" />
                      {isUploading ? "Processing…" : "Upload"}
                    </button>
                    <button
                      type="button"
                      data-testid={`button-url-toggle-${testId}`}
                      onClick={() => setUrlMode(m => ({ ...m, [group.name]: !showUrl }))}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground text-xs font-medium transition-colors"
                    >
                      <LinkIcon className="w-3 h-3" />
                      URL
                    </button>
                    {hasCustom && (
                      <button
                        type="button"
                        data-testid={`button-clear-${testId}`}
                        onClick={() => clearImage(group.name)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-colors"
                        title="Reset to default"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {showUrl && (
                <Input
                  value={images[group.name] ?? serverImages[group.name] ?? ""}
                  onChange={(e) => setImage(group.name, e.target.value)}
                  placeholder="Paste image URL (https://...)"
                  className="h-8 text-xs"
                  data-testid={`input-group-image-${testId}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <Button
        onClick={handleSave}
        disabled={saveGroupImages.isPending}
        data-testid="button-save-group-images"
        className="flex items-center gap-2"
      >
        <Save className="h-4 w-4" />
        {saveGroupImages.isPending ? "Saving…" : "Save All Group Images"}
      </Button>
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: [api.products.list.path],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.products.create.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "Success", description: "Product created successfully" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", buildUrl(api.products.update.path, { id }), data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "Success", description: "Product updated successfully" });
      setEditingProduct(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", buildUrl(api.products.delete.path, { id }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      toast({ title: "Success", description: "Product deleted successfully" });
    },
  });

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          data-testid="button-logout"
          className="flex items-center gap-2 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <SectionPanel icon={<IndianRupee className="h-5 w-5" />} title="Payment Settings">
        <PaymentSettings />
      </SectionPanel>

      <SectionPanel icon={<ShieldCheck className="h-5 w-5" />} title="Security Settings">
        <SecuritySettings />
      </SectionPanel>

      <SectionPanel icon={<LayoutGrid className="h-5 w-5" />} title="Group Icons & Images" badge="16">
        <GroupImagesSection />
      </SectionPanel>

      <SectionPanel
        icon={<Package className="h-5 w-5" />}
        title="Products"
        badge={products ? String(products.length) : undefined}
        defaultOpen
      >
        <div className="flex justify-end mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button data-testid="button-add-product">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm
                onSubmit={(data) => createMutation.mutate(data)}
                isPending={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <Card key={product.id} data-testid={`card-product-${product.id}`}>
            <CardHeader>
              <div className="aspect-video relative rounded-md overflow-hidden bg-muted mb-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardTitle className="flex justify-between items-start">
                <span>{product.name}</span>
                <span className="text-primary">₹{product.price}</span>
              </CardTitle>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{product.category || "Sparklers"}</span>
                {product.subgroup && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">{product.subgroup}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {product.description}
              </p>
              <div className="flex gap-2">
                <Dialog
                  open={editingProduct?.id === product.id}
                  onOpenChange={(open) => !open && setEditingProduct(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProduct(product)}
                      data-testid={`button-edit-${product.id}`}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Product</DialogTitle>
                    </DialogHeader>
                    <ProductForm
                      defaultValues={product}
                      onSubmit={(data) =>
                        updateMutation.mutate({ id: product.id, data })
                      }
                      isPending={updateMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure?")) deleteMutation.mutate(product.id);
                  }}
                  data-testid={`button-delete-${product.id}`}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      </SectionPanel>
    </div>
  );
}

function ProductForm({
  defaultValues,
  onSubmit,
  isPending,
}: {
  defaultValues?: any;
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(defaultValues ? updateProductSchema : insertProductSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      videoUrl: "",
      category: "Sparklers",
      subgroup: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} data-testid="input-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} data-testid="input-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subgroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subgroup / Type</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} data-testid="input-subgroup" placeholder="e.g. Electric, Red, Deluxe" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (₹)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} data-testid="input-price" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input {...field} data-testid="input-image-url" placeholder="Paste image URL here" />
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64String = reader.result as string;
                          if (file.type.startsWith('image/') && base64String.length > 1024 * 1024) {
                            const img = new Image();
                            img.src = base64String;
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const ctx = canvas.getContext('2d');
                              const maxWidth = 1200;
                              const scale = Math.min(1, maxWidth / img.width);
                              canvas.width = img.width * scale;
                              canvas.height = img.height * scale;
                              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                              field.onChange(canvas.toDataURL('image/jpeg', 0.7));
                            };
                          } else {
                            field.onChange(base64String);
                          }
                        };
                        reader.onerror = (error) => {
                          console.error("FileReader error:", error);
                          toast({ title: "Error", description: "Failed to read file", variant: "destructive" });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="videoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video URL (Optional)</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input {...field} data-testid="input-video-url" placeholder="Paste YouTube URL here" />
                  <Input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    id="video-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const base64String = reader.result as string;
                          if (file.type.startsWith('image/') && base64String.length > 1024 * 1024) {
                            const img = new Image();
                            img.src = base64String;
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const ctx = canvas.getContext('2d');
                              const maxWidth = 1200;
                              const scale = Math.min(1, maxWidth / img.width);
                              canvas.width = img.width * scale;
                              canvas.height = img.height * scale;
                              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                              field.onChange(canvas.toDataURL('image/jpeg', 0.7));
                            };
                          } else {
                            field.onChange(base64String);
                          }
                        };
                        reader.onerror = (error) => {
                          console.error("FileReader error:", error);
                          toast({ title: "Error", description: "Failed to read file", variant: "destructive" });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => document.getElementById('video-upload')?.click()}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit">
          {isPending ? "Saving..." : "Save Product"}
        </Button>
      </form>
    </Form>
  );
}
