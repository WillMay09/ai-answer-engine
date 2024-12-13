import axios from "axios";
import * as cheerio from "cheerio"

export const urlRegex = /https?:\/\/(?:www\.)?[^\s/$.?#].[^\s]*/gi;

export async function scrapeUrl(url: string)
{
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const title = $("title").text();
    console.log($)
}