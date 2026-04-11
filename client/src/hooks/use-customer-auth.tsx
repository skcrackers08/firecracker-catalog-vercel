import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Customer {
  id: number;
  username: string;
  phone: string;
  phoneVerified: boolean;
}

interface OtpResult {
  success: boolean;
  smsSent: boolean;
  otp?: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, phone: string) => Promise<boolean>;
  logout: () => Promise<void>;
  sendOtp: (phone: string) => Promise<OtpResult | null>;
  verifyOtpAndLogin: (phone: string, otp: string) => Promise<boolean>;
  sendForgotOtp: (phone: string) => Promise<OtpResult | null>;
  resetPassword: (phone: string, otp: string, newPassword: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ ok: boolean; message?: string }>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: customer, isLoading } = useQuery<Customer | null>({
    queryKey: ["/api/customers/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/customers/me");
        if (res.status === 401) return null;
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 30000,
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await apiRequest("POST", "/api/customers/login", { username, password });
      const data = await res.json();
      queryClient.setQueryData(["/api/customers/me"], data);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (username: string, password: string, phone: string): Promise<boolean> => {
    try {
      const res = await apiRequest("POST", "/api/customers/register", { username, password, phone });
      const data = await res.json();
      queryClient.setQueryData(["/api/customers/me"], data);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest("POST", "/api/customers/logout", {});
    } catch {}
    queryClient.setQueryData(["/api/customers/me"], null);
    queryClient.removeQueries({ queryKey: ["/api/customers/orders"] });
  };

  const sendOtp = async (phone: string): Promise<OtpResult | null> => {
    try {
      const res = await apiRequest("POST", "/api/customers/send-otp", { phone });
      return await res.json() as OtpResult;
    } catch {
      return null;
    }
  };

  const verifyOtpAndLogin = async (phone: string, otp: string): Promise<boolean> => {
    try {
      const res = await apiRequest("POST", "/api/customers/verify-otp", { phone, otp });
      const data = await res.json() as { success: boolean; customer: Customer };
      if (data.customer) {
        queryClient.setQueryData(["/api/customers/me"], data.customer);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
      }
      return true;
    } catch {
      return false;
    }
  };

  const sendForgotOtp = async (phone: string): Promise<OtpResult | null> => {
    try {
      const res = await apiRequest("POST", "/api/customers/forgot-password/send-otp", { phone });
      return await res.json() as OtpResult;
    } catch {
      return null;
    }
  };

  const resetPassword = async (phone: string, otp: string, newPassword: string): Promise<boolean> => {
    try {
      await apiRequest("POST", "/api/customers/forgot-password/reset", { phone, otp, newPassword });
      return true;
    } catch {
      return false;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      await apiRequest("POST", "/api/customers/change-password", { oldPassword, newPassword });
      return { ok: true };
    } catch (err: any) {
      const raw: string = err?.message || "";
      try {
        const jsonStr = raw.substring(raw.indexOf("{"));
        const parsed = JSON.parse(jsonStr);
        return { ok: false, message: parsed.message || "Failed to change password" };
      } catch {
        return { ok: false, message: "Current password is incorrect or request failed." };
      }
    }
  };

  return (
    <CustomerAuthContext.Provider value={{
      customer: customer ?? null,
      isLoading,
      login,
      register,
      logout,
      sendOtp,
      verifyOtpAndLogin,
      sendForgotOtp,
      resetPassword,
      changePassword,
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
