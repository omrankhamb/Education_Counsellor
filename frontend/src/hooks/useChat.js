import { useState, useEffect } from "react";

const API_BASE = "/api";

export function useChat(studentProfile) {
  const defaultGreeting = {
    role: "model",
    content: `🎓 **Hello ${studentProfile?.name || "Student"}!** I'm your AI Education Counselor.\n\nI can help you with:\n• **College recommendations** based on your marks (${studentProfile?.marks || "--"} in ${studentProfile?.stream || "your stream"})\n• **Cutoff marks & merit lists** for Indian institutes\n• **Branch comparison & placements** (CSE, AI/ML, ECE, MBBS, Design, etc.)\n• **Entrance exams & scholarships**\n\nWhat would you like to know today?`,
  };

  const [messages, setMessages] = useState([defaultGreeting]);
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState([
    "Best college for my marks?",
    "What career options do I have?",
    "Scholarship opportunities for me?",
  ]);

  // Read logged in user if available
  const getUserId = () => {
    if (studentProfile?.user_id) return studentProfile.user_id;
    try {
      const u = localStorage.getItem("edu_user");
      return u ? JSON.parse(u)?.id : null;
    } catch {
      return null;
    }
  };

  // Load chat history from MongoDB on mount
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/chat/history/${userId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.history) && data.history.length > 0) {
          setMessages(data.history);
        }
      } catch (err) {
        console.warn("[MongoDB] Could not load chat history:", err);
      }
    };

    fetchHistory();
  }, [studentProfile?.name]);

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim() || loading) return;

    const userId = getUserId();
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout safeguard

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          student_profile: studentProfile,
          history: newMessages.slice(0, -1),
          user_id: userId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.response) {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: data.response },
        ]);
        if (data.follow_up_questions?.length > 0) {
          setFollowUps(data.follow_up_questions);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: data.response || "I could not find information on that topic right now. Please try asking in another way!",
          },
        ]);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const isTimeout = error.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: isTimeout
            ? "⏱️ The AI request took too long. Please try asking again!"
            : "❌ Could not connect to the backend server. Please verify the backend is running at http://localhost:8000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    const userId = getUserId();
    if (userId) {
      try {
        await fetch(`${API_BASE}/chat/history/${userId}`, { method: "DELETE" });
      } catch (err) {
        console.warn("[MongoDB] Error clearing chat history:", err);
      }
    }
    setMessages([
      {
        role: "model",
        content: `🎓 Chat cleared! I'm ready to help you, ${studentProfile?.name || "Student"}. Ask me anything about colleges, cutoffs, or career paths!`,
      },
    ]);
  };

  return { messages, loading, followUps, sendMessage, clearChat };
}
