import { useState, useRef, useEffect, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ChatBot = () => {
  const { backendUrl, currency } = useContext(ShopContext);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const token = localStorage.getItem("token");

  // Load or create session
  useEffect(() => {
    const saved = localStorage.getItem("chatbot_session_id");
    if (saved) setSessionId(saved);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [isOpen]);

  // Load history
  useEffect(() => {
    if (isOpen && sessionId && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen, sessionId]);

  const createSession = async () => {
    try {
      const res = await axios.post(
        backendUrl + `/api/chatbot/history/session`,
        {},
        {
          headers: {
            token,
          },
        }
      );

      const id = res.data.sessionId;

      localStorage.setItem("chatbot_session_id", id);
      setSessionId(id);

      return id;
    } catch (error) {
      console.log(error);
      console.log(error.response?.data);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(
        backendUrl + `/api/chatbot/${sessionId}/history`,
        { headers: { token } }
      );

      if (res.data.success && res.data.messages.length > 0) {
        setMessages(
          res.data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            products: [],
          }))
        );
      } else if (res.data.messages.length === 0) {
        setMessages([
          {
            role: "assistant",
            content:
              "Hi! 👋 I'm your AI shopping assistant. Ask me anything about our products — I can help you find the perfect item!",
            products: [],
          },
        ]);
      }
    } catch {
      localStorage.removeItem("chatbot_session_id");

      setSessionId(null);

      setMessages([
        {
          role: "assistant",
          content:
            "Hi! 👋 I'm your AI shopping assistant. Ask me anything about our products!",
          products: [],
        },
      ]);
    }
  };

  const handleOpen = async () => {
    setIsOpen(true);

    if (!sessionId) {
      const newId = await createSession();

      if (newId) {
        setMessages([
          {
            role: "assistant",
            content:
              "Hi! 👋 I'm your AI shopping assistant. Ask me anything about our products — I can help you find the perfect item!",
            products: [],
          },
        ]);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();

    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        id: "temp-user-" + Date.now(),
        role: "user",
        content: userMsg,
        products: [],
      },
    ]);

    setIsLoading(true);

    try {
      let sid = sessionId;

      if (!sid) {
        sid = await createSession();

        if (!sid) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Sorry, I couldn't connect. Please try again.",
              products: [],
            },
          ]);

          setIsLoading(false);
          return;
        }
      }

      const res = await axios.post(
        backendUrl + `/api/chatbot/${sid}/message`,
        {
          message: userMsg,
        },
        { headers: { token } }
      );

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: res.data.assistantMessageId,
            role: "assistant",
            content: res.data.reply,
            products: res.data.suggestedProducts || [],
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
            products: [],
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that. Please try again.",
          products: [],
        },
      ]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          title="AI Shopping Assistant"
          className="fixed bottom-6 right-6 z-[9999] flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-700 text-2xl text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/30"
        >
          ✦
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="
            fixed z-[9999] flex flex-col overflow-hidden
            bg-white shadow-2xl border border-gray-200
            sm:bottom-6 sm:right-6 sm:h-[620px] sm:w-[420px] sm:rounded-3xl
            bottom-0 right-0 h-screen w-screen rounded-none
            animate-[fadeIn_.25s_ease]
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <span className="text-lg">✦</span>
              </div>

              <div>
                <h2 className="text-sm font-semibold tracking-wide">
                  AI Shopping Assistant
                </h2>
                <p className="text-xs text-gray-300">
                  Powered by Gemini AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    await axios.delete(
                      backendUrl + `/api/chatbot/${sessionId}`,
                      {
                        headers: {
                          token,
                        },
                      }
                    );

                    localStorage.removeItem("chatbot_session_id");

                    setSessionId(null);

                    setMessages([
                      {
                        role: "assistant",
                        content: "Chat cleared successfully.",
                        products: [],
                      },
                    ]);
                  } catch (error) {
                    console.log(error);
                  }
                }}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20"
              >
                Clear
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-lg transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 px-4 py-5">
            {messages.map((msg, i) => (
              <div key={i}>
                {/* Message Bubble */}
                <div
                  className={`flex ${
                    msg.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm
                      ${
                        msg.role === "user"
                          ? "rounded-br-md bg-gradient-to-r from-slate-900 to-blue-900 text-white"
                          : "rounded-bl-md border border-gray-100 bg-white text-gray-800"
                      }
                    `}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Products */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                    {msg.products.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => {
                          navigate(`/product/${p._id}`);
                          setIsOpen(false);
                        }}
                        className="min-w-[170px] cursor-pointer rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >
                        {p.image && (
                          <img
                            src={Array.isArray(p.image) ? p.image[0] : p.image}
                            alt={p.name}
                            className="h-32 w-full rounded-xl object-cover"
                          />
                        )}

                        <div className="mt-3">
                          <p className="truncate text-sm font-semibold text-gray-800">
                            {p.name}
                          </p>

                          <p className="mt-1 text-sm font-bold text-indigo-700">
                            {currency}
                            {p.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-gray-100 bg-white px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]"></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about products..."
                disabled={isLoading}
                className="
                  flex-1 rounded-full border border-gray-300
                  bg-gray-100 px-5 py-3 text-sm text-gray-800
                  outline-none transition-all duration-200
                  placeholder:text-gray-400
                  focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100
                "
              />

              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className={`
                  flex h-12 w-12 items-center justify-center rounded-full
                  text-lg text-white transition-all duration-200
                  ${
                    isLoading || !input.trim()
                      ? "cursor-not-allowed bg-gray-300"
                      : "bg-gradient-to-r from-slate-900 to-indigo-700 hover:scale-105 hover:shadow-lg"
                  }
                `}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;