import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { X, Phone, Lock, Eye, EyeOff, Tag, ArrowRight, ShieldCheck, MessageSquare, KeyRound, CheckCircle2, RefreshCw, UserPlus } from "lucide-react";
import { Button, Card, Input, Label, cn } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useToast } from "@/hooks/use-toast";

const POPUP_DISMISSED_KEY = "sk-login-popup-dismissed";
const PROMO_KEY = "sk-promo-code";

type View = "login" | "register" | "forgot";
type RegStep = "details" | "otp";
type ForgotStep = "phone" | "otp" | "newpass";

export function LoginPopup() {
  const { customer, isLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("login");

  useEffect(() => {
    if (isLoading) return;
    if (customer) { setOpen(false); return; }
    const dismissed = sessionStorage.getItem(POPUP_DISMISSED_KEY);
    if (dismissed) return;
    const path = window.location.pathname;
    if (path.startsWith("/admin") || path.startsWith("/login") || path.startsWith("/account")) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [customer, isLoading]);

  const handleClose = () => {
    sessionStorage.setItem(POPUP_DISMISSED_KEY, "1");
    setOpen(false);
  };

  if (!open || customer) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" data-testid="popup-login">
      <Card className="relative w-full max-w-md max-h-[92vh] overflow-y-auto p-6 sm:p-7 border-primary/30 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition"
          aria-label="Close"
          data-testid="button-close-popup"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-primary/30">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-2xl text-gradient-gold mb-1">
            {view === "login" ? "WELCOME BACK" : view === "register" ? "CREATE ACCOUNT" : "RESET PASSWORD"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {view === "login" ? "Sign in to place an enquiry" : view === "register" ? "Quick OTP verification — no spam" : "OTP verification on your mobile"}
          </p>
        </div>

        {view === "login" && <LoginPanel onSwitch={setView} onClose={handleClose} setLocation={setLocation} />}
        {view === "register" && <RegisterPanel onSwitch={setView} onClose={handleClose} setLocation={setLocation} />}
        {view === "forgot" && <ForgotPanel onSwitch={setView} />}

        <button
          onClick={handleClose}
          className="block mx-auto mt-5 text-xs text-muted-foreground hover:text-white underline"
          data-testid="button-continue-browsing"
        >
          Continue browsing without login
        </button>
      </Card>
    </div>
  );
}

function LoginPanel({ onSwitch, onClose, setLocation }: { onSwitch: (v: View) => void; onClose: () => void; setLocation: (l: string) => void; }) {
  const { login } = useCustomerAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [promo, setPromo] = useState(() => localStorage.getItem(PROMO_KEY) || "");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) { setError("Enter your 10-digit mobile number."); return; }
    if (!password) { setError("Enter your password."); return; }
    setError("");
    setLoading(true);
    const ok = await login(phone, password);
    setLoading(false);
    if (ok) {
      if (promo.trim()) localStorage.setItem(PROMO_KEY, promo.trim().toUpperCase());
      toast({ title: "Welcome back!", description: promo.trim() ? `Promo code "${promo.trim().toUpperCase()}" saved` : `Logged in as +91 ${phone}` });
      onClose();
    } else {
      setError("Invalid mobile number or password.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Username (Mobile Number)</Label>
        <div className="flex items-center gap-2">
          <div className="flex items-center h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-muted-foreground shrink-0">
            🇮🇳 +91
          </div>
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-popup-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
              placeholder="10-digit mobile number"
              className="pl-9 h-12 bg-white/5 border-white/10 font-mono tracking-wider"
              maxLength={10}
              autoFocus
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-popup-password"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            placeholder="Enter your password"
            className="pl-9 pr-10 h-12 bg-white/5 border-white/10"
          />
          <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Tag className="w-3 h-3" /> Promo Code <span className="text-[10px] normal-case tracking-normal text-muted-foreground/60">(optional)</span>
        </Label>
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-popup-promo"
            value={promo}
            onChange={e => setPromo(e.target.value.toUpperCase().replace(/\s/g, ""))}
            placeholder="Have a promo code? Enter here"
            className="pl-9 h-12 bg-white/5 border-white/10 uppercase tracking-wider"
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-sm" data-testid="text-popup-error">{error}</p>}

      <Button data-testid="button-popup-login" type="submit" className="w-full h-12 font-bold" isLoading={loading}>
        <ArrowRight className="w-4 h-4" /> Sign In
      </Button>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSwitch("register")}
          className="flex items-center justify-center gap-2 h-11 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-sm font-bold transition"
          data-testid="button-popup-new-user"
        >
          <UserPlus className="w-4 h-4" /> New User
        </button>
        <button
          type="button"
          onClick={() => onSwitch("forgot")}
          className="flex items-center justify-center gap-2 h-11 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition"
          data-testid="button-popup-forgot"
        >
          <KeyRound className="w-4 h-4" /> Forgot Password
        </button>
      </div>

      <p className="text-[11px] text-center text-muted-foreground pt-1">
        Both options use OTP verification on your mobile.
      </p>
    </form>
  );
}

function RegisterPanel({ onSwitch, onClose, setLocation }: { onSwitch: (v: View) => void; onClose: () => void; setLocation: (l: string) => void; }) {
  const { sendOtp, register } = useCustomerAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<RegStep>("details");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [otpResult, setOtpResult] = useState<{ smsSent: boolean; otp?: string } | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phone.length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setLoading(true);
    const result = await sendOtp(phone);
    setLoading(false);
    if (!result) { setError("Failed to send OTP. Please try again."); return; }
    setOtpResult(result);
    setStep("otp");
    setCooldown(30);
    toast({
      title: result.smsSent ? "OTP Sent" : "OTP Generated",
      description: result.smsSent ? `Sent to +91 ${phone}` : "SMS not configured — use code below",
    });
  };

  const handleVerifyAndCreate = async () => {
    if (enteredOtp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    if (otpResult?.otp && enteredOtp !== otpResult.otp) { setError("Incorrect OTP. Please try again."); return; }
    setError("");
    setLoading(true);
    const ok = await register(`user_${phone}`, password, phone);
    setLoading(false);
    if (ok) {
      toast({ title: "Account Created!", description: "Welcome to S K Crackers" });
      onClose();
    } else {
      setError("This mobile number is already registered. Please login instead.");
    }
  };

  if (step === "details") {
    return (
      <form onSubmit={handleSendOtp} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mobile Number</Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-muted-foreground shrink-0">🇮🇳 +91</div>
            <Input
              data-testid="input-reg-popup-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
              placeholder="10-digit mobile number"
              className="h-12 bg-white/5 border-white/10 font-mono tracking-wider flex-1"
              maxLength={10}
              autoFocus
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Create Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-reg-popup-password"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              placeholder="Min 6 characters"
              className="pl-9 pr-10 h-12 bg-white/5 border-white/10"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button data-testid="button-reg-popup-otp" type="submit" className="w-full h-12 font-bold" isLoading={loading}>
          <MessageSquare className="w-4 h-4" /> Send OTP
        </Button>
        <button type="button" onClick={() => onSwitch("login")} className="text-xs text-muted-foreground hover:text-white w-full text-center underline">
          Already have an account? Sign in
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {otpResult?.smsSent ? (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
          <MessageSquare className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">OTP sent to +91 {phone}</p>
        </div>
      ) : (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-center">
          <p className="text-xs text-muted-foreground">Use this OTP (SMS not configured):</p>
          <p className="text-3xl font-mono font-bold text-primary mt-1 tracking-widest" data-testid="text-popup-dev-otp">{otpResult?.otp}</p>
        </div>
      )}
      <Input
        data-testid="input-reg-popup-otp"
        type="text"
        inputMode="numeric"
        value={enteredOtp}
        onChange={e => { setEnteredOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
        placeholder="• • • • • •"
        className="h-14 bg-white/5 border-white/10 font-mono text-3xl tracking-[0.5em] text-center"
        maxLength={6}
        autoFocus
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button data-testid="button-reg-popup-verify" onClick={handleVerifyAndCreate} className="w-full h-12 font-bold" isLoading={loading}>
        <CheckCircle2 className="w-4 h-4" /> Verify & Create Account
      </Button>
      <div className="text-center">
        {cooldown > 0 ? (
          <p className="text-xs text-muted-foreground">Resend in {cooldown}s</p>
        ) : (
          <button onClick={handleSendOtp} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
            <RefreshCw className="w-3 h-3" /> Resend OTP
          </button>
        )}
      </div>
      <button type="button" onClick={() => { setStep("details"); setEnteredOtp(""); setError(""); }} className="text-xs text-muted-foreground hover:text-white w-full text-center underline">
        Change mobile number
      </button>
    </div>
  );
}

function ForgotPanel({ onSwitch }: { onSwitch: (v: View) => void; }) {
  const { sendForgotOtp, resetPassword } = useCustomerAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<ForgotStep>("phone");
  const [phone, setPhone] = useState("");
  const [otpResult, setOtpResult] = useState<{ smsSent: boolean; otp?: string } | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phone.length !== 10) { setError("Enter a valid 10-digit mobile number."); return; }
    setError("");
    setLoading(true);
    const result = await sendForgotOtp(phone);
    setLoading(false);
    if (!result) { setError("No account found with this number."); return; }
    setOtpResult(result);
    setStep("otp");
    toast({ title: result.smsSent ? "OTP Sent" : "OTP Generated", description: result.smsSent ? `Sent to +91 ${phone}` : "Use code below" });
  };

  const handleVerify = () => {
    if (enteredOtp.length !== 6) { setError("Enter the 6-digit OTP."); return; }
    if (otpResult?.otp && enteredOtp !== otpResult.otp) { setError("Incorrect OTP."); return; }
    setError("");
    setStep("newpass");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    const ok = await resetPassword(phone, enteredOtp, newPassword);
    setLoading(false);
    if (ok) {
      toast({ title: "Password Reset!", description: "Now sign in with your new password." });
      onSwitch("login");
    } else {
      setError("Failed to reset. OTP may have expired.");
    }
  };

  if (step === "phone") {
    return (
      <form onSubmit={handleSend} className="space-y-4">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-xs text-amber-300">Enter your registered mobile number — we'll send an OTP to reset your password.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mobile Number</Label>
          <div className="flex items-center gap-2">
            <div className="flex items-center h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-muted-foreground shrink-0">🇮🇳 +91</div>
            <Input
              data-testid="input-forgot-popup-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
              placeholder="10-digit mobile number"
              className="h-12 bg-white/5 border-white/10 font-mono tracking-wider flex-1"
              maxLength={10}
              autoFocus
            />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button data-testid="button-forgot-popup-send" type="submit" className="w-full h-12 font-bold" isLoading={loading}>
          <MessageSquare className="w-4 h-4" /> Send OTP
        </Button>
        <button type="button" onClick={() => onSwitch("login")} className="text-xs text-muted-foreground hover:text-white w-full text-center underline">
          Back to login
        </button>
      </form>
    );
  }

  if (step === "otp") {
    return (
      <div className="space-y-4">
        {otpResult?.smsSent ? (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
            <p className="text-sm font-bold text-white">OTP sent to +91 {phone}</p>
          </div>
        ) : (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-center">
            <p className="text-xs text-muted-foreground">Use this OTP:</p>
            <p className="text-3xl font-mono font-bold text-primary mt-1 tracking-widest">{otpResult?.otp}</p>
          </div>
        )}
        <Input
          data-testid="input-forgot-popup-otp"
          type="text"
          inputMode="numeric"
          value={enteredOtp}
          onChange={e => { setEnteredOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          placeholder="• • • • • •"
          className="h-14 bg-white/5 border-white/10 font-mono text-3xl tracking-[0.5em] text-center"
          maxLength={6}
          autoFocus
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <Button data-testid="button-forgot-popup-verify" onClick={handleVerify} className="w-full h-12 font-bold">
          <ShieldCheck className="w-4 h-4" /> Verify OTP
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleReset} className="space-y-4">
      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
        <p className="text-green-400 text-sm font-bold flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> OTP Verified — Set New Password
        </p>
      </div>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-testid="input-forgot-popup-newpass"
          type={showPwd ? "text" : "password"}
          value={newPassword}
          onChange={e => { setNewPassword(e.target.value); setError(""); }}
          placeholder="New password (min 6 chars)"
          className="pl-9 pr-10 h-12 bg-white/5 border-white/10"
        />
        <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-testid="input-forgot-popup-confirm"
          type={showPwd ? "text" : "password"}
          value={confirmPassword}
          onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
          placeholder="Confirm new password"
          className="pl-9 h-12 bg-white/5 border-white/10"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button data-testid="button-forgot-popup-reset" type="submit" className="w-full h-12 font-bold" isLoading={loading}>
        <CheckCircle2 className="w-4 h-4" /> Reset Password
      </Button>
    </form>
  );
}
