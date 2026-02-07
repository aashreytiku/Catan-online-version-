# 🚀 How to Put Your Game Online

## Phase 1: Deploy the Server (The Backend)
We will use **Render** (free tier).

1.  **Sign Up:** Go to [render.com](https://render.com) and sign up with GitHub.
2.  **Create Service:**
    - Click "New +" -> "Web Service".
    - Connect your `Catan-online-version-` repository.
3.  **configure:**
    - **Name:** `hex-empire-server` (or similar)
    - **Root Directory:** `server`
    - **Environment:** `Node`
    - **Build Command:** `npm install && npm run build`
    - **Start Command:** `npm start`
    - **Plans:** Select "Free".
4.  **Environment Variables** (Scroll down to "Advanced"):
    - Key: `ALLOWED_ORIGINS`
    - Value: `*` (We will change this to your game's real URL later for security, but `*` is fine for now).
5.  **Deploy:** Click "Create Web Service".
    - Wait about 2-3 minutes.
    - Copy the URL found at the top left (it looks like `https://hex-empire-server.onrender.com`). **Save this.**

---

## Phase 2: Deploy the Client (The Game UI)
We will use **Vercel** (fast & free).

1.  **Sign Up:** Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2.  **Create Project:**
    - Click "Add New..." -> "Project".
    - Import your `Catan-online-version-` repository.
3.  **Configure:**
    - **Framework Preset:** Vite (it should auto-detect this).
    - **Root Directory:** Click "Edit" and select the `client` folder.
4.  **Environment Variables:**
    - Expand "Environment Variables".
    - Key: `VITE_SERVER_URL`
    - Value: `[PASTE THE RENDER URL YOU COPIED EARLIER]` (e.g., `https://hex-empire-server.onrender.com`)
5.  **Deploy:** Click "Deploy".

## Phase 3: Play!
Vercel will give you a domain (e.g., `hex-empire.vercel.app`).
👉 **Send that link to your friends!**
