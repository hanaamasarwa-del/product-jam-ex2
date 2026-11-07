# 3. Sign in with Google

Email and password already works. This page adds the "Continue with Google"
button.

It is the most fiddly step in the whole setup, because **three different URLs**
are involved and they are easy to mix up. Get them from the table below rather
than guessing.

You can skip this page and come back later. Nothing else depends on it.

## The three URLs

Everywhere below, replace `YOUR-REF` with your Supabase project ref - the part
before `.supabase.co` in your project URL.

| #   | Where you paste it                                                | What to paste                                                      |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Google Cloud Console → Authorised **redirect URI**                | `https://YOUR-REF.supabase.co/auth/v1/callback`                    |
| 2   | Supabase → Authentication → URL Configuration → **Site URL**      | your deployed address, or `http://localhost:3000` for now          |
| 3   | Supabase → Authentication → URL Configuration → **Redirect URLs** | `http://localhost:3000/**` and later your deployed address + `/**` |

**The single most common mistake** is putting your own app's address into row 1.
Google never sends the user back to your app - it sends them to Supabase, and
Supabase sends them to you. Row 1 is always a `supabase.co` address.

## Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign
   in.
2. Create a project, top left. Name it after your app.
3. In the search bar, find **Google Auth Platform** and open it.
4. Fill in the **Branding** page: app name, your email. This is what users see
   on the consent screen, so use the organisation's name.
5. Under **Audience**, set the user type to **External**.
6. Still under Audience, press **Publish app**. If you leave it in "Testing",
   only accounts you add by hand can log in - which looks exactly like a broken
   login to everyone else.
7. Go to **Clients** → **Create client**.
   - Application type: **Web application**
   - Authorised redirect URIs: **add URL 1 from the table above**
8. Press Create. Copy the **Client ID** and **Client secret**.

## Supabase

1. In your Supabase project: **Authentication** → **Sign In / Providers**.
2. Find **Google** and enable it.
3. Paste the Client ID and Client secret from Google. Save.
4. Go to **Authentication** → **URL Configuration**.
   - **Site URL**: URL 2 from the table.
   - **Redirect URLs**: add URL 3. Use `/**` at the end - it means "any page on
     this site", which lets the login return to wherever the user started.

## Try it

```bash
npm run dev
```

Open http://localhost:3000/signin and press **Continue with Google**. You should
go to Google, pick an account, and land back on your home page logged in.

## When it does not work

| What you see                                        | Almost always                                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Error 400: redirect_uri_mismatch`                  | URL 1 is wrong. It must be the `supabase.co` callback, exactly.                                                  |
| `Access blocked: … has not completed verification`  | The app is still in Testing. Publish it (step 6), or add yourself as a test user.                                |
| `Unsupported provider` or `provider is not enabled` | Google is not switched on in Supabase, or the save did not take.                                                 |
| Login works, but you land on the wrong site         | URL 2 or 3. Supabase falls back to the Site URL when the address you asked for is not in the Redirect URLs list. |
| Works locally, fails once deployed                  | You never added the deployed address to URLs 2 and 3. See [4. Deploy](04-deploy.md).                             |

## Next

[4. Putting it on the internet](04-deploy.md).
