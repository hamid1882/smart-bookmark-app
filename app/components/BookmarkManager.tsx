import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase/initialize";

type Bookmark = {
  id: string;
  url: string;
  title: string;
  created_at: string;
};

type BookmarkManagerProps = {
  user: User;
};

function normalizeUrl(raw: string) {
  if (!raw.trim()) return "";
  try {
    // If user forgot protocol, assume https
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    return url.toString();
  } catch {
    return raw.trim();
  }
}

function BookmarkManager({ user }: BookmarkManagerProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const displayName = useMemo(
    () => user.user_metadata?.full_name || user.email || "Anonymous user",
    [user],
  );

  useEffect(() => {
    const loadBookmarks = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setError("Failed to load bookmarks. Please try again.");
      } else {
        setBookmarks(data as Bookmark[]);
      }

      setLoading(false);
    };

    loadBookmarks();

    const channel = supabase
      .channel("realtime:bookmarks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setBookmarks((prev) => [
              payload.new as Bookmark,
              ...prev.filter((b) => b.id !== (payload.new as Bookmark).id),
            ]);
          }

          if (payload.eventType === "DELETE") {
            setBookmarks((prev) =>
              prev.filter((b) => b.id !== (payload.old as Bookmark).id),
            );
          }

          if (payload.eventType === "UPDATE") {
            setBookmarks((prev) =>
              prev.map((b) =>
                b.id === (payload.new as Bookmark).id
                  ? (payload.new as Bookmark)
                  : b,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const handleAddBookmark = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const normalizedUrl = normalizeUrl(url);

    if (!trimmedTitle || !normalizedUrl) {
      setError("Please provide both a title and a valid URL.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        title: trimmedTitle,
        url: normalizedUrl,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      setError("Could not save bookmark. Please try again.");
    } else if (data) {
      setBookmarks((prev) => [data as Bookmark, ...prev]);
      setTitle("");
      setUrl("");
    }

    setSubmitting(false);
  };

  const handleDeleteBookmark = async (id: string) => {
    setError(null);

    const previous = bookmarks;
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      setError("Failed to delete bookmark. Restoring previous state.");
      setBookmarks(previous);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="w-full max-w-3xl space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/60 backdrop-blur-md md:p-8">
      <header className="flex flex-col gap-4 border-b border-zinc-800 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Smart Bookmark App
          </p>
          <h1 className="mt-1 text-xl font-semibold text-zinc-50 md:text-2xl">
            Your personal realtime reading list
          </h1>
          <p className="mt-1 text-xs text-zinc-400 md:text-sm">
            Signed in as <span className="font-medium">{displayName}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800/70"
        >
          Sign out
        </button>
      </header>

      <section aria-label="Add bookmark" className="space-y-3">
        <form
          onSubmit={handleAddBookmark}
          className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]"
        >
          <input
            type="text"
            name="title"
            placeholder="Link title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-10 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 text-sm text-zinc-50 outline-none ring-emerald-500/60 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-2"
          />
          <input
            type="url"
            name="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="h-10 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 text-sm text-zinc-50 outline-none ring-emerald-500/60 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Add"}
          </button>
        </form>
        {error && (
          <p className="text-xs text-rose-400" role="alert">
            {error}
          </p>
        )}
      </section>

      <section
        aria-label="Your bookmarks"
        className="mt-2 max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-zinc-800/70 bg-zinc-950/40 p-3"
      >
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800/70" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800/70" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800/70" />
          </div>
        ) : bookmarks.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No bookmarks yet. Drop in a link above to get started ✨
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.id}
                className="group flex items-start justify-between gap-3 rounded-xl bg-zinc-900/70 px-3 py-2.5 transition hover:bg-zinc-800/70"
              >
                <div className="min-w-0">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-1 font-medium text-zinc-50 hover:underline"
                  >
                    {bookmark.title}
                  </a>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-400">
                    {bookmark.url}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteBookmark(bookmark.id)}
                  className="mt-0.5 inline-flex shrink-0 items-center rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-300 opacity-0 transition group-hover:opacity-100 hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-zinc-500">
        Bookmarks are{" "}
        <span className="font-semibold text-zinc-300">private to your user</span>{" "}
        — other accounts cannot see them. Open this page in another tab to see
        realtime updates as you add or delete links.
      </p>
    </div>
  );
}

export default BookmarkManager;

