export function openWhatsApp(phone: string, message: string) {
  const cleaned = (phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(message || "");
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  if (isAndroid) {
    const fallback = encodeURIComponent(`https://wa.me/${cleaned}?text=${text}`);
    window.location.href =
      `intent://send?phone=${cleaned}&text=${text}` +
      `#Intent;scheme=whatsapp;package=com.whatsapp;` +
      `S.browser_fallback_url=${fallback};end`;
  } else if (isIOS) {
    const start = Date.now();
    window.location.href = `whatsapp://send?phone=${cleaned}&text=${text}`;
    setTimeout(() => {
      if (Date.now() - start < 2200 && !document.hidden) {
        window.location.href = `https://wa.me/${cleaned}?text=${text}`;
      }
    }, 1500);
  } else {
    window.open(`https://web.whatsapp.com/send?phone=${cleaned}&text=${text}`, "_blank", "noopener,noreferrer");
  }
}
