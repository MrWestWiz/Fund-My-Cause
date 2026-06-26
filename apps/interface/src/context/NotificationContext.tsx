"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

export type NotificationType =
  | "contribution"
  | "goal_reached"
  | "deadline"
  | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  campaignId?: string;
  timestamp: number;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const STORAGE_KEY = "fmc:notifications";

function load(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(notifications: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
}

function loadPrefs(): Record<NotificationType, boolean> {
  try {
    const raw = localStorage.getItem("fmc:notif-prefs");
    if (!raw)
      return {
        contribution: true,
        goal_reached: true,
        deadline: true,
        info: true,
      };
    const parsed = JSON.parse(raw);
    return (
      parsed?.categories ?? {
        contribution: true,
        goal_reached: true,
        deadline: true,
        info: true,
      }
    );
  } catch {
    return {
      contribution: true,
      goal_reached: true,
      deadline: true,
      info: true,
    };
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(load());
  }, []);

  const update = useCallback((next: Notification[]) => {
    setNotifications(next);
    save(next);
  }, []);

  const addNotification = useCallback(
    (n: Omit<Notification, "id" | "timestamp" | "read">) => {
      // Respect in-app category preferences
      const cats = loadPrefs();
      if (cats[n.type] === false) return;

      const entry: Notification = {
        ...n,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
        read: false,
      };
      setNotifications((prev) => {
        const next = [entry, ...prev].slice(0, 50);
        save(next);
        return next;
      });
    },
    [],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      save(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => update([]), [update]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
}
