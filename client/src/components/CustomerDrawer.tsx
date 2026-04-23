import { useState, useRef, useEffect } from "react";
import { X, User, Phone, Mail, MapPin, Camera, KeyRound, Eye, EyeOff, Save, LogOut, ShieldCheck, Edit3, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Input, Label, cn } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useToast } from "@/hooks/use-toast";
import logoPng from "@assets/pngtree-logo-template-for-esports-vector-illustration-of-a-lio_1772309271956.png";

async function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = dataUrl;
  });
}

export function CustomerDrawer({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const { customer, logout, updateProfile, changePassword } = useCustomerAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [editing, setEditing] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ old: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName || "");
      setEmail(customer.email || "");
      setAddress(customer.address || "");
      setPhoto(customer.profilePhoto || null);
    }
  }, [customer]);

  if (!customer) return null;

  const handlePhotoPick = () => fileRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please pick an image under 5MB", variant: "destructive" });
      return;
    }
    setSavingPhoto(true);
    try {
      const dataUrl = await compressImage(file, 320, 0.82);
      const result = await updateProfile({ profilePhoto: dataUrl });
      if (result.ok) {
        setPhoto(dataUrl);
        toast({ title: "Profile photo updated" });
      } else {
        toast({ title: "Upload failed", description: result.message, variant: "destructive" });
      }
    } finally {
      setSavingPhoto(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast({ title: "Invalid email", description: "Please enter a valid email or leave blank.", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    const result = await updateProfile({ fullName, email, address });
    setSavingProfile(false);
    if (result.ok) {
      toast({ title: "Profile updated", description: "Your details have been saved." });
      setEditing(false);
    } else {
      toast({ title: "Save failed", description: result.message, variant: "destructive" });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.new.length < 6) { setPwError("New password must be at least 6 characters."); return; }
    if (pw.new !== pw.confirm) { setPwError("Passwords do not match."); return; }
    setPwError("");
    setPwLoading(true);
    const result = await changePassword(pw.old, pw.new);
    setPwLoading(false);
    if (result.ok) {
      toast({ title: "Password changed", description: "Your password has been updated." });
      setPw({ old: "", new: "", confirm: "" });
      setPwOpen(false);
    } else {
      setPwError(result.message || "Failed to change password.");
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
    toast({ title: "Logged out", description: "See you next time!" });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[75] bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: -360 }}
            animate={{ x: 0 }}
            exit={{ x: -360 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed top-0 left-0 bottom-0 z-[76] w-[92vw] max-w-sm bg-background border-r border-primary/20 shadow-2xl overflow-y-auto"
            data-testid="drawer-customer"
          >
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={logoPng} alt="logo" className="w-8 h-8 rounded-full ring-2 ring-primary/40" />
                <p className="font-display text-base text-gradient-gold leading-none">S K CRACKERS</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white"
                data-testid="button-drawer-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/40 shadow-fire-glow bg-white/5 flex items-center justify-center">
                    {photo ? (
                      <img src={photo} alt="profile" className="w-full h-full object-cover" data-testid="img-profile" />
                    ) : (
                      <User className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    onClick={handlePhotoPick}
                    disabled={savingPhoto}
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-black flex items-center justify-center shadow-lg hover:scale-110 transition disabled:opacity-50"
                    data-testid="button-pick-photo"
                    aria-label="Change profile photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <p className="font-bold text-lg text-white mt-3" data-testid="text-profile-name">{customer.fullName || customer.username}</p>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>+91 {customer.phone}</span>
                  {customer.phoneVerified && <ShieldCheck className="w-3.5 h-3.5 text-green-400" />}
                </div>
              </div>

              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">My Details</h3>
                  {!editing ? (
                    <button onClick={() => setEditing(true)} className="text-xs text-primary hover:underline flex items-center gap-1" data-testid="button-edit-profile">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  ) : (
                    <button onClick={() => { setEditing(false); setFullName(customer.fullName || ""); setEmail(customer.email || ""); setAddress(customer.address || ""); }} className="text-xs text-muted-foreground hover:text-white">
                      Cancel
                    </button>
                  )}
                </div>

                <ProfileField icon={<User className="w-4 h-4" />} label="Full Name" value={fullName} onChange={setFullName} editing={editing} placeholder="Your name" testId="profile-name" />
                <div className="flex items-start gap-2">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                    <p className="text-sm text-white font-medium font-mono">+91 {customer.phone}</p>
                    <p className="text-[10px] text-muted-foreground">Cannot be changed</p>
                  </div>
                </div>
                <ProfileField icon={<Mail className="w-4 h-4" />} label="Email" value={email} onChange={setEmail} editing={editing} placeholder="you@example.com" testId="profile-email" type="email" />
                <ProfileField icon={<MapPin className="w-4 h-4" />} label="Address" value={address} onChange={setAddress} editing={editing} placeholder="Your delivery address" testId="profile-address" multiline />

                {editing && (
                  <Button onClick={handleSaveProfile} isLoading={savingProfile} className="w-full h-10 font-bold text-sm" data-testid="button-save-profile">
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                )}
              </Card>

              <Card className="overflow-hidden">
                <button
                  onClick={() => setPwOpen(v => !v)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  data-testid="button-toggle-change-password"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center border border-amber-500/20">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">Change Password</p>
                      <p className="text-xs text-muted-foreground">Update your account password</p>
                    </div>
                  </div>
                  <span className={cn("text-muted-foreground transition-transform", pwOpen && "rotate-180")}>▼</span>
                </button>
                {pwOpen && (
                  <form onSubmit={handleChangePassword} className="border-t border-white/10 p-4 space-y-3 animate-in fade-in duration-200">
                    <PwInput value={pw.old} onChange={v => { setPw(p => ({ ...p, old: v })); setPwError(""); }} placeholder="Current password" show={showPw} onToggle={() => setShowPw(v => !v)} testId="input-old-password" />
                    <PwInput value={pw.new} onChange={v => { setPw(p => ({ ...p, new: v })); setPwError(""); }} placeholder="New password (min 6 chars)" show={showPw} testId="input-new-password" />
                    <PwInput value={pw.confirm} onChange={v => { setPw(p => ({ ...p, confirm: v })); setPwError(""); }} placeholder="Confirm new password" show={showPw} testId="input-confirm-password" />
                    {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
                    <Button type="submit" isLoading={pwLoading} className="w-full h-10 font-bold text-sm" data-testid="button-save-password">
                      <CheckCircle2 className="w-4 h-4" /> Update Password
                    </Button>
                  </form>
                )}
              </Card>

              <Button
                onClick={handleLogout}
                className="w-full h-11 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-bold gap-2"
                data-testid="button-drawer-logout"
              >
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ProfileField({ icon, label, value, onChange, editing, placeholder, testId, type = "text", multiline = false }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; editing: boolean; placeholder: string; testId: string; type?: string; multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</Label>
        {editing ? (
          multiline ? (
            <textarea
              data-testid={`input-${testId}`}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none resize-none"
            />
          ) : (
            <Input
              data-testid={`input-${testId}`}
              type={type}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              className="h-9 mt-1 bg-white/5 border-white/10 text-sm"
            />
          )
        ) : (
          <p className="text-sm text-white font-medium" data-testid={`text-${testId}`}>{value || <span className="text-muted-foreground italic">Not set</span>}</p>
        )}
      </div>
    </div>
  );
}

function PwInput({ value, onChange, placeholder, show, onToggle, testId }: { value: string; onChange: (v: string) => void; placeholder: string; show: boolean; onToggle?: () => void; testId: string; }) {
  return (
    <div className="relative">
      <Input
        data-testid={testId}
        type={show ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 pr-10 bg-white/5 border-white/10"
      />
      {onToggle && (
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
