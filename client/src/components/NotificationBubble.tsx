import { useState, useEffect } from "react";
import { Bell, X, Sparkles, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface OfferItem {
  title: string;
  description?: string;
}

export function openNotifications() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-notifications"));
  }
}

export function NotificationBubble() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-notifications", handler as EventListener);
    return () => window.removeEventListener("open-notifications", handler as EventListener);
  }, []);

  const { data: offersSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings/homepage-offers"],
  });

  let offers: OfferItem[] = [];
  if (offersSetting?.value) {
    try {
      const parsed = JSON.parse(offersSetting.value);
      if (Array.isArray(parsed)) offers = parsed;
    } catch {
      offers = [{ title: offersSetting.value }];
    }
  }
  if (offers.length === 0) {
    offers = [
      { title: "🎆 Diwali Special", description: "Up to 50% OFF on all crackers — enquire now via WhatsApp." },
      { title: "🎁 Free Gift Box", description: "On orders above ₹3,000 within Tamil Nadu." },
      { title: "🚚 Fast Dispatch", description: "Transport details shared within 24 hours of confirmation." },
    ];
  }

  const hasNew = offers.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="button-notifications-open"
        aria-label="Offers and notifications"
        className="fixed bottom-52 right-4 z-[60] w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 hover:scale-110 shadow-2xl flex items-center justify-center transition-transform ring-4 ring-amber-500/30"
      >
        <Bell className="w-5 h-5 text-white" />
        {hasNew && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-background">
            {offers.length}
          </span>
        )}
      </button>

      {open && (
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
                  <p className="text-sm font-bold text-white">Offers & Updates</p>
                  <p className="text-[10px] text-muted-foreground">S K Crackers special discounts</p>
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

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {offers.map((offer, i) => (
                <div
                  key={i}
                  data-testid={`notification-${i}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/5 border border-amber-500/30"
                >
                  <div className="flex items-start gap-3">
                    <Tag className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">{offer.title}</p>
                      {offer.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{offer.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground text-center pt-2">
                Final order confirmation is done manually via WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
