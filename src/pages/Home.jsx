import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import SettingsModal from "../components/SettingsModal";
import { exportChatToPdf } from "../utils/exportPdf";
import { exportChatToWord } from "../utils/exportWord";
import useVoice from "../hooks/useVoice";
import VoiceButton from "../components/VoiceButton";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REFERER = window.location.origin;

export default function Home({ user }) {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const { listening, startListening } = useVoice(setText);
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem("auraDark") === "true");
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [image, setImage] = useState(null);
  const [mood, setMood] = useState("Normal");

  const chatRef = useRef(null);
  const fileRef = useRef(null);

  const userName = user.displayName || "Friend";

  const detectMood = (input) => {
    const t = input.toLowerCase();

    if (t.includes("happy") || t.includes("good") || t.includes("fine") || t.includes("excited")) return "Happy";
    if (t.includes("sad") || t.includes("cry") || t.includes("hurt") || t.includes("depressed")) return "Sad";
    if (t.includes("stress") || t.includes("exam") || t.includes("worried") || t.includes("anxious") || t.includes("afraid")) return "Stressed";
    if (t.includes("angry") || t.includes("hate") || t.includes("mad")) return "Angry";
    if (t.includes("tired") || t.includes("sleepy") || t.includes("exhausted")) return "Tired";
    if (t.includes("study") || t.includes("assignment") || t.includes("project") || t.includes("research")) return "Study";
    if (t.includes("motivation") || t.includes("lazy") || t.includes("give up")) return "Motivation";
    if (t.includes("alone") || t.includes("lonely") || t.includes("miss")) return "Lonely";

    return "Normal";
  };

  const getMoodIcon = (mood) => {
    if (mood === "Happy") return "😊";
    if (mood === "Sad") return "😢";
    if (mood === "Stressed") return "😰";
    if (mood === "Angry") return "😡";
    if (mood === "Tired") return "😴";
    if (mood === "Study") return "📚";
    if (mood === "Motivation") return "💪";
    if (mood === "Lonely") return "❤️";
    return "🤔";
  };

  const getMoodInstruction = (mood) => {
    if (mood === "Happy") return "The user sounds happy. Reply with positive energy and encouragement.";
    if (mood === "Sad") return "The user sounds sad. Reply gently, supportively, and comfort them.";
    if (mood === "Stressed") return "The user sounds stressed or anxious. Reply calmly with short simple steps.";
    if (mood === "Angry") return "The user sounds angry. Reply calmly and help them relax.";
    if (mood === "Tired") return "The user sounds tired. Suggest rest, water, and small manageable tasks.";
    if (mood === "Study") return "The user is in study mode. Give structured, exam-friendly answers.";
    if (mood === "Motivation") return "The user needs motivation. Reply with encouragement and a simple action plan.";
    if (mood === "Lonely") return "The user may feel lonely. Reply like a caring companion.";
    return "Reply normally in a friendly and helpful way.";
  };

  const welcomeMessage = {
    sender: "bot",
    text: `🌸 Welcome back ${userName}!\n\nI'm AURA AI, your personal AI companion.\nHow can I help you today?`,
  };

  useEffect(() => {
    document.body.className = dark ? "dark" : "";
    localStorage.setItem("auraDark", dark);
  }, [dark]);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const loadChats = async () => {
    const q = query(collection(db, "users", user.uid, "chats"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setChats(list);

    if (list.length > 0) openChat(list[0].id);
    else createChat();
  };

  const loadChatsOnly = async () => {
    const q = query(collection(db, "users", user.uid, "chats"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);
    setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const createChat = async () => {
    const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
      title: "New Chat",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setActiveChatId(ref.id);
    setMessages([welcomeMessage]);
    await loadChatsOnly();
  };

  const openChat = async (chatId) => {
    setActiveChatId(chatId);

    const q = query(
      collection(db, "users", user.uid, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const snap = await getDocs(q);
    const loaded = snap.docs.map((d) => d.data());
    setMessages(loaded.length ? loaded : [welcomeMessage]);
  };

  const saveMessage = async (msg) => {
    if (!activeChatId) return;

    await addDoc(collection(db, "users", user.uid, "chats", activeChatId, "messages"), {
      ...msg,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "users", user.uid, "chats", activeChatId), {
      updatedAt: serverTimestamp(),
    });
  };

  const renameChat = async (chatId) => {
    const title = prompt("New chat title:");
    if (!title) return;

    await updateDoc(doc(db, "users", user.uid, "chats", chatId), {
      title,
      updatedAt: serverTimestamp(),
    });

    loadChatsOnly();
  };

  const deleteChat = async (chatId) => {
    if (!confirm("Delete this chat?")) return;

    await deleteDoc(doc(db, "users", user.uid, "chats", chatId));
    await loadChats();
  };

  const sendMessage = async (customText) => {
    const current = customText || text;
    if (!current.trim() || loading) return;

    const detectedMood = detectMood(current);
    setMood(detectedMood);

    const userMsg = { sender: "user", text: current };

    setMessages((prev) => [...prev, userMsg]);
    setText("");
    setLoading(true);
    await saveMessage(userMsg);

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": REFERER,
          "X-Title": "AURA AI",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3.1",
          messages: [
            {
              role: "system",
              content: `You are AURA AI, an Emotion-Aware Personal AI Companion.
User name is ${userName}.
Current detected mood is ${detectedMood} ${getMoodIcon(detectedMood)}.
${getMoodInstruction(detectedMood)}

Reply in simple English.
Be friendly, supportive, caring, and useful.
Use a few cute emojis only.
If the user is stressed, tired, sad, or lonely, give emotional support first and then practical help.`,
            },
            ...messages.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text,
            })),
            { role: "user", content: current },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error?.message || "API error");

      const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't understand 😢";
      const botMsg = { sender: "bot", text: reply };

      setMessages((prev) => [...prev, botMsg]);
      await saveMessage(botMsg);

      if (chats.find((c) => c.id === activeChatId)?.title === "New Chat") {
        await updateDoc(doc(db, "users", user.uid, "chats", activeChatId), {
          title: current.slice(0, 28),
        });
      }

      loadChatsOnly();
    } catch (err) {
      const errorMsg = { sender: "bot", text: "Error: " + err.message };
      setMessages((prev) => [...prev, errorMsg]);
      await saveMessage(errorMsg);
    }

    setLoading(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const sendImageMessage = async () => {
    if (!image) return alert("Please upload an image first.");
    if (loading) return;

    const imagePrompt = text || "Please describe this image.";
    const detectedMood = detectMood(imagePrompt);
    setMood(detectedMood);

    const userMsg = {
      sender: "user",
      text: "📷 Uploaded an image for analysis.",
      image,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": REFERER,
          "X-Title": "AURA AI",
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_VISION_MODEL || "openrouter/free",
          messages: [
            {
              role: "system",
              content: `You are AURA AI, an Emotion-Aware Personal AI Companion.
User name is ${userName}.
Current detected mood is ${detectedMood} ${getMoodIcon(detectedMood)}.
${getMoodInstruction(detectedMood)}

Analyze the uploaded image clearly.
Reply in simple English.
If the image is related to study, project, UI, code, or presentation, give useful feedback.
Be friendly and supportive.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: imagePrompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image,
                  },
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Image AI error");
      }

      const reply =
        `Mood detected: ${getMoodIcon(detectedMood)} ${detectedMood}\n\n` +
        (data.choices?.[0]?.message?.content || "Sorry, I couldn't analyze this image 😢");

      const botMsg = { sender: "bot", text: reply };

      setMessages((prev) => [...prev, botMsg]);
      await saveMessage(userMsg);
      await saveMessage(botMsg);

      setImage(null);
      setText("");
    } catch (err) {
      const errorMsg = { sender: "bot", text: "Image Error: " + err.message };
      setMessages((prev) => [...prev, errorMsg]);
      await saveMessage(errorMsg);
    }

    setLoading(false);
  };

  const clearCurrentChat = () => {
    setMessages([welcomeMessage]);
  };

  const filteredChats = chats.filter((c) =>
    (c.title || "New Chat").toLowerCase().includes(search.toLowerCase())
  );

  const topics = ["🎓 Study Help", "💡 Project Ideas", "🌟 Motivation", "📅 Daily Planning"];

  return (
    <div className="home-layout">
      <aside className="sidebar">
        <h2>🌸 AURA</h2>

        <button className="new-chat" onClick={createChat}>
          + New Chat
        </button>

        <input
          className="search"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="chat-list">
          {filteredChats.map((chat) => (
            <div className={chat.id === activeChatId ? "chat-card active" : "chat-card"} key={chat.id}>
              <span onClick={() => openChat(chat.id)}>{chat.title || "New Chat"}</span>
              <button onClick={() => renameChat(chat.id)}>✏️</button>
              <button onClick={() => deleteChat(chat.id)}>🗑️</button>
            </div>
          ))}
        </div>

        <button className="theme-btn" onClick={() => setDark(!dark)}>
          {dark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </aside>

      <main className="chat-container">
        <header className="chat-header">
          <div>
            <h1>🌸 AURA AI</h1>
            <p>Your Smart Personal Companion</p>

            <div className="mood-badge">
              {getMoodIcon(mood)} Mood: {mood}
            </div>
          </div>

          <div className="user-area">
            <img
              src={user.photoURL || `https://api.dicebear.com/9.x/adventurer/svg?seed=${userName}`}
              alt="profile"
            />

            <button onClick={() => setShowSettings(true)}>⚙️</button>
            <button onClick={() => signOut(auth)}>Logout</button>
          </div>
        </header>

        <div className="topic-cards">
          {topics.map((topic, index) => (
            <button key={index} onClick={() => sendMessage(topic)}>
              {topic}
            </button>
          ))}
        </div>

        <section className="chat-box" ref={chatRef}>
          {messages.map((msg, index) => (
            <div key={index} className="message-row">
              <div className={msg.sender === "user" ? "user-label" : "bot-label"}>
                {msg.sender === "user" ? "👩 You" : "🌸 AURA"}
              </div>

              <div className={msg.sender === "user" ? "user-message" : "bot-message"}>
                {msg.image && <img className="uploaded-img" src={msg.image} alt="upload" />}
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row">
              <div className="bot-label">🌸 AURA</div>
              <div className="bot-message">Typing... 💭</div>
            </div>
          )}
        </section>

        <div className="input-area">
          <VoiceButton listening={listening} startListening={startListening} />

          <button onClick={() => fileRef.current.click()}>📎</button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageSelect}
          />

          <input
            placeholder={image ? "Ask about this image..." : "Ask anything..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                image ? sendImageMessage() : sendMessage();
              }
            }}
          />

          <button onClick={image ? sendImageMessage : () => sendMessage()} disabled={loading}>
            Send
          </button>
        </div>

        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            dark={dark}
            setDark={setDark}
            exportPdf={() => exportChatToPdf(messages)}
            exportWord={() => exportChatToWord(messages)}
            clearChat={clearCurrentChat}
          />
        )}
      </main>
    </div>
  );
}