/* ============================================================
   🕸️ Web Search Adapter
   
   通用网页搜索 — 使用 DuckDuckGo HTML 搜索。
   完全免费，无需 API key。
   
   搜索策略：
   1. 优先尝试 Jina Search（如果有 apiKey）
   2. 回退到 DuckDuckGo HTML 搜索（始终可用）
   ============================================================ */

import type { SourceResult, SourceConfig } from "@/types";
import type { FlowerAdapter, SearchOptions } from "../index";
import { proxyFetch } from "../proxy-fetch";

export const webAdapter: FlowerAdapter = {
  type: "web",
  name: "Web Search",
  icon: "🕸️",
  description: "通用网页搜索（DuckDuckGo）",
  capabilities: ["search"],

  async search(query: string, config: SourceConfig, options?: SearchOptions): Promise<SourceResult[]> {
    // 如果配置了 Jina key，优先尝试 Jina
    if (config.apiKey) {
      try {
        const jinaResults = await searchViaJina(query, config, options);
        if (jinaResults.length > 0) return jinaResults;
      } catch {
        // Jina 失败，回退到 DuckDuckGo
      }
    }

    // 使用 DuckDuckGo HTML 搜索
    return searchViaDuckDuckGo(query, options);
  },

  async validateConfig(): Promise<boolean> {
    return true;
  },
};

/**
 * DuckDuckGo HTML 搜索 — 解析 HTML 结果页
 * 完全免费，无需 API key，无 TLS 兼容问题
 */
async function searchViaDuckDuckGo(
  query: string,
  options?: SearchOptions
): Promise<SourceResult[]> {
  const maxResults = options?.maxResults || 10;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  try {
    const response = await proxyFetch(url, {
      method: "GET",
      headers: {
        Accept: "text/html",
      },
    });

    if (!response.ok) return [];

    const html = await response.text();
    return parseDuckDuckGoHTML(html, maxResults);
  } catch (err) {
    console.warn("[Web/DDG] Search failed:", err);
    return [];
  }
}

/**
 * 解析 DuckDuckGo HTML 搜索结果
 */
function parseDuckDuckGoHTML(html: string, maxResults: number): SourceResult[] {
  const results: SourceResult[] = [];

  // 提取结果块 —— 每个 <div class="result ..."> 或 <div class="web-result">
  const resultBlocks = html.split(/class="result results_links/).slice(1);

  for (let i = 0; i < Math.min(resultBlocks.length, maxResults); i++) {
    const block = resultBlocks[i];

    // 提取标题
    const titleMatch = block.match(/class="result__a"[^>]*>([^<]+)/);
    const title = titleMatch?.[1]?.trim() || "";

    // 提取 URL
    const urlMatch = block.match(/class="result__url"[^>]*>\s*([^<\s]+)/);
    let resultUrl = urlMatch?.[1]?.trim() || "";
    if (resultUrl && !resultUrl.startsWith("http")) {
      resultUrl = `https://${resultUrl}`;
    }

    // 提取 href（更可靠的 URL）
    const hrefMatch = block.match(/class="result__a"\s+href="([^"]+)"/);
    if (hrefMatch?.[1]) {
      // DDG 使用重定向 URL，尝试提取真实 URL
      const uddg = hrefMatch[1].match(/uddg=([^&]+)/);
      if (uddg?.[1]) {
        resultUrl = decodeURIComponent(uddg[1]);
      } else if (hrefMatch[1].startsWith("http")) {
        resultUrl = hrefMatch[1];
      }
    }

    // 提取摘要
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a/);
    let snippet = snippetMatch?.[1] || "";
    // 清理 HTML 标签
    snippet = snippet.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();

    if (title && resultUrl) {
      results.push({
        id: `web_ddg_${Date.now()}_${i}`,
        sourceId: "",
        sourceType: "web",
        sourceName: "Web (DuckDuckGo)",
        title,
        content: snippet || title,
        url: resultUrl,
        metadata: { engine: "duckduckgo" },
        fetchedAt: Date.now(),
      });
    }
  }

  return results;
}

/**
 * Jina Search — AI 搜索引擎（需要 API key）
 * https://s.jina.ai/
 */
async function searchViaJina(
  query: string,
  config: SourceConfig,
  options?: SearchOptions
): Promise<SourceResult[]> {
  const searchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...config.customHeaders,
  };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }

  const response = await proxyFetch(searchUrl, { headers });
  if (!response.ok) return [];

  const data = await response.json();
  const results = data.results || data.data || [];
  const maxResults = options?.maxResults || 10;

  return results.slice(0, maxResults).map((item: {
    title: string;
    content: string;
    url: string;
    description?: string;
  }, i: number) => ({
    id: `web_jina_${Date.now()}_${i}`,
    sourceId: "",
    sourceType: "web" as const,
    sourceName: "Web (Jina)",
    title: item.title || "Untitled",
    content: item.content || item.description || "",
    url: item.url,
    metadata: { engine: "jina" },
    fetchedAt: Date.now(),
  }));
}
