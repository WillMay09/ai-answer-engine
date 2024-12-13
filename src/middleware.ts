// TODO: Implement the code here to add rate limiting with Redis
// Refer to the Next.js Docs: https://nextjs.org/docs/app/building-your-application/routing/middleware
// Refer to Redis docs on Rate Limiting: https://upstash.com/docs/redis/sdks/ratelimit-ts/algorithms

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import {v4 as uuidv4} from "uuid";

//create a redit client instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

//rate limiter setup
const rateLimit = new Ratelimit({
  redis: redis,
  //only 10 requests per minute
  limiter: Ratelimit.slidingWindow(4, "60 s"),
  //stores analytics in redis
  analytics: true,
});

export async function middleware(request: NextRequest) {
  try {
    //checks for a session cookie
    let sessionId = request.cookies.get("session_id")?.value;
    //
    //const { success, limit, reset, remaining } = await rateLimit.limit(ip);
    if(!sessionId){
      //generates a session id if the user does not contain one
      sessionId= uuidv4()
      const response = NextResponse.next();
      console.log("sessionId:", sessionId);
      response.cookies.set("session_id", sessionId, {maxAge: 30*24*60*60})
      return response // returns response after immediately setting the cookie

    }
    
    //ratelimit object fields updated based on session information, used for headers
    const { success, limit, reset, remaining } = await rateLimit.limit(sessionId);
    const response = success
      ? NextResponse.next()
      : NextResponse.json({ error: "Too Many Requests" }, { status: 429 });

      response.headers.set('X-RateLimit-Limit', limit.toString())
      response.headers.set("X-RateLimit-Remaining", remaining.toString())
      response.headers.set('X-RateLimit-Reset', reset.toString())
      console.log(response)
      return response
      
  } catch (error) {
    console.error("Error in middleware")
    return NextResponse.next()
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
