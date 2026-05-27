import { useEffect, useState, useCallback } from "react";
import api, { API_BASE_URL } from "./api";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const loadHistory = useCallback(async () => {
    const res = await api.get(`${API_BASE_URL}/api/chat/history`);
    setMessages(res.data);
  }, []);

  const checkUser = useCallback(async () => {
    try {
      const res = await api.get(`${API_BASE_URL}/api/auth/me`);

      if (res.data) {
        setUser(res.data);
        await loadHistory();
      }
    } catch {
      setUser(null);
    }
  }, [loadHistory]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const register = async () => {
    setError("");

    try {
      await api.post(`${API_BASE_URL}/api/auth/register`, { username, password });
      alert("Registered. Now login.");
      setIsRegister(false);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  const login = async () => {
    setError("");

    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      await api.post(`${API_BASE_URL}/api/auth/login`, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        withCredentials: true,
      });

      await checkUser();
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Invalid username or password."
          : "Login failed. Check the backend URL and CORS settings."
      );
    }
  };

  const logout = async () => {
    await api.post(`${API_BASE_URL}/api/auth/logout`);
    setUser(null);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userText },
    ]);

    const res = await api.post(`${API_BASE_URL}/api/chat`, {
      message: userText,
    });

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: res.data.reply },
    ]);
  };

  if (!user) {
    return (
      <div className="auth-container">
        <h2>{isRegister ? "Register" : "Login"}</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={isRegister ? register : login}>
          {isRegister ? "Register" : "Login"}
        </button>

        {error && <p className="error">{error}</p>}

        <p onClick={() => setIsRegister(!isRegister)}>
          {isRegister
            ? "Already have account? Login"
            : "No account? Register"}
        </p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h2>AI Chat</h2>
        <p>{user.username}</p>
        <button onClick={logout}>Logout</button>
      </div>

      <div className="chat-area">
        <div className="messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <b>{msg.role === "user" ? "You" : "AI"}</b>
              <p>{msg.content}</p>
            </div>
          ))}
        </div>

        <div className="input-area">
          <input
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
