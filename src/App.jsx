import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      text: "Hi! I'm your Baby Girl AI 😊",
      sender: "bot",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const currentMessage = message;

    setMessages((prev) => [
      ...prev,
      { text: currentMessage, sender: "user" },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Baby Girl Chatbot",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3.1",
            messages: [
              {
                role: "system",
                content:
                  "You are a cute, friendly, supportive AI chatbot. Reply in simple English with a few cute emojis.",
              },
              {
                role: "user",
                content: currentMessage,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "API request failed");
      }

      const reply =
        data.choices?.[0]?.message?.content ||
        "Sorry baby, I could not understand that 😢";

      setMessages((prev) => [
        ...prev,
        { text: reply, sender: "bot" },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          text: "Error: " + error.message,
          sender: "bot",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <div className="chat-container">
        <h1>💖 Baby Girl Chatbot</h1>

        <div className="chat-box">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={
                msg.sender === "user" ? "user-message" : "bot-message"
              }
            >
              {msg.text}
            </div>
          ))}

          {loading && <div className="bot-message">Typing... 💭</div>}
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />

          <button onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;