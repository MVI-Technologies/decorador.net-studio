import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getStoredToken } from "@/lib/api";
import type { NewMessagePayload } from "@/types/api";
import { toast } from "sonner";

const getSocketBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";
  try {
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:3000";
  }
};

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    const base = getSocketBaseUrl();
    const token = getStoredToken();
    socket = io(`${base}/chat`, {
      path: "/socket.io",
      transports: ["websocket"],
      ...(token ? { auth: { token } } : {}),
    });
  }
  return socket;
}

export function useSocketChat(projectId: string | null, userId: string | null) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!projectId || !userId) return;
    const s = getSocket();
    socketRef.current = s;
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("exception", (err: { message?: string }) => {
      if (err?.message) toast.error(err.message);
    });
    s.emit("joinProject", { projectId });
    return () => {
      s.off("connect");
      s.off("disconnect");
      s.off("exception");
    };
  }, [projectId, userId]);

  const sendMessage = (content: string, fileUrl?: string, fileStoragePath?: string) => {
    if (!projectId || !userId || !socketRef.current) return;
    socketRef.current.emit("sendMessage", {
      projectId,
      senderId: userId,
      content,
      ...(fileUrl != null && { fileUrl }),
      ...(fileStoragePath != null && { fileStoragePath }),
    });
  };

  /** Ouvir newMessage e dar append no cache/estado; usar payload.id para não duplicar. */
  const subscribeNewMessage = (cb: (payload: NewMessagePayload) => void) => {
    const s = socketRef.current ?? getSocket();
    s.on("newMessage", cb);
    return () => s.off("newMessage", cb);
  };

  return { connected, sendMessage, subscribeNewMessage, socket: socketRef.current };
}
