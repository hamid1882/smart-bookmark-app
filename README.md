## Smart Bookmark App

Build and deploy a simple bookmark manager using **Next.js App Router**, **Supabase (Auth, Database, Realtime)** and **Tailwind CSS**.

### Features

- **Google sign-in only** via Supabase OAuth.
- **Add bookmarks** with URL + title.
- **Per-user privacy** – each row is tied to the authenticated user, and queries are filtered by that user.
- **Realtime syncing** – open the app in two tabs and watch bookmarks update live.
- **Delete bookmarks** – users can remove only their own rows.

### Local Setup

1. **Install dependencies**

   ```bash
   pnpm install
   # or
   npm install
   ```

2. **Create a Supabase project**
   - Go to the Supabase dashboard and create a new project.
   - Under **Authentication → Providers**, enable **Google** and configure the OAuth client.

3. **Database schema**

   Run this SQL in the Supabase SQL editor:

   ```sql
   create table if not exists public.bookmarks (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     user_id uuid not null references auth.users(id) on delete cascade,
     title text not null,
     url text not null
   );

   alter table public.bookmarks enable row level security;

   create policy "Users can see their own bookmarks"
     on public.bookmarks
     for select
     using (auth.uid() = user_id);

   create policy "Users can insert their own bookmarks"
     on public.bookmarks
     for insert
     with check (auth.uid() = user_id);

   create policy "Users can delete their own bookmarks"
     on public.bookmarks
     for delete
     using (auth.uid() = user_id);
   ```

4. **Enable Realtime on the table**
   - In Supabase, go to **Database → Replication (Realtime)** and enable Realtime for the `bookmarks` table.

5. **Environment variables**

   Create a `.env.local` file in the project root:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

6. **Run the dev server**

   ```bash
   pnpm dev
   # or
   npm run dev
   ```

   Open `http://localhost:3000` and sign in with Google.

### Vercel Deployment

1. Push this repo to GitHub.
2. Import the project into Vercel.
3. In the Vercel project settings, add the same environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Trigger a deploy; once it completes, use the live URL for testing.

### Notes

- All Supabase calls are made from client components using `@supabase/supabase-js` and the singleton client in `app/supabase/initialize.ts`.
- The home page handles authentication state with `supabase.auth.getUser()` and `onAuthStateChange`, then renders either the Google sign-in card or the realtime bookmark manager.

### Problems I faced and how I solved them

- **Google provider not enabled**: After wiring up `signInWithOAuth`, Supabase returned `Unsupported provider: provider is not enabled`. I fixed this by enabling the Google provider in the Supabase dashboard, configuring the correct OAuth redirect URL, and saving the client ID/secret.
- **Bookmarks failing to save**: Inserts to `bookmarks` failed with a generic error. The root cause was missing table and row-level security (RLS) policies. I created the `bookmarks` table, enabled RLS, and added select/insert/delete policies that tie rows to `auth.uid()`, which made saving and loading per-user bookmarks work.
- **Realtime not triggering across tabs**: Initially, new bookmarks didn’t appear in a second tab. I had to explicitly enable Realtime on the `bookmarks` table in Supabase and subscribe to `postgres_changes` filtered by `user_id` on the client. After that, inserts/deletes propagated instantly between sessions.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
