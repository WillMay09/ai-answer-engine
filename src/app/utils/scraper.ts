import { Redis } from "@upstash/redis";
import axios from "axios";
import * as cheerio from "cheerio";
import { clearModuleContext } from "next/dist/server/lib/render-server";

export const urlRegex = /https?:\/\/(?:www\.)?[^\s/$.?#].[^\s]*/gi;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

//Cache TTL in seconds(7 days)
const CACHE_TTL = 7 * (24 * 60 * 60);
const MAX_CACHE_SIZE = 1024000;
function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\n+/g, " ").trim();
}
export async function scrapeUrl(url: string) {
  try {
    //check if cached first
    const cached = await getCachedContent(url);
    if(cached){

        return cached;
    }
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    //Remove script tags, style tags, and comments
    $("script").remove();
    $("style").remove();
    $("noscript").remove();
    $("iframe").remove();

    //Grab useful information
    const title = $("title").text();
    const metaDescription = $('meta[name="description"]').attr("content") || "";
    const h1 = $("h1")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const h2 = $("h2")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const articleText = $("article")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const mainText = $("main")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const contentText = $(".content, #content, [class*='content']")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const paragraphs = $("p")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    const listItems = $("li")
      .map((_, el) => $(el).text())
      .get()
      .join(" ");
    //combine into 1 string
    let combinedContent = [
      title,
      metaDescription,
      h1,
      h2,
      articleText,
      mainText,
      contentText,
      paragraphs,
      listItems,
    ].join(" ");

    combinedContent = cleanText(combinedContent).slice(0, 10000);
    console.log(combinedContent);
    const cleanedUPContent = {
      url,
      title: cleanText(title),
      headings: {
        h1: cleanText(h1),
        h2: cleanText(h2),
      },
      metaDescription: cleanText(metaDescription),
      content: combinedContent,
      error: null,
    };
    await cacheContent(url, cleanedUPContent);

    return cleanedUPContent;

  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      url,
      title: "",
      headings: {
        h1: "",
        h2: "",
      },
      metaDescription: "",
      content: "",
      error: errorMessage,
    };
  }
}

export interface ScrapedContent {
  url: string;
  title: string;
  headings: {
    h1: string;
    h2: string;
  };
  metaDescription: string;
  content: string;
  error: string | null;
  cachedAt?: number;
}
function isValidScrapedContent(data: any): data is ScrapedContent {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.url === "string" &&
    typeof data.title === "string" &&
    typeof data.headings === "object" &&
    typeof data.headings.h1 === "string" &&
    typeof data.headings.h2 === "string" &&
    typeof data.metaDescription === "string" &&
    typeof data.content === "string" &&
    (data.error === null || typeof data.error === "string")
  );
}

function getCacheKey(url: string): string {
  const sanitizedUrl = url.substring(0, 200);
  return `scrape:${sanitizedUrl}`;
}

async function getCachedContent(url: string): Promise<ScrapedContent | null> {
  try {
    const cacheKey = getCacheKey(url);
    const cached = await redis.get(cacheKey);

    if (!cached) {
      return null;
    }

    let parsed: any;
    if (typeof cached === "string") {
      try {
        parsed = JSON.parse(cached);
      } catch (parseError) {
        await redis.del(cacheKey);
        return null;
      }
    } else {
      parsed = cached;
    }
    if (isValidScrapedContent(parsed)) {
      const age = Date.now() - (parsed.cachedAt || 0);
      return parsed;
    }
    await redis.del(cacheKey);
    return null;
  } catch (error) {
    return null;
  }
}
async function cacheContent(
  url: string,
  content: ScrapedContent
): Promise<void> {
  try {
    const cacheKey = getCacheKey(url);
    content.cachedAt = Date.now();

    if (!isValidScrapedContent(content)) {
      return;
    }
    const serialized = JSON.stringify(content);

    if (serialized.length > MAX_CACHE_SIZE) {
      return;
    }

    await redis.set(cacheKey, serialized, { ex: CACHE_TTL });
  } catch (error) {


  }
}
