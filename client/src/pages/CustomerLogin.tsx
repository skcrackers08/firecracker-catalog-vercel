import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  User, Lock, Phone, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2,
  MessageSquare, KeyRound, RefreshCw,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button, Card, Input, Label, cn } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useToast } from "@/hooks/use-toast";

type Tab = "login" | "register" | "forgot";
type RegisterStep = "details" | "otp" | "done";
type ForgotStep = "phone" | "otp" | "newpass" | "done";

export default function CustomerLogin() {
  const [tab, setTab] = useState<Tab>("login");
  const [, setLocation] = useLocation();
  const { login, register, sendOtp, verifyOtpAndLogin, sendForgotOtp, resetPassword, customer } = useCustomerAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (customer) setLocation("/account");
  }, [customer]);
  if (customer) return null;

  return (
    <Layout>
      <div className="max-w-md mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-gradient-gold mb-2">MY ACCOUNT</h1>
          <p className="text-muted-foreground text-sm">Sign in to view your orders and purchase history</p>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
          {(["login", "register", "forgot"] as Tab[]).map((t, i) => (
            <button
              key={t}
              data-testid={`tab-${t}`}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-3 text-xs font-bold transition-all duration-200",
                i > 0 && "border-l border-white/10",
                tab === t ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"
              )}
            >
              {t === "login" ? "Login" : t === "register" ? "Create Account" : "Forgot Password"}
            </button>
          ))}
        </div>

        {tab === "login" && <LoginForm login={login} toast={toast} setLocation={setLocation} setTab={setTab} />}
        {tab === "register" && <RegisterForm sendOtp={sendOtp} register={register} toast={toast} setLocation={setLocation} />}
        {tab === "forgot" && <ForgotForm sendForgotOtp={sendForgotOtp} resetPassword={resetPassword} toast={toast} setTab={setTab} />}
      </div>
    </Layout>
  );
}

function LoginForm({ login, toast, setLocation, setTab }: {
  login: (u: string, p: string) => Promise<boolean>;
  toast: any;
  setLocation: (l: string) => void;
  setTab: (t: Tab) => void;
}) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    const ok = await login(form.username.trim(), form.password);
    setLoading(false);
    if (ok) {
      toast({ title: "Welcome back!", description: `Logged in as ${form.username}` });
      setLocation("/account");
    } else {
      setError("Invalid username or password. Please try again.");
    }
  };

  return (
    <Card className="p-6 animate-in fade-in duration-300">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-login-username"
              value={form.username}
              onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setError(""); }}
              placeholder="Enter your username"
              className="pl-9 h-12 bg-white/5 border-white/10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
            <button
              type="button"
              onClick={() => setTab("forgot")}
              className="text-xs text-primary hover:underline"
              data-testid="link-forgot-password"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-login-password"
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(""); }}
              placeholder="Enter your password"
              className="pl-9 pr-10 h-12 bg-white/5 border-white/10"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm" data-testid="text-login-error">{error}</p>}
        <Button data-testid="button-login" type="submit" className="w-full h-12 font-bold" isLoading={loading}>
          <ArrowRight className="w-4 h-4" /> Sign In
        </Button>
      </form>
    </Card>
  );
}

function RegisterForm({ sendOtp, register, toast, setLocation }: {
  sendOtp: (phone: string) => Promise<any>;
  register: (u: string, p: string, ph: string) => Promise<boolean>;
  toast: any;
  setLocation: (l: string) => void;
}) {
  const [step, setStep] = useState<RegisterStep>("details");
  const [form, setForm] = useState({ username: "", password: "", phone: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [otpResult, setOtpResult] = useState<{ smsSent: boolean; otp?: string } | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.username.trim() || form.username.length < 3) {
      setError("Username must be at least 3 characters."); return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    if (form.phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number."); return;
    }
    setError("");
    setLoading(true);
    const result = await sendOtp(form.phone);
    setLoading(false);
    if (!result) {
      setError("Failed to send OTP. Please try again."); return;
    }
    setOtpResult(result);
    setStep("otp");
    setResendCooldown(30);
    toast({
      title: result.smsSent ? "OTP Sent via SMS" : "OTP Generated",
      description: result.smsSent
        ? `OTP sent to +91 ${form.phone}`
        : "SMS not configured — your OTP is shown below.",
    });
  };

  const handleVerifyOtp = async () => {
    if (enteredOtp.length !== 6) {
      setOtpError("Please enter the 6-digit OTP."); return;
    }
    setOtpError("");
    const expectedOtp = otpResult?.otp;
    if (expectedOtp && enteredOtp !== expectedOtp) {
      setOtpError("Incorrect OTP. Please check and try again."); return;
    }
    setOtpVerified(true);
  };

  const handleRegister = async () => {
    if (!otpVerified) { setOtpError("Please verify your phone first."); return; }
    setLoading(true);
    setError("");
    const ok = await register(form.username.trim(), form.password, form.phone);
    setLoading(false);
    if (ok) {
      setStep("done");
      toast({ title: "Account Created!", description: "Welcome to SK Crackers!" });
      setTimeout(() => setLocation("/account"), 800);
    } else {
      setError("Username or phone already registered. Please try different details.");
    }
  };

  return (
    <Card className="p-6 animate-in fade-in duration-300">
      {step === "details" && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-reg-username"
                value={form.username}
                onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setError(""); }}
                placeholder="Choose a username (min 3 chars)"
                className="pl-9 h-12 bg-white/5 border-white/10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-reg-password"
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError(""); }}
                placeholder="Create a password (min 6 chars)"
                className="pl-9 pr-10 h-12 bg-white/5 border-white/10"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mobile Number</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-muted-foreground shrink-0">
                🇮🇳 +91
              </div>
              <Input
                data-testid="input-reg-phone"
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={e => { setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })); setError(""); }}
                placeholder="10-digit mobile number"
                className="h-12 bg-white/5 border-white/10 font-mono tracking-wider flex-1"
                maxLength={10}
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button data-testid="button-send-otp" type="submit" className="w-full h-12 font-bold" isLoading={loading}>
            <MessageSquare className="w-4 h-4" /> Verify Phone & Continue
          </Button>
        </form>
      )}

      {step === "otp" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {otpResult?.smsSent ? (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
              <MessageSquare className="w-7 h-7 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">OTP sent to +91 {form.phone}</p>
              <p className="text-xs text-muted-foreground mt-1">Check your SMS inbox</p>
            </div>
          ) : (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
              <ShieldCheck className="w-7 h-7 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-white">OTP for +91 {form.phone}</p>
              <p className="text-xs text-muted-foreground mt-1">Use this code (SMS not configured):</p>
              <p className="text-4xl font-mono font-bold text-primary mt-3 tracking-widest" data-testid="text-dev-otp">
                {otpResult?.otp}
              </p>
            </div>
          )}

          {!otpVerified ? (
            <>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Enter OTP</Label>
                <Input
                  data-testid="input-otp"
                  type="text"
                  inputMode="numeric"
                  value={enteredOtp}
                  onChange={e => { setEnteredOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
                  placeholder="• • • • • •"
                  className="h-14 bg-white/5 border-white/10 font-mono text-3xl tracking-[0.5em] text-center"
                  maxLength={6}
                  autoFocus
                />
              </div>
              {otpError && <p className="text-red-400 text-sm">{otpError}</p>}
              <Button data-testid="button-verify-otp" onClick={handleVerifyOtp} className="w-full h-12 font-bold">
                <ShieldCheck className="w-4 h-4" /> Verify OTP
              </Button>
              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-muted-foreground">Resend in {resendCooldown}s</p>
                ) : (
                  <button onClick={handleSendOtp} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <p className="text-green-400 font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Phone Verified!
                </p>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button data-testid="button-create-account" onClick={handleRegister} className="w-full h-12 font-bold" isLoading={loading}>
                <CheckCircle2 className="w-4 h-4" /> Create My Account
              </Button>
            </>
          )}
          <button onClick={() => { setStep("details"); setOtpVerified(false); setEnteredOtp(""); setOtpError(""); }}
            className="text-xs text-muted-foreground hover:text-white w-full text-center underline">
            Change details
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-4 animate-in fade-in duration-300">
          <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
          <p className="text-muted-foreground text-sm">Redirecting to your account…</p>
        </div>
      )}
    </Card>
  );
}

function ForgotForm({ sendForgotOtp, resetPassword, toast, setTab }: {
  sendForgotOtp: (phone: string) => Promise<any>;
  resetPassword: (phone: string, otp: string, newPassword: string) => Promise<boolean>;
  toast: any;
  setTab: (t: Tab) => void;
}) {
  const [step, setStep] = useState<ForgotStep>("phone");
  const [phone, setPhone] = useState("");
  const [otpResult, setOtpResult] = useState<{ smsSent: boolean; otp?: string } | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phone.length !== 10) { setError("Please enter a valid 10-digit mobile number."); return; }
    setError("");
    setLoading(true);
    const result = await sendForgotOtp(phone);
    setLoading(false);
    if (!result) {
      setError("No account found with this phone number. Please check and try again."); return;
    }
    setOtpResult(result);
    setStep("otp");
    setResendCooldown(30);
    toast({
      title: result.smsSent ? "OTP Sent" : "OTP Generated",
      description: result.smsSent ? `Check SMS on +91 ${phone}` : "Use the code shown below",
    });
  };

  const handleVerifyOtp = () => {
    if (enteredOtp.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    const expected = otpResult?.otp;
    if (expected && enteredOtp !== expected) { setError("Incorrect OTP. Please try again."); return; }
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
      setStep("done");
      toast({ title: "Password Reset!", description: "You can now login with your new password." });
    } else {
      setError("Failed to reset password. OTP may have expired — please try again.");
    }
  };

  return (
    <Card className="p-6 animate-in fade-in duration-300">
      {step === "phone" && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-sm text-amber-400 font-medium">Enter your registered mobile number to receive a password reset OTP.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Registered Mobile Number</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-muted-foreground shrink-0">
                🇮🇳 +91
              </div>
              <Input
                data-testid="input-forgot-phone"
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
          <Button data-testid="button-forgot-send-otp" type="submit" className="w-full h-12 font-bold" isLoading={loading}>
            <MessageSquare className="w-4 h-4" /> Send OTP
          </Button>
        </form>
      )}

      {step === "otp" && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {otpResult?.smsSent ? (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
              <MessageSquare className="w-7 h-7 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">OTP sent to +91 {phone}</p>
            </div>
          ) : (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
              <ShieldCheck className="w-7 h-7 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold text-white">OTP for +91 {phone}</p>
              <p className="text-4xl font-mono font-bold text-primary mt-3 tracking-widest" data-testid="text-forgot-otp">
                {otpResult?.otp}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Enter OTP</Label>
            <Input
              data-testid="input-forgot-otp"
              type="text"
              inputMode="numeric"
              value={enteredOtp}
              onChange={e => { setEnteredOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="• • • • • •"
              className="h-14 bg-white/5 border-white/10 font-mono text-3xl tracking-[0.5em] text-center"
              maxLength={6}
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button data-testid="button-forgot-verify-otp" onClick={handleVerifyOtp} className="w-full h-12 font-bold">
            <ShieldCheck className="w-4 h-4" /> Verify OTP
          </Button>
          <div className="text-center">
            {resendCooldown > 0 ? (
              <p className="text-xs text-muted-foreground">Resend in {resendCooldown}s</p>
            ) : (
              <button onClick={handleSendOtp} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
                <RefreshCw className="w-3 h-3" /> Resend OTP
              </button>
            )}
          </div>
        </div>
      )}

      {step === "newpass" && (
        <form onSubmit={handleReset} className="space-y-5 animate-in fade-in duration-300">
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
            <p className="text-green-400 text-sm font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> OTP Verified — Set New Password
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">New Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-new-password"
                type={showPwd ? "text" : "password"}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(""); }}
                placeholder="Minimum 6 characters"
                className="pl-9 pr-10 h-12 bg-white/5 border-white/10"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Confirm Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-confirm-password"
                type={showPwd ? "text" : "password"}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="Re-enter new password"
                className="pl-9 h-12 bg-white/5 border-white/10"
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button data-testid="button-reset-password" type="submit" className="w-full h-12 font-bold" isLoading={loading}>
            <KeyRound className="w-4 h-4" /> Reset Password
          </Button>
        </form>
      )}

      {step === "done" && (
        <div className="text-center py-4 animate-in fade-in duration-300">
          <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
          <p className="text-muted-foreground text-sm mb-6">Your password has been updated successfully.</p>
          <Button className="w-full h-12 font-bold" onClick={() => setTab("login")}>
            <ArrowRight className="w-4 h-4" /> Go to Login
          </Button>
        </div>
      )}
    </Card>
  );
}
