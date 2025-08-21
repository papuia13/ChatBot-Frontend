# Wizard AI – Chatbot Frontend

## Project info

This repository contains the Wizard AI chatbot frontend built with Vite + React + TypeScript + Tailwind + shadcn-ui, integrating with Nhost/Hasura and n8n.

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deploying to Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Environment variables (Site settings → Build & deploy → Environment):
   - `VITE_NHOST_SUBDOMAIN=your-nhost-subdomain`
   - `VITE_NHOST_REGION=your-nhost-region`
4. Deploy: Connect this repo to Netlify and trigger a deploy, or drag-and-drop the `dist` folder in the Netlify UI.

After deploy, verify:
- Page title, favicon, and social cards render correctly.
- API/auth flows against Nhost work in production.

> Important: Users must verify their email before they can sign in. Ask them to check their Inbox and Spam folder for the verification email.

## Local development

The dev server runs on the port configured in `vite.config.ts` (currently `8080`). Visit http://localhost:8080.
