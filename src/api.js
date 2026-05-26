
import axios from "axios";

const api = axios.create({
    baseURL: "https://chat-production-5ab4.up.railway.app",withCredentials: true
});

export default api;