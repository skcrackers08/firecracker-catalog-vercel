import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type Msg = { role: "user" | "ai"; text: string };

export function AIChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hi! I am S K Crackers AI Help. Ask me about products, offers, or how to order." },
  ]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setSending(true);
    try {
      const res = await apiRequest("POST", "/api/chat", { message: text });
      const data = (await res.json()) as { reply?: string };
      setMessages((m) => [...m, { role: "ai", text: data.reply || "Sorry, please try again." }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "AI help not available now. Please contact WhatsApp: 9344468937" }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="button-ai-chat-open"
        aria-label="Open AI Help"
        className="fixed bottom-36 right-4 z-[60] w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:scale-110 shadow-2xl flex items-center justify-center transition-transform ring-4 ring-violet-500/30"
      >
        <Sparkles className="w-5 h-5 text-white" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            data-testid="dialog-ai-chat"
            className="relative w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-background border border-white/10 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white" data-testid="text-ai-chat-title">S K Crackers AI Help</p>
                  <p className="text-[10px] text-muted-foreground">Product enquiry assistant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                data-testid="button-ai-chat-close"
                aria-label="Close"
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3" data-testid="container-ai-chat-messages">
              {messages.map((m, i) => (
                <div
                  key={i}
                  data-testid={`msg-${m.role}-${i}`}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-white/10 text-white rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white rounded-2xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-3 bg-background/95 backdrop-blur safe-area-bottom">
              <div className="flex items-center gap-2">
                <input
                  data-testid="input-ai-chat-message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask your question…"
                  disabled={sending}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={sending || !input.trim()}
                  data-testid="button-ai-chat-send"
                  aria-label="Send"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:scale-105 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-transform shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Orders are confirmed manually via WhatsApp as per government rules.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
