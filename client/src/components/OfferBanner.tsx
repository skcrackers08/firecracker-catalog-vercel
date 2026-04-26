import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { openWhatsApp } from "@/lib/whatsapp";
import { X, Megaphone, MessageCircle } from "lucide-react";

type Offer = {
  id: number;
  title: string;
  message: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  whatsappText: string | null;
};

const POPUP_DISMISS_KEY = "sk-offer-popup-dismissed";
const BANNER_DISMISS_KEY = "sk-offer-banner-dismissed";

export function OfferBanner({ context = "home" }: { context?: "home" | "product" }) {
  const { data: offer } = useQuery<Offer | null>({ queryKey: ["/api/offers/active"] });
  const { data: waSetting } = useQuery<{ value: string | null }>({ queryKey: ["/api/settings/whatsapp-number"] });
  const [popupOpen, setPopupOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);

  useEffect(() => {
    if (!offer || typeof window === "undefined") return;
    const popupKey = `${POPUP_DISMISS_KEY}-${offer.id}`;
    const bannerKey = `${BANNER_DISMISS_KEY}-${offer.id}`;
    // Reset open state per offer (so a new offer shows even if a previous one was dismissed)
    setBannerOpen(!localStorage.getItem(bannerKey));
    setPopupOpen(false);
    if (!localStorage.getItem(popupKey)) {
      const t = setTimeout(() => setPopupOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [offer?.id]);

  if (!offer) return null;

  const whatsappNumber = (waSetting?.value || "919344468937").replace(/\D/g, "");
  const ctaText = offer.whatsappText || `Hi! I'm interested in your offer: ${offer.title}. Please share more details.`;

  function dismissBanner() {
    setBannerOpen(false);
    if (offer && typeof window !== "undefined") localStorage.setItem(`${BANNER_DISMISS_KEY}-${offer.id}`, "1");
  }
  function dismissPopup() {
    setPopupOpen(false);
    if (offer && typeof window !== "undefined") localStorage.setItem(`${POPUP_DISMISS_KEY}-${offer.id}`, "1");
  }
  function handleEnquiry() {
    openWhatsApp(whatsappNumber, ctaText);
  }

  return (
    <>
      {bannerOpen && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-4 py-2.5 text-sm flex items-center justify-between gap-3 shadow-md sticky top-0 z-30" data-testid="offer-banner">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Megaphone className="w-4 h-4 flex-shrink-0 animate-pulse" />
            <span className="font-semibold truncate" data-testid="text-offer-title">{offer.title}</span>
            <span className="hidden sm:inline opacity-90 truncate">— {offer.message}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleEnquiry}
              className="bg-white text-orange-600 hover:bg-orange-50 font-semibold rounded-full px-3 py-1 text-xs flex items-center gap-1 transition"
              data-testid="button-offer-banner-enquiry"
            >
              <MessageCircle className="w-3 h-3" />
              {context === "product" ? "Book via WhatsApp" : "Send Enquiry"}
            </button>
            <button onClick={dismissBanner} className="hover:bg-white/20 rounded-full p-1" data-testid="button-offer-banner-close" aria-label="Close banner">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {popupOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={dismissPopup} data-testid="offer-popup-overlay">
          <div
            className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white relative">
              <button
                onClick={dismissPopup}
                className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition"
                data-testid="button-offer-popup-close"
                aria-label="Close popup"
              >
                <X className="w-4 h-4" />
              </button>
              <Megaphone className="w-10 h-10 mb-2 animate-pulse" />
              <h3 className="text-2xl font-extrabold leading-tight" data-testid="text-offer-popup-title">{offer.title}</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-line" data-testid="text-offer-popup-message">{offer.message}</p>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Valid till {new Date(offer.endDate).toLocaleDateString()}
              </div>
              <button
                onClick={() => { handleEnquiry(); dismissPopup(); }}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
                data-testid="button-offer-popup-enquiry"
              >
                <MessageCircle className="w-5 h-5" />
                {context === "product" ? "Book via WhatsApp" : "Send Enquiry"}
              </button>
              <button
                onClick={dismissPopup}
                className="w-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xs font-medium py-1"
                data-testid="button-offer-popup-later"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
