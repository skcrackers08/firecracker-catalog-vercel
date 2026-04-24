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
import { Plus, Pencil, Trash2, Video, Image as ImageIcon, IndianRupee, CheckCircle2, ShieldCheck, LogOut, Eye, EyeOff, Lock, ChevronDown, ChevronRight, Package, Tag, LayoutGrid, Save, Upload, X, Link as LinkIcon, Mail, KeyRound, CheckCircle, MessageSquare, Send, Sparkles, Megaphone, Bell } from "lucide-react";
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

function OpenAIKeySection() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<{ value: string | null; configured?: boolean; masked?: string }>({
    queryKey: ["/api/settings/openai-api-key"],
  });
  const [value, setValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>("");

  const isConfigured = !!data?.configured;
  const masked = data?.masked || "";

  const save = useMutation({
    mutationFn: async (newVal: string) => {
      await apiRequest("POST", "/api/settings/openai-api-key", { value: newVal });
    },
    onSuccess: (_d, newVal) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/openai-api-key"] });
      setValue("");
      setTestResult("");
      toast({
        title: newVal ? "API Key Saved" : "API Key Removed",
        description: newVal ? "AI Help chat is now active for all customers." : "AI Help chat key has been cleared.",
      });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e?.message || "Could not save", variant: "destructive" });
    },
  });

  async function runTest() {
    setTesting(true);
    setTestResult("");
    try {
      const res = await apiRequest("POST", "/api/chat", { message: "Hello, what can you help me with?" });
      const data = (await res.json()) as { reply?: string };
      setTestResult(data.reply || "No reply");
    } catch (e: any) {
      setTestResult(`Test failed: ${e?.message || "unknown error"}`);
    } finally {
      setTesting(false);
    }
  }

  function clearKey() {
    if (!window.confirm("Remove the saved OpenAI API key? AI chat will stop working for customers.")) return;
    save.mutate("");
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Powers the floating <strong>AI Help</strong> chat icon (purple sparkle) on the right side of every page.
        Customers can ask product or order questions; the assistant always directs them to WhatsApp for confirmation.
      </p>

      {isLoading ? (
        <div className="h-10 bg-muted/40 rounded-lg animate-pulse" />
      ) : isConfigured ? (
        <div className="flex flex-col gap-1 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm text-green-400 font-medium">OpenAI key active — AI Help chat is live.</span>
          </div>
          {masked && (
            <p className="text-xs text-green-300/80 font-mono pl-6" data-testid="text-openai-key-masked">
              Saved key: {masked}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
          <KeyRound className="w-4 h-4 text-yellow-500 shrink-0" />
          <span className="text-sm text-yellow-400">No API key set — AI chat will reply with a fallback WhatsApp message.</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <KeyRound className="w-3 h-3" />
          {isConfigured ? "Replace OpenAI API Key" : "OpenAI API Key"} <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Input
            type={showKey ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isConfigured ? "Paste a new key to replace the saved one…" : "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
            className="pr-10 font-mono text-sm"
            data-testid="input-openai-api-key"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            data-testid="button-toggle-show-openai-key"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Stored in your database. Only a masked preview is ever returned for security.
          Overrides the server <span className="font-mono">OPENAI_API_KEY</span> environment variable.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => save.mutate(value.trim())}
          disabled={save.isPending || !value.trim()}
          data-testid="button-save-openai-key"
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {save.isPending ? "Saving…" : isConfigured ? "Update API Key" : "Save API Key"}
        </Button>
        <Button
          variant="outline"
          onClick={runTest}
          disabled={testing || !isConfigured}
          data-testid="button-test-openai-key"
          className="flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {testing ? "Testing…" : "Test Connection"}
        </Button>
        {isConfigured && (
          <Button
            variant="outline"
            onClick={clearKey}
            disabled={save.isPending}
            data-testid="button-clear-openai-key"
            className="flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
            Remove Key
          </Button>
        )}
      </div>

      {testResult && (
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Test Reply:</p>
          <p className="text-sm text-foreground whitespace-pre-wrap" data-testid="text-openai-test-result">{testResult}</p>
        </div>
      )}

      <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" /> How to get your OpenAI API Key
        </p>
        <ol className="text-xs text-muted-foreground space-y-1 list-none">
          <li>1. Sign in at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary underline">platform.openai.com/api-keys</a></li>
          <li>2. Click <strong>Create new secret key</strong></li>
          <li>3. Copy the key (starts with <span className="font-mono">sk-proj-</span> or <span className="font-mono">sk-</span>)</li>
          <li>4. Paste it above and click <strong>Save API Key</strong></li>
          <li>5. Click <strong>Test Connection</strong> to confirm the AI is responding</li>
        </ol>
      </div>
    </div>
  );
}

function WhatsAppSettings() {
  const { toast } = useToast();
  const { data: setting } = useQuery<{ value: string } | null>({
    queryKey: ["/api/settings/whatsapp-number"],
  });
  const [number, setNumber] = useState("");
  const [saved, setSaved] = useState(false);
  const currentValue = setting?.value || "919344468937";

  const displayValue = number || currentValue;

  const save = useMutation({
    mutationFn: async (value: string) => {
      return apiRequest("POST", "/api/settings/whatsapp-number", { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/whatsapp-number"] });
      setSaved(true);
      toast({ title: "WhatsApp number saved", description: `Customers will now reach ${displayValue}` });
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err?.message || "Could not save", variant: "destructive" });
    },
  });

  function handleSave() {
    const cleaned = displayValue.replace(/\D/g, "");
    if (cleaned.length < 10) {
      toast({ title: "Invalid number", description: "Enter a valid WhatsApp number with country code (e.g. 919344468937)", variant: "destructive" });
      return;
    }
    save.mutate(cleaned);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium mb-1 block text-muted-foreground">
            WhatsApp Business Number (with country code)
          </label>
          <Input
            data-testid="input-whatsapp-number"
            value={displayValue}
            onChange={(e) => { setNumber(e.target.value); setSaved(false); }}
            placeholder="e.g. 919344468937"
            className="max-w-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Used for the floating WhatsApp button, the "Send Enquiry on WhatsApp" checkout button, and customer enquiries.
          </p>
        </div>
        <Button
          data-testid="button-save-whatsapp"
          onClick={handleSave}
          disabled={save.isPending}
          className="flex items-center gap-2"
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : null}
          {save.isPending ? "Saving..." : saved ? "Saved!" : "Save WhatsApp Number"}
        </Button>
      </div>
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200/90 leading-relaxed">
        <p className="font-semibold mb-1">⚠️ Payment & Order Confirmation Flow</p>
        <p>
          Online payments are <strong>disabled</strong> as per government rules. All orders are confirmed manually
          on WhatsApp. Set up an auto-reply on your WhatsApp Business app to share UPI / bank details, then send
          invoice and transport details within 24–48 hours after the customer shares the payment screenshot.
        </p>
      </div>
    </div>
  );
}

function BroadcastNotificationSection() {
  const { toast } = useToast();
  const [type, setType] = useState<"broadcast" | "offer">("broadcast");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);

  // Server-side staff session is required (admin-pro). Check + allow inline login.
  const { data: staffMe, refetch: refetchStaff, isLoading: loadingStaff } = useQuery<{ id: number; username: string; role: string } | { message: string }>({
    queryKey: ["/api/admin-pro/me"],
    retry: false,
  });
  const staffOk = staffMe && "id" in staffMe;
  const allowedRole = staffOk && ["superadmin", "manager"].includes((staffMe as any).role);

  const [staffUser, setStaffUser] = useState("superadmin");
  const [staffPass, setStaffPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const handleStaffLogin = async () => {
    setLoggingIn(true);
    try {
      await apiRequest("POST", "/api/admin-pro/login", { username: staffUser.trim(), password: staffPass });
      toast({ title: "Staff session started", description: "You can now broadcast notifications." });
      setStaffPass("");
      await refetchStaff();
    } catch (err: any) {
      toast({ title: "Login failed", description: err?.message || "Wrong username or password", variant: "destructive" });
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }
    if (!confirm(`Send this notification to ALL customers? It cannot be undone.`)) return;
    setSending(true);
    try {
      const res = await apiRequest("POST", "/api/admin-pro/notifications/broadcast", {
        type,
        title: title.trim(),
        message: message.trim(),
        link: link.trim() || null,
      });
      const json = await res.json();
      const n = json.count ?? json.sent ?? 0;
      toast({ title: "Sent!", description: `Notification delivered to ${n} customer${n === 1 ? "" : "s"}.` });
      setTitle("");
      setMessage("");
      setLink("");
    } catch (err: any) {
      const msg = err?.message || "Could not broadcast";
      if (msg.toLowerCase().includes("not authenticated") || msg.toLowerCase().includes("session invalid")) {
        await refetchStaff();
        toast({ title: "Session expired", description: "Please login again with staff credentials.", variant: "destructive" });
      } else {
        toast({ title: "Failed to send", description: msg, variant: "destructive" });
      }
    } finally {
      setSending(false);
    }
  };

  if (loadingStaff) {
    return <div className="h-24 bg-white/5 rounded-xl animate-pulse" />;
  }

  if (!staffOk || !allowedRole) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <p className="font-bold text-amber-300 mb-1 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Staff Login Required
          </p>
          <p className="text-xs text-amber-100/80">
            Broadcast notifications go to every customer, so it requires a separate staff (superadmin or manager) login on top of this admin panel.
            {staffOk && !allowedRole && ` Your current role "${(staffMe as any).role}" is not allowed to broadcast.`}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Default seeded staff: <code>superadmin</code> / <code>super@123</code> (change after first use).</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            data-testid="input-staff-username"
            value={staffUser}
            onChange={e => setStaffUser(e.target.value)}
            placeholder="Staff username"
          />
          <div className="relative">
            <Input
              data-testid="input-staff-password"
              type={showPass ? "text" : "password"}
              value={staffPass}
              onChange={e => setStaffPass(e.target.value)}
              placeholder="Staff password"
              className="pr-10"
            />
            <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Button
          data-testid="button-staff-login"
          onClick={handleStaffLogin}
          disabled={loggingIn || !staffUser.trim() || !staffPass}
          className="w-full h-10 gap-2"
        >
          <Lock className="w-4 h-4" /> {loggingIn ? "Signing in..." : "Sign in as Staff"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Compose a custom notification and deliver it to every registered customer's bell inbox instantly.
      </p>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Notification Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="button-broadcast-type-broadcast"
            onClick={() => setType("broadcast")}
            className={`h-11 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              type === "broadcast" ? "bg-pink-500/20 border-pink-500/50 text-pink-300" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <Megaphone className="w-4 h-4" /> Announcement
          </button>
          <button
            type="button"
            data-testid="button-broadcast-type-offer"
            onClick={() => setType("offer")}
            className={`h-11 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              type === "offer" ? "bg-amber-500/20 border-amber-500/50 text-amber-300" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <Tag className="w-4 h-4" /> Special Offer
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Title</label>
        <Input
          data-testid="input-broadcast-title"
          value={title}
          maxLength={120}
          onChange={e => setTitle(e.target.value)}
          placeholder={type === "offer" ? "🎆 Diwali Special — 70% OFF!" : "Important Update"}
        />
        <p className="text-[10px] text-muted-foreground text-right">{title.length}/120</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Message</label>
        <Textarea
          data-testid="textarea-broadcast-message"
          value={message}
          maxLength={500}
          rows={4}
          onChange={e => setMessage(e.target.value)}
          placeholder={type === "offer" ? "Use code DIWALI70 at checkout. Limited time only!" : "Write the message customers will see in their bell inbox..."}
        />
        <p className="text-[10px] text-muted-foreground text-right">{message.length}/500</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Open Link on Tap (optional)</label>
        <Input
          data-testid="input-broadcast-link"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="/ or /products?category=Sparklers"
        />
        <p className="text-[10px] text-muted-foreground">Leave blank to skip navigation. Use a path like <code>/cart</code> or <code>/partner</code>.</p>
      </div>

      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Preview</p>
        <div className={`rounded-lg p-3 border ${type === "offer" ? "bg-amber-500/10 border-amber-500/30" : "bg-pink-500/10 border-pink-500/30"}`}>
          <div className="flex items-start gap-2">
            {type === "offer" ? <Tag className="w-4 h-4 text-amber-400 mt-0.5" /> : <Megaphone className="w-4 h-4 text-pink-400 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{title || "Title"}</p>
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{message || "Your message preview will appear here…"}</p>
            </div>
          </div>
        </div>
      </div>

      <Button
        data-testid="button-broadcast-send"
        onClick={handleSend}
        disabled={sending || !title.trim() || !message.trim()}
        className="w-full h-11 gap-2 bg-pink-500 hover:bg-pink-600 text-white font-bold"
      >
        <Send className="w-4 h-4" /> {sending ? "Sending…" : "Send to All Customers"}
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

const BREVO_DEFAULTS: Record<string, string> = {
  "brevo-smtp-host": "smtp-relay.brevo.com",
  "brevo-smtp-port": "587",
  "brevo-smtp-login": "a893c9001@smtp-brevo.com",
  "brevo-smtp-key": "",
  "brevo-from-email": "invoice@skcrackers.net",
  "brevo-from-name": "S K Crackers",
};

const BREVO_FIELDS: Array<{ key: string; label: string; placeholder: string; secret?: boolean }> = [
  { key: "brevo-smtp-host", label: "SMTP Host", placeholder: "smtp-relay.brevo.com" },
  { key: "brevo-smtp-port", label: "SMTP Port", placeholder: "587" },
  { key: "brevo-smtp-login", label: "SMTP Login", placeholder: "xxxxx@smtp-brevo.com" },
  { key: "brevo-smtp-key", label: "SMTP Key (Password)", placeholder: "Paste your SMTP key here…", secret: true },
  { key: "brevo-from-email", label: "From Email", placeholder: "invoice@skcrackers.net" },
  { key: "brevo-from-name", label: "From Name", placeholder: "S K Crackers" },
];

function EmailSettingsSection() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const queries = BREVO_FIELDS.map(f =>
    useQuery<{ value: string | null }>({ queryKey: [`/api/settings/${f.key}`] })
  );
  const isLoading = queries.some(q => q.isLoading);
  const dataKey = queries.map(q => q.data?.value ?? "").join("|");

  if (!isLoading && !loaded) {
    const next: Record<string, string> = {};
    BREVO_FIELDS.forEach((f, i) => {
      next[f.key] = (queries[i].data?.value ?? "") || BREVO_DEFAULTS[f.key] || "";
    });
    setValues(next);
    setLoaded(true);
  }

  const savedKey = queries[3].data?.value ?? "";
  const isConfigured = !!savedKey;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        BREVO_FIELDS.map(f =>
          apiRequest("POST", `/api/settings/${f.key}`, { value: values[f.key] ?? "" })
        )
      );
    },
    onSuccess: () => {
      BREVO_FIELDS.forEach(f =>
        queryClient.invalidateQueries({ queryKey: [`/api/settings/${f.key}`] })
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast({ title: "Settings Saved", description: "Brevo SMTP is now active. Invoice emails will be sent automatically." });
    },
    onError: () => {
      toast({ title: "Save Failed", description: "Could not save Brevo settings.", variant: "destructive" });
    },
  });

  function handleSave() {
    if (!values["brevo-smtp-key"]?.trim()) {
      toast({ title: "SMTP Key Required", description: "Please paste your Brevo SMTP key.", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  }

  function setValue(key: string, value: string) {
    setValues(prev => ({ ...prev, [key]: value }));
  }

  void dataKey;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Configure <strong>Brevo SMTP</strong> to automatically send branded invoice emails to customers after they complete payment.
      </p>

      {/* Status badge */}
      {isLoading ? (
        <div className="h-10 bg-muted/40 rounded-lg animate-pulse" />
      ) : isConfigured ? (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <span className="text-sm text-green-400 font-medium">Brevo SMTP active — invoice emails are being sent automatically.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
          <KeyRound className="w-4 h-4 text-yellow-500 shrink-0" />
          <span className="text-sm text-yellow-400">SMTP Key not set — invoice emails are disabled. Fill in the form below.</span>
        </div>
      )}

      {/* Settings fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {BREVO_FIELDS.map((field) => {
          const isSecret = field.secret;
          const inputType = isSecret && !showKey ? "password" : "text";
          return (
            <div key={field.key} className={isSecret ? "sm:col-span-2 space-y-1.5" : "space-y-1.5"}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                {isSecret && <KeyRound className="w-3 h-3" />}
                {field.label}
                {isSecret && <span className="text-red-400">*</span>}
              </label>
              <div className="relative">
                <Input
                  type={inputType}
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={isSecret ? "pr-10 font-mono text-sm" : "text-sm"}
                  data-testid={`input-${field.key}`}
                />
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-toggle-show-smtp-key"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          data-testid="button-save-brevo-settings"
          className="flex items-center gap-2"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saveMutation.isPending ? "Saving…" : saved ? "Saved!" : "Save All Settings"}
        </Button>
        <p className="text-xs text-muted-foreground">
          The defaults are pre-filled. Just paste your SMTP key and click Save.
        </p>
      </div>

      {/* How to get the key */}
      <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Mail className="w-3.5 h-3.5" /> How to get your Brevo SMTP key
        </p>
        <ol className="text-xs text-muted-foreground space-y-1 list-none">
          <li>1. Sign in at <a href="https://app.brevo.com" target="_blank" rel="noreferrer" className="text-primary underline">app.brevo.com</a></li>
          <li>2. Click your profile (top-right) → <strong>SMTP &amp; API</strong></li>
          <li>3. Go to the <strong>SMTP</strong> tab → click <strong>Generate a new SMTP key</strong></li>
          <li>4. Copy the generated key and paste it in the <strong>SMTP Key</strong> field above</li>
          <li>5. Click <strong>Save All Settings</strong> — invoices go live instantly</li>
        </ol>
      </div>
    </div>
  );
}

function SmsSettingsSection() {
  const { toast } = useToast();
  const [provider, setProvider] = useState<string>("startmessaging");
  const [smKey, setSmKey] = useState("");
  const [smEndpoint, setSmEndpoint] = useState("https://api.startmessaging.com/otp/send");
  const [smSender, setSmSender] = useState("");
  const [f2sKey, setF2sKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testResult, setTestResult] = useState<string>("");

  const queries = [
    useQuery<{ value: string | null }>({ queryKey: ["/api/settings/sms-provider"] }),
    useQuery<{ value: string | null }>({ queryKey: ["/api/settings/startmessaging-api-key"] }),
    useQuery<{ value: string | null }>({ queryKey: ["/api/settings/startmessaging-endpoint"] }),
    useQuery<{ value: string | null }>({ queryKey: ["/api/settings/startmessaging-sender-id"] }),
    useQuery<{ value: string | null }>({ queryKey: ["/api/settings/fast2sms-api-key"] }),
  ];
  const isLoading = queries.some((q) => q.isLoading);

  if (!isLoading && !loaded) {
    setProvider(queries[0].data?.value || "startmessaging");
    setSmKey(queries[1].data?.value || "");
    setSmEndpoint(queries[2].data?.value || "https://api.startmessaging.com/otp/send");
    setSmSender(queries[3].data?.value || "");
    setF2sKey(queries[4].data?.value || "");
    setLoaded(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      await Promise.all([
        apiRequest("POST", "/api/settings/sms-provider", { value: provider }),
        apiRequest("POST", "/api/settings/startmessaging-api-key", { value: smKey }),
        apiRequest("POST", "/api/settings/startmessaging-endpoint", { value: smEndpoint }),
        apiRequest("POST", "/api/settings/startmessaging-sender-id", { value: smSender }),
        apiRequest("POST", "/api/settings/fast2sms-api-key", { value: f2sKey }),
      ]);
    },
    onSuccess: () => {
      ["sms-provider", "startmessaging-api-key", "startmessaging-endpoint", "startmessaging-sender-id", "fast2sms-api-key"].forEach((k) =>
        queryClient.invalidateQueries({ queryKey: [`/api/settings/${k}`] })
      );
      toast({ title: "SMS settings saved", description: `Active provider: ${provider}` });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const test = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/customers/send-otp", { phone: testPhone });
      return res.json();
    },
    onSuccess: (d: any) => {
      if (d.smsSent) {
        setTestResult(`✓ SMS sent successfully via ${d.provider}`);
        toast({ title: "Test SMS sent", description: `Provider: ${d.provider}` });
      } else {
        setTestResult(`✗ Failed via ${d.provider}: ${d.error || "unknown error"}. (OTP for manual test: ${d.otp})`);
        toast({ title: "Send failed", description: d.error, variant: "destructive" });
      }
    },
    onError: (e: any) => {
      setTestResult(`✗ ${e?.message ?? "Request failed"}`);
      toast({ title: "Failed", variant: "destructive" });
    },
  });

  const activeKey = provider === "startmessaging" ? smKey : f2sKey;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Configure the SMS service used to send OTP codes to customers during phone verification and password reset.
      </p>

      {activeKey ? (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          <span className="text-sm text-green-400 font-medium">{provider === "startmessaging" ? "StartMessaging" : "Fast2SMS"} active — OTP SMS will be sent via this provider.</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
          <KeyRound className="w-4 h-4 text-yellow-500 shrink-0" />
          <span className="text-sm text-yellow-400">No API key set for {provider} — OTP will be shown on screen instead of texted.</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SMS Provider</label>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger data-testid="select-sms-provider"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="startmessaging">StartMessaging (DLT-free, India)</SelectItem>
            <SelectItem value="fast2sms">Fast2SMS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {provider === "startmessaging" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <KeyRound className="w-3 h-3" /> API Key <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={smKey}
                onChange={(e) => setSmKey(e.target.value)}
                placeholder="sm_live_xxxxxxxxxxxxxxxx"
                className="pr-10 font-mono text-sm"
                data-testid="input-startmessaging-key"
              />
              <button type="button" onClick={() => setShowSecret((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">API Endpoint</label>
            <Input value={smEndpoint} onChange={(e) => setSmEndpoint(e.target.value)} placeholder="https://api.startmessaging.com/otp/send" className="text-sm font-mono" data-testid="input-startmessaging-endpoint" />
            <p className="text-xs text-muted-foreground">Default works for most setups. Change only if StartMessaging gives a different URL.</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sender ID (optional)</label>
            <Input value={smSender} onChange={(e) => setSmSender(e.target.value)} placeholder="SKCRKR" className="text-sm" data-testid="input-startmessaging-sender" />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <KeyRound className="w-3 h-3" /> Fast2SMS API Key
          </label>
          <div className="relative">
            <Input type={showSecret ? "text" : "password"} value={f2sKey} onChange={(e) => setF2sKey(e.target.value)} placeholder="Paste your Fast2SMS key here…" className="pr-10 font-mono text-sm" data-testid="input-fast2sms-key" />
            <button type="button" onClick={() => setShowSecret((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Leaving this blank falls back to the FAST2SMS_API_KEY environment variable.</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="flex items-center gap-2" data-testid="button-save-sms-settings">
          <Save className="w-4 h-4" />{save.isPending ? "Saving…" : "Save SMS Settings"}
        </Button>
      </div>

      <div className="bg-muted/30 rounded-xl border border-border p-4 space-y-3">
        <p className="text-xs font-semibold text-foreground flex items-center gap-2">
          <Send className="w-3.5 h-3.5" /> Send Test OTP
        </p>
        <div className="flex gap-2">
          <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="10-digit phone" className="text-sm" data-testid="input-test-phone" />
          <Button variant="outline" onClick={() => test.mutate()} disabled={test.isPending || testPhone.length < 10} data-testid="button-test-sms">
            {test.isPending ? "Sending…" : "Send"}
          </Button>
        </div>
        {testResult && <p className="text-xs font-mono break-all">{testResult}</p>}
        <p className="text-xs text-muted-foreground">A real OTP will be sent. If the API call fails, the OTP will be shown above so you can still test login flow.</p>
      </div>
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

      <SectionPanel icon={<Sparkles className="h-5 w-5" />} title="AI Help Chat (OpenAI API Key)">
        <OpenAIKeySection />
      </SectionPanel>

      <SectionPanel icon={<MessageSquare className="h-5 w-5" />} title="WhatsApp Settings">
        <WhatsAppSettings />
      </SectionPanel>

      <SectionPanel icon={<Megaphone className="h-5 w-5" />} title="Broadcast Notifications to All Customers">
        <BroadcastNotificationSection />
      </SectionPanel>

      <SectionPanel icon={<Mail className="h-5 w-5" />} title="Email Invoice Settings">
        <EmailSettingsSection />
      </SectionPanel>

      <SectionPanel icon={<MessageSquare className="h-5 w-5" />} title="SMS / OTP Settings">
        <SmsSettingsSection />
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
