'use client';

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Signin from "./components/Signin";
import { supabase } from "./supabase/initialize";
import BookmarkManager from "./components/BookmarkManager";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!error) {
        setUser(data.user ?? null);
      }

      setLoading(false);
    };

    getCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
        <div className="animate-pulse text-sm text-zinc-400">
          Loading your Smart Bookmarks...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-50">
      {user ? <BookmarkManager user={user} /> : <Signin />}
    </main>
  );
}
