"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResearchStore } from "@/store/research-store";
import ResearchCard from "@/components/ResearchCard";
import NewResearchModal from "@/components/NewResearchModal";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { researches, createResearch, deleteResearch, setActiveResearch, initFlowerField } = useResearchStore();
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    initFlowerField();
  }, [initFlowerField]);

  function handleCreate(title: string, objective: string) {
    const id = createResearch(title, objective);
    setShowNewModal(false);
    setActiveResearch(id);
    router.push(`/research/${id}`);
  }

  function handleOpen(id: string) {
    setActiveResearch(id);
    router.push(`/research/${id}`);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (confirm("确定删除这个研究吗？")) {
      deleteResearch(id);
    }
  }

  return (
    <div className="min-h-screen bg-honey-50 relative">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 game-hud">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐝</span>
            <div>
              <h1 className="font-bold text-base text-honey-300 tracking-wider">
                ARGUS
              </h1>
              <p className="text-[10px] text-honey-500/70">
                AI Swarm Search Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-honey-400">
            <span>🍯 研究: {researches.length}</span>
            <span>🐝 蜂群: {researches.reduce((a, r) => a + r.bees.length, 0)}</span>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="pixel-btn flex items-center gap-2 px-5 py-2 bg-honey-500 text-bee-dark text-sm font-bold"
          >
            ＋ 新建研究
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        {researches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-6"
          >
            <span className="text-6xl">🐝</span>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-bee-dark mb-2">
                欢迎来到 ARGUS
              </h2>
              <p className="text-sm text-bee-dark/50">
                ━━━ AI 蜂群情报搜索引擎 ━━━
              </p>
            </div>

            <div className="pixel-card p-5 text-sm text-bee-dark/60 text-center leading-relaxed max-w-md">
              🍯 派出 AI 蜜蜂军团采集情报<br />
              ⬡ 构建蜂巢知识图谱<br />
              📜 生成深度研究报告
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="pixel-btn px-8 py-3 bg-honey-400 text-bee-dark font-bold text-base"
            >
              🎮 开始研究
            </button>
          </motion.div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-bee-dark flex items-center gap-2">
                📦 我的研究任务
                <span className="pixel-tag border-honey-500 text-honey-600 bg-honey-100 text-[10px]">
                  {researches.length}
                </span>
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {researches.map((r) => (
                  <ResearchCard
                    key={r.id}
                    research={r}
                    onClick={() => handleOpen(r.id)}
                    onDelete={(e) => handleDelete(e, r.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      <NewResearchModal open={showNewModal} onClose={() => setShowNewModal(false)} onCreate={handleCreate} />
    </div>
  );
}
