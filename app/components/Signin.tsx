import { supabase } from "../supabase/initialize";

function Signin() {
  const handleGoogleSignin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur">
      <div className="mb-6 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Smart Bookmark App
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">
          Sign in with Google
        </h1>
        <p className="text-sm text-zinc-400">
          Save links that matter, and we’ll keep them in sync across your
          sessions in real time.
        </p>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignin}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        <span>Continue with Google</span>
      </button>

      <p className="mt-4 text-center text-xs text-zinc-500">
        We only use your Google account for authentication. No passwords to
        remember.
      </p>
    </div>
  );
}

export default Signin;