import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PresenceUser {
  userId: string;
  name: string;
  onlineAt: string;
}

export function usePresence(channelName: string) {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user || !profile || !channelName) return;

    const channel = supabase.channel(`presence:${channelName}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        Object.entries(state).forEach(([, presences]) => {
          const p = (presences as any[])[0];
          if (p?.userId !== user.id) {
            users.push({ userId: p.userId, name: p.name, onlineAt: p.onlineAt });
          }
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: user.id,
            name: profile.name,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.name, channelName]);

  return onlineUsers;
}
