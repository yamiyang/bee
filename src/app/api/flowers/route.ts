/* ============================================================
   🌸 花田 API — 信息源管理
   
   GET  /api/flowers        — 获取所有信息源列表
   PATCH /api/flowers       — 更新单个源的状态或配置
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { readFlowerSources, writeFlowerSources } from "@/engine/flowers/storage";
import type { SourceStatus, SourceConfig } from "@/types";

/** GET — 返回所有信息源 */
export async function GET() {
  const sources = await readFlowerSources();
  return NextResponse.json({ sources });
}

/** PATCH — 更新单个信息源的状态或配置 */
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, config } = body as {
    id: string;
    status?: SourceStatus;
    config?: Partial<SourceConfig>;
  };

  if (!id) {
    return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
  }

  const sources = await readFlowerSources();
  const idx = sources.findIndex(s => s.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: `信息源 ${id} 不存在` }, { status: 404 });
  }

  // 更新字段
  if (status) {
    sources[idx].status = status;
  }
  if (config) {
    sources[idx].config = { ...sources[idx].config, ...config };
  }

  await writeFlowerSources(sources);

  return NextResponse.json({ source: sources[idx] });
}
