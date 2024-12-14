"use client";

import { AppInitialProps } from "next/app";
import { useState } from "react";

interface ChatMessage{

  role: "system" | "user" | "assistant";
  content: string

}
export default function Home() {
  //intially no message
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [resetTime, setResetTime] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const [messageHistory, setMessageHistory] = useState<ChatMessage[]>([
    { role: "assistant", content: "How can I help you today?" },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    //if there is no message
    if (!message.trim()) return;

    //create message object, as const treats user as a literal type
    const userMessage = { role: "user" as const, content: message };

    //update messageHistory, creates a new array, spreads previous messages into array and
    //adds userMessage at the end
    setMessageHistory(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true); //loading in message

    //fetch from the backend

    try {
      //fetch used on the client side
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        //json string format,passing the message in the body
        body: JSON.stringify({ message }),
      });
      if (response.status === 429) {
        const resetHeader = response.headers.get("X-RateLimit-Reset");
        setIsRateLimited(true);

        const resetTimeMilliseconds = resetHeader
          ? parseInt(resetHeader, 10) * 1000
          : null;

        if (resetTimeMilliseconds) {
          const resetTimeSeconds = Math.ceil(
            (resetTimeMilliseconds - Date.now()) / 1000
          );
          setResetTime(resetTimeSeconds);
        }
      } else {
        setIsRateLimited(false);
      }

      //updates the chat history with ai response
      if (response.ok) {
        const llmResponseText = await response.json(); //parses the data

        console.log(llmResponseText.response);

        const llmResponse = {
          role: "assistant" as const,
          content: llmResponseText.response,
        };
        setMessageHistory(prev => [...prev, llmResponse]);
      } else {
        console.error("Error:", response.status, response.statusText);
      }

      //add response from llm to the messageHistory
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/*header */}
      <div className="w-full bg-lightCyan border-b border-lightCyan p-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl font-semibold text-white">Chat</h1>
        </div>
      </div>

      {/*Messages Container */}
      <div className="flex-1 overflow-y-auto pb-32 pt-4">
        <div className="max-w-3xl mx-auto px-4">
          {messageHistory.map((msg, index) => (
            <div
              key={index}
              // starts the messages on the left if from the ai and right if from the user
              className={`flex gap-4 mb-4 ${msg.role === "assistant" ? "justify-start" : "justify-end flex-row-reverse"}`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.role === "assistant" ? "bg-lightCyan border border-lightCyan text-gray-100" : "bg-userBlue text-black ml-auto"}`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c.79 0 1.5-.71 1.5-1.5S8.79 9 8 9s-1.5.71-1.5 1.5S7.21 11 8 11zm8 0c.79 0 1.5-.71 1.5-1.5S16.79 9 16 9s-1.5.71-1.5 1.5.71 1.5 1.5 1.5zm-4 4c2.21 0 4-1.79 4-4h-8c0 2.21 1.79 4 4 4z" />
                </svg>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-gray-800 border border-gray-700 text-gray-100">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          {isRateLimited && (
            <div>
              <p>
                You have exceeded the rate limit. Please wait {resetTime} before
                sending another message
              </p>
            </div>
          )}
        </div>
      </div>

      {/*Input Area */}
      <div className="fixed bottom-0 w-full bg-white border-t border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={e => e.key === "Enter" && handleSend()}
              placeholder="Type your Message"
              className="flex-1 rounded-xl border border-gray-700 bg-white px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-400"
            />

            <button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-lightCyan text-white px-5 py-3 rounded-xl hover:bg-cyan-200 transition-all disabled:bg-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
