import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { User, Lock, Phone, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button, Card, Input, Label, cn } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useToast } from "@/hooks/use-toast";

type Tab = "login" | "register";
type RegisterStep = "details" | "otp";

export default function CustomerLogin() {
  const [tab, setTab] = useState<Tab>("login");
  const [, setLocation] = useLocation();
  const { login, register, sendOtp, verifyOtp, customer } = useCustomerAuth();
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [registerForm, setRegisterForm] = useState({ username: "", password: "", phone: "" });
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>("details");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (customer) setLocation("/account");
  }, [customer]);

  if (customer) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password) {
      setLoginError("Please enter your username and password.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    const ok = await login(loginForm.username.trim(), loginForm.password);
    setLoginLoading(false);
    if (ok) {
      toast({ title: "Welcome back!", description: `Logged in as ${loginForm.username}` });
      setLocation("/account");
    } else {
      setLoginError("Invalid username or password. Please try again.");
    }
  };

  const handleSendOtp = async () => {
    if (!registerForm.phone || registerForm.phone.length < 10) {
      setRegisterError("Please enter a valid 10-digit phone number.");
      return;
    }
    setRegisterError("");
    setOtpSending(true);
    const otp = await sendOtp(registerForm.phone);
    setOtpSending(false);
    if (otp) {
      setOtpCode(otp);
      setRegisterStep("otp");
      toast({ title: "OTP Sent", description: `Your OTP is shown below for verification.` });
    } else {
      setRegisterError("Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async () => {
    if (enteredOtp.length < 6) {
      setOtpError("Please enter the 6-digit OTP.");
      return;
    }
    setOtpError("");
    const ok = await verifyOtp(registerForm.phone, enteredOtp);
    if (ok) {
      setOtpVerified(true);
    } else {
      setOtpError("Invalid OTP. Please check and try again.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.username.trim() || registerForm.username.length < 3) {
      setRegisterError("Username must be at least 3 characters.");
      return;
    }
    if (!registerForm.password || registerForm.password.length < 6) {
      setRegisterError("Password must be at least 6 characters.");
      return;
    }
    if (!registerForm.phone || registerForm.phone.length < 10) {
      setRegisterError("Please enter a valid phone number.");
      return;
    }
    if (!otpVerified) {
      setRegisterError("Please verify your phone number first.");
      return;
    }
    setRegisterLoading(true);
    setRegisterError("");
    const ok = await register(registerForm.username.trim(), registerForm.password, registerForm.phone);
    setRegisterLoading(false);
    if (ok) {
      toast({ title: "Account Created!", description: "Welcome to SK Crackers!" });
      setLocation("/account");
    } else {
      setRegisterError("Username or phone number already registered.");
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-gradient-gold mb-2">MY ACCOUNT</h1>
          <p className="text-muted-foreground text-sm">Sign in to view your orders and purchase history</p>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
          <button
            data-testid="tab-login"
            onClick={() => { setTab("login"); setLoginError(""); }}
            className={cn(
              "flex-1 py-3 text-sm font-bold transition-all duration-200",
              tab === "login" ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >Login</button>
          <button
            data-testid="tab-register"
            onClick={() => { setTab("register"); setRegisterError(""); setRegisterStep("details"); setOtpVerified(false); setOtpCode(""); setEnteredOtp(""); }}
            className={cn(
              "flex-1 py-3 text-sm font-bold transition-all duration-200",
              tab === "register" ? "bg-primary text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >Create Account</button>
        </div>

        {tab === "login" && (
          <Card className="p-6 animate-in fade-in duration-300">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="input-login-username"
                    value={loginForm.username}
                    onChange={e => { setLoginForm(f => ({ ...f, username: e.target.value })); setLoginError(""); }}
                    placeholder="Enter your username"
                    className="pl-9 h-12 bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="input-login-password"
                    type={showLoginPwd ? "text" : "password"}
                    value={loginForm.password}
                    onChange={e => { setLoginForm(f => ({ ...f, password: e.target.value })); setLoginError(""); }}
                    placeholder="Enter your password"
                    className="pl-9 pr-10 h-12 bg-white/5 border-white/10"
                  />
                  <button type="button" onClick={() => setShowLoginPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                    {showLoginPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
              <Button data-testid="button-login" type="submit" className="w-full h-12 font-bold" isLoading={loginLoading}>
                <ArrowRight className="w-4 h-4" /> Sign In
              </Button>
            </form>
          </Card>
        )}

        {tab === "register" && (
          <Card className="p-6 animate-in fade-in duration-300">
            {registerStep === "details" && (
              <form onSubmit={e => { e.preventDefault(); handleSendOtp(); }} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      data-testid="input-reg-username"
                      value={registerForm.username}
                      onChange={e => { setRegisterForm(f => ({ ...f, username: e.target.value })); setRegisterError(""); }}
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
                      type={showRegPwd ? "text" : "password"}
                      value={registerForm.password}
                      onChange={e => { setRegisterForm(f => ({ ...f, password: e.target.value })); setRegisterError(""); }}
                      placeholder="Create a password (min 6 chars)"
                      className="pl-9 pr-10 h-12 bg-white/5 border-white/10"
                    />
                    <button type="button" onClick={() => setShowRegPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                      {showRegPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      data-testid="input-reg-phone"
                      value={registerForm.phone}
                      onChange={e => { setRegisterForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })); setRegisterError(""); }}
                      placeholder="10-digit mobile number"
                      className="pl-9 h-12 bg-white/5 border-white/10 font-mono tracking-wider"
                    />
                  </div>
                </div>
                {registerError && <p className="text-red-400 text-sm">{registerError}</p>}
                <Button data-testid="button-send-otp" type="submit" className="w-full h-12 font-bold" isLoading={otpSending}>
                  <Phone className="w-4 h-4" /> Send OTP to Verify Phone
                </Button>
              </form>
            )}

            {registerStep === "otp" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
                  <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">OTP Sent to {registerForm.phone}</p>
                  <p className="text-xs text-muted-foreground mt-1">Your verification code:</p>
                  <p className="text-3xl font-mono font-bold text-primary mt-2 tracking-widest">{otpCode}</p>
                  <p className="text-xs text-muted-foreground mt-1">Valid for 10 minutes</p>
                </div>

                {!otpVerified ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Enter OTP</Label>
                      <Input
                        data-testid="input-otp"
                        value={enteredOtp}
                        onChange={e => { setEnteredOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
                        placeholder="6-digit OTP"
                        className="h-12 bg-white/5 border-white/10 font-mono text-xl tracking-widest text-center"
                        maxLength={6}
                      />
                    </div>
                    {otpError && <p className="text-red-400 text-sm">{otpError}</p>}
                    <Button data-testid="button-verify-otp" onClick={handleVerifyOtp} className="w-full h-12 font-bold">
                      <ShieldCheck className="w-4 h-4" /> Verify OTP
                    </Button>
                    <button onClick={() => setRegisterStep("details")} className="text-xs text-muted-foreground hover:text-white w-full text-center underline">
                      Change details
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                      <p className="text-green-400 font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Phone verified!
                      </p>
                    </div>
                    {registerError && <p className="text-red-400 text-sm">{registerError}</p>}
                    <Button data-testid="button-create-account" onClick={handleRegister} className="w-full h-12 font-bold" isLoading={registerLoading}>
                      <CheckCircle2 className="w-4 h-4" /> Create My Account
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
}
