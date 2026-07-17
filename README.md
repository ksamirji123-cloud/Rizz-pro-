# Rizz AI Pro — Netlify Edition

Same app as before (12 styles, 10 languages, favorites, history, unlimited regenerate), rewired to deploy on **Netlify** instead of Vercel.

## Deploy it (~5 minutes)

1. **Get an Anthropic API key**
   console.anthropic.com → API Keys → Create Key. Copy it.

2. **Push this folder to GitHub**
   - Extract this zip fully.
   - Create a new empty repo on github.com.
   - Upload ALL the files and folders inside `rizz-app-netlify` (not the zip itself) — `package.json`, `index.html`, `netlify.toml`, and the `src`, `netlify`, `public` folders.
   - Commit changes.

3. **Import into Netlify**
   - Go to https://app.netlify.com → sign up/login with GitHub.
   - "Add new site" → "Import an existing project" → choose GitHub → select your repo.
   - Build settings should auto-fill from `netlify.toml` (build command `npm run build`, publish folder `dist`). If not, enter them manually.

4. **Add your API key**
   - Before or after the first deploy: Site settings → **Environment variables** → Add variable
     - Key: `ANTHROPIC_API_KEY`
     - Value: (your key from step 1)
   - Redeploy if you added it after the first deploy (Deploys tab → Trigger deploy).

5. **Done**
   Netlify gives you a live link like `https://rizz-ai-yourname.netlify.app`. Open it on your phone, then use your browser's "Add to Home Screen" to get an icon that launches straight into it.

## Cost note
Each "Generate"/"Generate More" click makes one Claude API call billed to your Anthropic account — a fraction of a cent each. Hosting itself is free on Netlify's free tier.

## Customizing later
- Prompt logic / styles / languages: `netlify/functions/generate.js`
- UI, colors, layout: `src/App.jsx`
