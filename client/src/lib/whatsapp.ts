export function openWhatsApp(phone: string, message: string) {
  const cleaned = (phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(message || "");
  const appLink = `whatsapp://send?phone=${cleaned}&text=${text}`;
  const webLink = `https://wa.me/${cleaned}?text=${text}`;

  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = appLink;
    setTimeout(() => {
      window.location.href = webLink;
    }, 1200);
  } else {
    window.open(webLink, "_blank", "noopener,noreferrer");
  }
}
