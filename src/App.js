import { useEffect, useState, useCallback } from "react";
import api from "./api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  // Load chat history
  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get("/api/chat/history");
      setMessages(res.data);
    } catch (err) {
      console.log("Failed to load history");
    }
  }, []);

  // Check logged in user
  const checkUser = useCallback(async () => {
    try {
      const res = await api.get("/api/auth/me");

      if (res.data) {
        setUser(res.data);
        await loadHistory();
      }
    } catch (err) {
      setUser(null);
    }
  }, [loadHistory]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // Register
  const register = async () => {
    setError("");

    try {
      await api.post("/api/auth/register", {
        username,
        password,
      });

      alert("Registered successfully. Please login.");
      setIsRegister(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed."
      );
    }
  };

  // Login
  const login = async () => {
    setError("");

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      await api.post("/api/auth/login", formData, {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      });

      await checkUser();
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Invalid username or password."
          : "Login failed. Check backend URL and CORS."
      );
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.log("Logout failed");
    }

    setUser(null);
    setMessages([]);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");

    // Show user message immediately
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userText,
      },
    ]);

    try {
      const res = await api.post("/api/chat", {
        message: userText,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.reply,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error getting response.",
        },
      ]);
    }
  };

  // Login/Register UI
  if (!user) {
    return (
      <div className="auth-container">
        <h2>{isRegister ? "Register" : "Login"}</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          onClick={
            isRegister ? register : login
          }
        >
          {isRegister ? "Register" : "Login"}
        </button>

        {error && (
          <p className="error">{error}</p>
        )}

        <p
          onClick={() =>
            setIsRegister(!isRegister)
          }
        >
          {isRegister
            ? "Already have account? Login"
            : "No account? Register"}
        </p>
      </div>
    );
  }

  // Chat UI
  return (
    <div className="app">
      <div className="sidebar">
        <h2>AI Chat</h2>

        <p>{user.username}</p>

        <button onClick={logout}>
          Logout
        </button>
      </div>

      <div className="chat-area">
        <div className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.role}`}
            >
              <b>
                {msg.role === "user"
                  ? "You"
                  : "AI"}
              </b>

              <p>{msg.content}</p>
            </div>
          ))}
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              sendMessage()
            }
          />

          <button onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;