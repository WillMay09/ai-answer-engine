// TODO: Implement the chat API with Groq and web scraping with Cheerio and Puppeteer
// Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Refer to the Groq SDK here on how to use an LLM: https://www.npmjs.com/package/groq-sdk
// Refer to the Cheerio docs here on how to parse HTML: https://cheerio.js.org/docs/basics/loading
// Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer
import {getAIResponse} from "@/app/utils/getAIClient"
import { scrapeUrl, urlRegex } from "@/app/utils/scraper";
export async function POST(req: Request) {
  try {
    const body = await req.json(); //parse the request body
    const { message } = body;
    //if there is a url in the user's response
    const url = message.match(urlRegex);
    //error handling
    if (!message) {
      
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    
    }
    if(url){

      console.log("url found:",url)
      const scrapedContent = scrapeUrl(url);
      
    }

    

    const response = await getAIResponse(message);
    //console.log(response);
    //pass back to the frontend
    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request", error);

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-type": "application/json" },
    });
  }
}


