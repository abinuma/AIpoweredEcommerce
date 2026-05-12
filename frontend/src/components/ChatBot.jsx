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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 300);
    }
  }, [isOpen]);

  // Load history when session exists and panel opens
  useEffect(() => {
    if (isOpen && sessionId && messages.length === 0) {
      loadHistory();
    }
  }, [isOpen, sessionId]);

  const createSession = async () => {
    try {
      const res = await axios.get(
        backendUrl + `/api/chatbot/${sessionId}/history`,
        {
          headers: {
            token,
          },
        },
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
      );
      if (res.data.success && res.data.messages.length > 0) {
        setMessages(
          res.data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            products: [],
          })),
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
      // Session might be invalid, create new one
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
    // setMessages((prev) => [
    //   ...prev,
    //   { role: "user", content: userMsg, products: [] },
    // ]);
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
        { headers: { token } },
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

  // Styles
  const bubbleStyle = {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
    zIndex: 9999,
    transition: "transform 0.2s, box-shadow 0.2s",
    fontSize: "24px",
  };

  const panelStyle = {
    position: "fixed",
    bottom: "90px",
    right: "24px",
    width: "380px",
    maxWidth: "calc(100vw - 48px)",
    height: "520px",
    maxHeight: "calc(100vh - 120px)",
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 9999,
    animation: "chatSlideUp 0.3s ease-out",
  };

  const mobilePanel =
    window.innerWidth < 640
      ? {
          ...panelStyle,
          bottom: 0,
          right: 0,
          width: "100vw",
          height: "100vh",
          maxWidth: "100vw",
          maxHeight: "100vh",
          borderRadius: 0,
        }
      : panelStyle;

  return (
    <>
      {/* CSS animation */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-4px); }
        }
        .chat-bubble-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.3); }
      `}</style>

      {/* Floating Bubble */}
      {!isOpen && (
        <button
          className="chat-bubble-btn"
          style={bubbleStyle}
          onClick={handleOpen}
          title="AI Shopping Assistant"
        >
          ✦
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div style={mobilePanel}>
          {/* Header */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              color: "white",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>✦</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: "15px", margin: 0 }}>
                  AI Shopping Assistant
                </p>
                <p style={{ fontSize: "11px", opacity: 0.7, margin: 0 }}>
                  Powered by Gemini
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                try {
                  await axios.delete(backendUrl + `/api/chatbot/${sessionId}`, {
                    headers: {
                      token,
                    },
                  });

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
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                padding: "6px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                marginRight: "8px",
                fontSize: "12px",
              }}
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "20px",
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: "6px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "#f8f9fa",
            }}
          >
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius:
                        msg.role === "user"
                          ? "14px 14px 4px 14px"
                          : "14px 14px 14px 4px",
                      background: msg.role === "user" ? "#1a1a2e" : "white",
                      color: msg.role === "user" ? "white" : "#333",
                      fontSize: "13.5px",
                      lineHeight: "1.5",
                      boxShadow:
                        msg.role === "user"
                          ? "none"
                          : "0 1px 4px rgba(0,0,0,0.06)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>

                {/* Product suggestions */}
                {msg.products && msg.products.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginTop: "8px",
                      overflowX: "auto",
                      paddingBottom: "4px",
                    }}
                  >
                    {msg.products.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => {
                          navigate(`/product/${p._id}`);
                          setIsOpen(false);
                        }}
                        style={{
                          minWidth: "140px",
                          background: "white",
                          borderRadius: "10px",
                          padding: "8px",
                          cursor: "pointer",
                          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                          transition: "transform 0.15s",
                          flexShrink: 0,
                        }}
                      >
                        {p.image && (
                          <img
                            src={Array.isArray(p.image) ? p.image[0] : p.image}
                            alt={p.name}
                            style={{
                              width: "100%",
                              height: "80px",
                              objectFit: "cover",
                              borderRadius: "6px",
                            }}
                          />
                        )}
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            marginTop: "6px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.name}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#0f3460",
                            fontWeight: 700,
                          }}
                        >
                          {currency}
                          {p.price}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    background: "white",
                    padding: "12px 18px",
                    borderRadius: "14px 14px 14px 4px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    display: "flex",
                    gap: "5px",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: "#999",
                        display: "inline-block",
                        animation: `typingDot 1.4s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid #eee",
              display: "flex",
              gap: "8px",
              background: "white",
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about products..."
              disabled={isLoading}
              style={{
                flex: 1,
                border: "1px solid #ddd",
                borderRadius: "24px",
                padding: "10px 16px",
                fontSize: "13.5px",
                outline: "none",
                background: "#f8f9fa",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                border: "none",
                background: isLoading || !input.trim() ? "#ccc" : "#1a1a2e",
                color: "white",
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
