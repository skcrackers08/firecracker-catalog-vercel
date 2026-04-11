import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Phone, ShieldCheck, CheckCircle2, ArrowLeft, MessageSquare } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button, Card, Input, Label, cn } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useToast } from "@/hooks/use-toast";

type Step = "phone" | "otp" | "done";

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { sendOtp, verifyOtpAndLogin, customer } = useCustomerAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [smsSent, setSmsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (customer) setLocation("/account");
  }, [customer]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (customer) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);
    const result = await sendOtp(cleaned);
    setLoading(false);
    if (!result) {
      setError("Failed to send OTP. Please try again.");
      return;
    }
    setSmsSent(result.smsSent);
    if (!result.smsSent && result.otp) {
      setDevOtp(result.otp);
    }
    setStep("otp");
    setResendCooldown(30);
    toast({
      title: result.smsSent ? "OTP Sent via SMS" : "OTP Generated",
      description: result.smsSent
        ? `A 6-digit OTP has been sent to +91 ${cleaned}`
        : "SMS not configured — your OTP is shown below.",
    });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);
    const cleaned = phone.replace(/\D/g, "");
    const ok = await verifyOtpAndLogin(cleaned, otp);
    setLoading(false);
    if (ok) {
      setStep("done");
      toast({ title: "Verified!", description: "You are now logged in." });
      setTimeout(() => setLocation("/account"), 800);
    } else {
      setError("Incorrect OTP. Please check and try again.");
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
            <Phone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-gradient-gold mb-2">CUSTOMER LOGIN</h1>
          <p className="text-muted-foreground text-sm">
            Verify your mobile number to access your account and orders
          </p>
        </div>

        <div className="flex items-center gap-2 mb-8 px-2">
          {["phone", "otp", "done"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all shrink-0",
                step === s
                  ? "bg-primary border-primary text-white"
                  : (["phone", "otp", "done"].indexOf(step) > i)
                    ? "bg-primary/30 border-primary/50 text-primary"
                    : "bg-white/5 border-white/20 text-muted-foreground"
              )}>
                {["phone", "otp", "done"].indexOf(step) > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              {i < 2 && <div className={cn("h-0.5 flex-1", ["phone", "otp", "done"].indexOf(step) > i ? "bg-primary/50" : "bg-white/10")} />}
            </div>
          ))}
        </div>

        {step === "phone" && (
          <Card className="p-6 animate-in fade-in duration-300">
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Mobile Number
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-muted-foreground shrink-0">
                    🇮🇳 +91
                  </div>
                  <Input
                    data-testid="input-phone"
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                      setError("");
                    }}
                    placeholder="10-digit mobile number"
                    className="h-12 bg-white/5 border-white/10 font-mono tracking-wider text-base flex-1"
                    maxLength={10}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a one-time password to verify your number
                </p>
              </div>
              {error && <p className="text-red-400 text-sm" data-testid="text-error">{error}</p>}
              <Button
                data-testid="button-send-otp"
                type="submit"
                className="w-full h-12 font-bold"
                isLoading={loading}
              >
                <MessageSquare className="w-4 h-4" />
                Send OTP
              </Button>
            </form>
          </Card>
        )}

        {step === "otp" && (
          <Card className="p-6 animate-in fade-in duration-300 space-y-5">
            <button
              onClick={() => { setStep("phone"); setOtp(""); setError(""); setDevOtp(null); }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors mb-1"
            >
              <ArrowLeft className="w-3 h-3" /> Change number
            </button>

            {smsSent ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                <MessageSquare className="w-7 h-7 text-green-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-white">OTP sent to +91 {phone}</p>
                <p className="text-xs text-muted-foreground mt-1">Check your SMS inbox</p>
              </div>
            ) : (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
                <ShieldCheck className="w-7 h-7 text-primary mx-auto mb-2" />
                <p className="text-sm font-bold text-white">OTP for +91 {phone}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  SMS service not active — use this code to continue:
                </p>
                <p className="text-4xl font-mono font-bold text-primary mt-3 tracking-widest" data-testid="text-dev-otp">
                  {devOtp}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Valid for 10 minutes</p>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Enter 6-Digit OTP
                </Label>
                <Input
                  data-testid="input-otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  placeholder="• • • • • •"
                  className="h-14 bg-white/5 border-white/10 font-mono text-3xl tracking-[0.5em] text-center"
                  maxLength={6}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button
                data-testid="button-verify-otp"
                type="submit"
                className="w-full h-12 font-bold"
                isLoading={loading}
              >
                <ShieldCheck className="w-4 h-4" />
                Verify & Login
              </Button>
            </form>

            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Resend OTP in {resendCooldown}s
                </p>
              ) : (
                <button
                  data-testid="button-resend-otp"
                  onClick={handleSendOtp}
                  className="text-xs text-primary hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </Card>
        )}

        {step === "done" && (
          <Card className="p-8 text-center animate-in fade-in duration-300">
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Verified!</h2>
            <p className="text-muted-foreground text-sm">Redirecting to your account…</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
