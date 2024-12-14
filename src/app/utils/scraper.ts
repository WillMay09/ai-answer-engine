
import axios from "axios";
import * as cheerio from "cheerio";
import { clearModuleContext } from "next/dist/server/lib/render-server";

export const urlRegex = /https?:\/\/(?:www\.)?[^\s/$.?#].[^\s]*/gi;

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\n+/g, " ").trim();
}
export async function scrapeUrl(url: string) {
  try {
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
    console.log(combinedContent)
    return {
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