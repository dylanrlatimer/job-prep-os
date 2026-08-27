// TODO: Setup OAuth

The minimal mandatory steps for working auth in this template:

1. Deactivate mandatory Supabase email confirmation
2. Setup Google auth

- Create project in Google Cloud
- Go to **Google Auth Platform > Clients**, do basic setup
- Create OAuth client
- **Authorized JavaScript origins:** `http://localhost:3000`, and your production URL
- **Authorized redirect URIs:**
  - `http://127.0.0.1:54321/auth/v1/callback` (local Supabase)
  - `https://<project-ref>.supabase.co/auth/v1/callback` (production)
- Save the **Client ID** and **Client Secret**
- Paste into Supabase Google auth settings in web dashboard
