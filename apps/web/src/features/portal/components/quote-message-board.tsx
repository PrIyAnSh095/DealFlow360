import { useState } from "react";
import { useQuoteMessages, useSendQuoteMessage } from "../hooks";
import { Send, UserCircle2, Building2, ShieldAlert } from "lucide-react";

export function QuoteMessageBoard({ publicId }: { publicId: string }) {
  const { data: messages = [], isLoading } = useQuoteMessages(publicId);
  const { mutate: sendMessage, isPending } = useSendQuoteMessage();
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage({ publicId, payload: { content, sender_type: "CUSTOMER" } }, {
      onSuccess: () => setContent("")
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border w-[380px] shrink-0">
      <div className="p-4 border-b border-border bg-muted/30">
        <h3 className="font-bold text-[14px] text-foreground flex items-center gap-2">
          Negotiation Log
        </h3>
        <p className="text-[12px] text-foreground-muted">Discuss terms directly with your sales rep.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-[12px] text-foreground-muted mt-10">
            No messages yet. Send a message to start negotiating!
          </div>
        )}
        {messages.map((msg) => {
          const isCustomer = msg.sender_type === "CUSTOMER";
          const isSystem = msg.sender_type === "SYSTEM";

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3" />
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-[13px] ${
                isCustomer ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'
              }`}>
                <div className="flex items-center gap-1.5 mb-1 opacity-80 text-[10px] font-bold uppercase tracking-wider">
                  {isCustomer ? <UserCircle2 className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                  {isCustomer ? "You" : "Sales Team"}
                </div>
                <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-border bg-background">
        <div className="relative">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="w-full bg-surface border border-input focus:border-primary focus:ring-1 focus:ring-primary rounded-lg p-3 pr-12 text-[13px] min-h-[80px] resize-none outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!content.trim() || isPending}
            className="absolute bottom-3 right-3 p-1.5 bg-primary text-primary-foreground rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
