"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "@/types";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onStop?: () => void;
  isProcessing: boolean;
}

const roleConfig = {
  user: { emoji: "🧑‍💻", label: "勇者", bubbleClass: "chat-bubble-user ml-auto" },
  queen: { emoji: "👑", label: "蜂后", bubbleClass: "chat-bubble-agent" },
  bee: { emoji: "🐝", label: "蜜蜂", bubbleClass: "chat-bubble-agent" },
  system: { emoji: "⚙️", label: "系统", bubbleClass: "chat-bubble-agent opacity-70" },
};

export default function ChatPanel({ messages, onSend, onStop, isProcessing }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSubmit() {
    const text = input.trim();
    if (!text || isProcessing) return;
    onSend(text);
    setInput("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-bee-dark/40 gap-3">
            <span className="text-4xl">🐝</span>
            <div className="pixel-card p-4 text-center">
              <p className="text-sm leading-relaxed">
                输入研究目标<br />
                蜂群将为你采集情报
              </p>
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const config = roleConfig[msg.role];
            const isUser = msg.role === "user";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 pixel-border-sm bg-honey-100 flex items-center justify-center text-base">
                  {config.emoji}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] ${isUser ? "text-right" : ""}`}>
                  {!isUser && (
                    <div className="text-[10px] text-bee-dark/50 mb-0.5 px-1 font-bold">
                      {msg.beeName ? `🐝 ${msg.beeName}` : config.label}
                    </div>
                  )}
                  <div className={`${config.bubbleClass} px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap`}>
                    {msg.content}
                  </div>
                  <div className="text-[9px] text-bee-dark/30 mt-0.5 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-2"
          >
            <span className="text-sm">👑</span>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-honey-400 border border-honey-600"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
            <span className="text-[10px] text-bee-dark/50">蜂群工作中...</span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t-3 border-bee-dark bg-honey-100">
        <div className="flex gap-2 items-end">
          <span className="text-xs text-bee-dark/60 pb-2.5">▶</span>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isProcessing ? "蜂群工作中，请稍候..." : "输入研究目标..."}
            disabled={isProcessing}
            rows={1}
            className="flex-1 resize-none pixel-border-sm bg-white px-3 py-2 text-sm
              placeholder:text-bee-dark/30 focus:outline-none focus:border-honey-500
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: 40, maxHeight: 120 }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          {isProcessing && onStop ? (
            <button
              onClick={onStop}
              className="pixel-btn flex-shrink-0 w-10 h-10 bg-red-500 text-white flex items-center justify-center"
              title="停止研究"
            >
              ■
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
              className="pixel-btn flex-shrink-0 w-10 h-10 bg-honey-400 text-bee-dark flex items-center justify-center
                disabled:opacity-30 disabled:cursor-not-allowed font-bold"
            >
              ▶
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
