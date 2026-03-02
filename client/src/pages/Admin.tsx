import { useState } from "react";
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
import { Plus, Pencil, Trash2, Video, Image as ImageIcon, IndianRupee, CheckCircle2, ShieldCheck, LogOut, Eye, EyeOff, Lock } from "lucide-react";
import { z } from "zod";

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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <IndianRupee className="h-5 w-5 text-primary" />
          Payment Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Security Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
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

      <PaymentSettings />
      <SecuritySettings />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Products</h2>
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
