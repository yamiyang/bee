"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResearchStore } from "@/store/research-store";
import type { FlowerSource, SourceType } from "@/types";

export default function FlowerFieldPanel() {
  const sources = useResearchStore((s) => s.flowerSources);
  const toggleSource = useResearchStore((s) => s.toggleFlowerSource);
  const updateSource = useResearchStore((s) => s.updateFlowerSource);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempConfig, setTempConfig] = useState<Record<string, string>>({});

  const activeCount = sources.filter(s => s.status === "active").length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="game-hud px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🌸</span>
          <h2 className="text-base font-bold text-honey-300">
            花田 · 信息源管理
          </h2>
        </div>
        <p className="text-[10px] text-honey-500/70">
          激活 <span className="text-honey-300 font-bold">{activeCount}</span>/{sources.length} 个信息源 | 蜜蜂将采集已激活的花田
        </p>
      </div>

      {/* Source List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gradient-to-b from-honey-50 to-white">
        {sources.map((source) => (
          <FlowerCard
            key={source.id}
            source={source}
            isEditing={editingId === source.id}
            tempConfig={editingId === source.id ? tempConfig : {}}
            onToggle={() => toggleSource(source.id)}
            onEdit={() => {
              if (editingId === source.id) {
                updateSource(source.id, { config: { ...source.config, ...tempConfig } });
                setEditingId(null);
                setTempConfig({});
              } else {
                setEditingId(source.id);
                setTempConfig({});
              }
            }}
            onConfigChange={(key, value) => {
              setTempConfig(prev => ({ ...prev, [key]: value }));
            }}
            onCancel={() => {
              setEditingId(null);
              setTempConfig({});
            }}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t-3 border-bee-dark bg-honey-100">
        <p className="text-[9px] text-bee-dark/50 text-center">
          💡 arXiv、Hacker News、Reddit 无需 API Key
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────

interface FlowerCardProps {
  source: FlowerSource;
  isEditing: boolean;
  tempConfig: Record<string, string>;
  onToggle: () => void;
  onEdit: () => void;
  onConfigChange: (key: string, value: string) => void;
  onCancel: () => void;
}

function FlowerCard({ source, isEditing, tempConfig, onToggle, onEdit, onConfigChange, onCancel }: FlowerCardProps) {
  const isActive = source.status === "active";
  const needsKey = requiresApiKey(source.type);

  return (
    <motion.div
      layout
      className={`pixel-border-sm p-3 transition-colors ${
        isActive
          ? "bg-gradient-to-r from-green-50 to-honey-50 border-green-500"
          : "bg-white/80 border-gray-400"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{source.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-bee-dark">{source.name}</span>
            {isActive && (
              <span className="pixel-tag text-[8px] border-green-500 text-green-700 bg-green-100">
                ✓ 激活
              </span>
            )}
            {source.status === "error" && (
              <span className="pixel-tag text-[8px] border-red-500 text-red-700 bg-red-100">
                💥 错误
              </span>
            )}
            {source.status === "rate_limited" && (
              <span className="pixel-tag text-[8px] border-orange-500 text-orange-700 bg-orange-100">
                ⏳ 限流
              </span>
            )}
          </div>
          <p className="text-[11px] text-bee-dark/50 truncate">{source.description}</p>
        </div>

        <button
          onClick={onToggle}
          className={`w-10 h-5 pixel-border-sm relative transition-colors ${
            isActive ? "bg-green-400" : "bg-gray-300"
          }`}
        >
          <motion.div
            className="absolute top-0 w-4 h-4 bg-white pixel-border-sm"
            style={{ top: "-1px" }}
            animate={{ left: isActive ? 18 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      <div className="flex gap-1 mt-2 flex-wrap">
        {source.capabilities.map(cap => (
          <span key={cap} className="pixel-tag text-[8px] border-honey-400 text-honey-700 bg-honey-50">
            {capabilityLabel(cap)}
          </span>
        ))}
      </div>

      {needsKey && (
        <div className="mt-2">
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="text-[11px] text-honey-600 hover:text-honey-800 font-bold"
            >
              {source.config.apiKey || source.config.bearerToken ? "✓ 已配置 · 修改" : "⚙️ 配置 API Key"}
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 mt-2"
              >
                {getConfigFields(source.type).map(field => (
                  <div key={field.key}>
                    <label className="text-[10px] text-bee-dark/60 block mb-0.5 font-bold">
                      {field.label}
                    </label>
                    <input
                      type={field.type || "text"}
                      placeholder={field.placeholder}
                      value={tempConfig[field.key] || (source.config as Record<string, string>)[field.key] || ""}
                      onChange={(e) => onConfigChange(field.key, e.target.value)}
                      className="w-full px-2 py-1 text-xs pixel-border-sm bg-white focus:outline-none focus:border-honey-500"
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <button onClick={onEdit} className="pixel-btn px-3 py-1 text-[11px] bg-honey-400 text-bee-dark font-bold">
                    保存
                  </button>
                  <button onClick={onCancel} className="pixel-btn px-3 py-1 text-[11px] bg-gray-200 text-bee-dark/50">
                    取消
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {source.lastUsed && (
        <p className="text-[9px] text-bee-dark/30 mt-1">
          上次: {new Date(source.lastUsed).toLocaleString("zh-CN")}
        </p>
      )}
    </motion.div>
  );
}

// ─── Helpers ───

function requiresApiKey(type: SourceType): boolean {
  return ["google", "twitter", "scholar", "youtube"].includes(type);
}

function capabilityLabel(cap: string): string {
  const labels: Record<string, string> = {
    search: "🔍搜索",
    trending: "📈趋势",
    realtime: "⚡实时",
    historical: "📚历史",
    user_profile: "👤用户",
    comments: "💬讨论",
    code: "💻代码",
    papers: "📄论文",
    media: "🎬媒体",
  };
  return labels[cap] || cap;
}

interface ConfigField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
}

function getConfigFields(type: SourceType): ConfigField[] {
  switch (type) {
    case "google":
      return [{ key: "apiKey", label: "Serper API Key (serper.dev)", placeholder: "输入 API Key...", type: "password" }];
    case "twitter":
      return [{ key: "bearerToken", label: "Twitter Bearer Token", placeholder: "输入 Bearer Token...", type: "password" }];
    case "github":
      return [{ key: "apiKey", label: "GitHub Token (可选)", placeholder: "ghp_...", type: "password" }];
    case "scholar":
      return [{ key: "apiKey", label: "SerpAPI Key (serpapi.com)", placeholder: "输入 API Key...", type: "password" }];
    case "youtube":
      return [{ key: "apiKey", label: "YouTube Data API Key", placeholder: "输入 API Key...", type: "password" }];
    case "web":
      return [{ key: "apiKey", label: "Jina API Key (可选)", placeholder: "jina_...", type: "password" }];
    default:
      return [];
  }
}
