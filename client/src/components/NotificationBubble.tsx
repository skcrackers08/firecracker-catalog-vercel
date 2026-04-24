import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Bell, X, Sparkles, Tag, ShoppingBag, XCircle, ArrowDownToLine,
  TrendingUp, UserPlus, Megaphone, Check, Inbox, Trash2,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCustomerAuth } from "@/hooks/use-customer-auth";

interface Notification {
  id: number;
  customerId: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotifResp {
  items: Notification[];
  unread: number;
}

export function openNotifications() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-notifications"));
  }
}

export function useUnreadNotifications() {
  const { customer } = useCustomerAuth();
  const { data } = useQuery<NotifResp>({
    queryKey: ["/api/notifications/me"],
    enabled: !!customer,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  return { unread: data?.unread ?? 0, items: data?.items ?? [] };
}

const TYPE_ICON: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  order_confirmed: { icon: ShoppingBag, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  order_status: { icon: ShoppingBag, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30" },
  order_cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  wallet_credit: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  wallet_debit: { icon: ArrowDownToLine, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  referral_join: { icon: UserPlus, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
  offer: { icon: Tag, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  broadcast: { icon: Megaphone, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30" },
};

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function NotificationBubble() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { customer } = useCustomerAuth();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-notifications", handler as EventListener);
    return () => window.removeEventListener("open-notifications", handler as EventListener);
  }, []);

  const { data, isLoading } = useQuery<NotifResp>({
    queryKey: ["/api/notifications/me"],
    enabled: !!customer && open,
  });

  const markAllRead = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/me/read-all", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications/me"] }),
  });

  // Auto-mark all as read shortly after opening
  useEffect(() => {
    if (open && customer && data && data.unread > 0) {
      const t = setTimeout(() => markAllRead.mutate(), 800);
      return () => clearTimeout(t);
    }
  }, [open, customer, data?.unread]);

  if (!open) return null;

  const items = data?.items ?? [];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div
        data-testid="dialog-notifications"
        className="relative w-full sm:max-w-md max-h-[85vh] bg-background border border-white/10 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-amber-500/20 to-orange-600/20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Notifications</p>
              <p className="text-[10px] text-muted-foreground">
                {customer ? `${items.length} item${items.length !== 1 ? "s" : ""}` : "Login to see your notifications"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            data-testid="button-notifications-close"
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {!customer ? (
            <div className="py-12 text-center text-muted-foreground">
              <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Please login to view your notifications.</p>
              <button
                onClick={() => { setOpen(false); setLocation("/login"); }}
                className="mt-3 text-xs px-4 py-2 bg-primary text-black font-bold rounded-full hover:opacity-90"
              >
                Login
              </button>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Inbox className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications yet.</p>
              <p className="text-[11px] mt-1">Order updates, wallet activity, referrals & special offers will appear here.</p>
            </div>
          ) : (
            items.map(n => {
              const meta = TYPE_ICON[n.type] || { icon: Bell, color: "text-white", bg: "bg-white/5 border-white/10" };
              const Icon = meta.icon;
              return (
                <button
                  key={n.id}
                  type="button"
                  data-testid={`notification-${n.id}`}
                  onClick={() => {
                    if (n.link) {
                      setOpen(false);
                      setLocation(n.link);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-xl border ${meta.bg} ${n.isRead ? "opacity-70" : ""} hover:bg-white/10 transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${meta.bg.replace('border-', '').split(' ')[0]}`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${n.isRead ? "font-medium text-white/80" : "font-bold text-white"}`}>{n.title}</p>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatRelative(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {customer && items.length > 0 && (
          <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{items.filter(i => !i.isRead).length} unread</span>
            <button
              type="button"
              data-testid="button-mark-all-read"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || items.every(i => i.isRead)}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 disabled:opacity-40"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
