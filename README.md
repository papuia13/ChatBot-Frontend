# 🧙 Wizard AI – Intelligent Chatbot

<div align="center">
  <p>An intelligent chatbot interface with user authentication, conversation history, and AI-powered responses</p>
  <img src="public/placeholder.svg" alt="Chatbot Preview" width="600">
</div>

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Nhost account (free tier available)
- OpenRouter API key (for AI responses)
- n8n account (free tier available)

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your credentials
4. Start the dev server: `npm run dev`
5. Open http://localhost:8080

## 📋 Project Overview

Wizard AI is a modern chatbot interface that combines:

- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn-ui + Tailwind CSS
- **Backend**: Nhost (Auth + Database)
- **AI**: OpenRouter API (multiple LLM models)
- **Workflow Automation**: n8n

### Key Features
- 🔐 User authentication & authorization
- 💬 Real-time chat interface
- 📚 Conversation history
- 🎨 Dark/Light mode
- ⚡ Optimized performance

## 🔐 Authentication & Security

### Nhost Authentication
- User authentication is handled by Nhost's built-in auth system
- Supports email/password, social logins (Google, GitHub, etc.), and passwordless login
- Email verification is required for new signups
- JWT tokens are automatically managed by the Nhost client

### Hasura Permissions
- Row-Level Security (RLS) is configured for all tables
- Users can only access their own data through permission rules:
  ```sql
  -- Example permission for messages table
  CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);
  ```
- All GraphQL operations are protected by JWT verification
- Custom actions (like `sendMessage`) include permission checks

### Session Management
- Sessions are managed by Nhost
- JWT tokens are stored in HTTP-only cookies for security
- Automatic token refresh is handled by the Nhost client

## 🛠️ Complete Setup Guide

### 1. Nhost Setup
1. Sign up at [Nhost](https://nhost.io/)
2. Create a new project
3. Note your project's subdomain and region
4. Enable Authentication and Database services

### 2. Database Configuration
1. Open Hasura Console from Nhost dashboard
2. Create required tables with these SQL commands:

```sql
-- Create chats table
CREATE TABLE public.chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Set up permissions
CREATE POLICY "Users can view their own chats" 
ON public.chats FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chats"
ON public.chats FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Similar policies for messages table
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.chats 
  WHERE public.chats.id = public.messages.chat_id 
  AND public.chats.user_id = auth.uid()
));


### 3. Create Action for Sending Messages
1. In Hasura, go to "Actions" tab
2. Create a new action named `sendMessage` with handler URL from n8n (see next section)
3. Define input type:
   ```graphql
   chat_id: uuid!
   content: String!
   role: String!
   ```
4. Define output type: `message: messages`
5. Configure webhook handler and forward client headers

### 4. n8n Workflow Setup

#### Option 1: Import Pre-configured Workflow
1. In n8n, click on the "Workflows" menu
2. Click the "+ New" button and select "Import from File"
3. Select the file `docs/n8n-workflow-export.json` from this repository
4. After importing, update the following values in the workflow:
   - In the "Hasura: Fetch History" node, set your Nhost Hasura URL
   - In the "OpenRouter: Chat Completions" node:
     - Update `YOUR_OPENROUTER_API_KEY` with your actual OpenRouter API key
     - Set `YOUR_SITE_URL` to your application's URL
     - Update `Your App Name` to your application's name

#### Option 2: Manual Setup
1. Create a new workflow in n8n
2. Add a Webhook node and configure it to receive POST requests
3. Add a Function node to process the incoming message
4. Add an HTTP Request node to call OpenRouter API
   - Method: POST
   - URL: `https://openrouter.ai/api/v1/chat/completions`
   - Headers:
     - `Authorization: Bearer YOUR_OPENROUTER_API_KEY`
     - `HTTP-Referer: YOUR_SITE_URL`
     - `X-Title: YOUR_APP_NAME`
5. Add a Response node to send back the AI response

For detailed node configurations, refer to the exported workflow in `docs/n8n-workflow-export.json`

### 5. Environment Setup
Create a `.env` file in the root directory with:
```
VITE_NHOST_SUBDOMAIN=your-nhost-subdomain
VITE_NHOST_REGION=your-nhost-region
VITE_OPENROUTER_API_KEY=your-openrouter-key
VITE_N8N_WEBHOOK_URL=your-n8n-webhook-url
```

### 6. Running the Application
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Access the app at `http://localhost:8080`
4. The app will handle user authentication automatically through Nhost

## 🎯 How to Use

### Getting Started
1. **Access the Chatbot**
   - Open the deployed application in your web browser
   - Sign up for a new account or log in if you already have one
   - Verify your email address (check your inbox and spam folder)

2. **Starting a New Chat**
   - Click on the "+ New Chat" button in the sidebar
   - Select a conversation type or template if available
   - Start typing your message in the input field at the bottom of the chat interface

3. **Chat Features**
   - Send messages by pressing Enter or clicking the send button
   - Edit or delete your previous messages (if enabled)
   - View conversation history in the sidebar
   - Toggle between light/dark mode using the theme toggle

4. **Managing Conversations**
   - Rename conversations by clicking on the title in the sidebar
   - Delete conversations using the trash can icon
   - Search through your conversation history using the search bar

### Tips for Best Results
- Be specific with your questions
- Provide context when needed
- Break down complex queries into smaller questions
- Use the "Regenerate" option if you'd like a different response

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

## 🛠️ Tech Stack

### Core Technologies
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State Management**: React Query
- **Form Handling**: React Hook Form
- **UI Components**: Radix UI Primitives

### Backend & Services
- **Authentication**: Nhost Auth
- **Database**: PostgreSQL (via Nhost)
- **API**: GraphQL (Hasura)
- **AI**: OpenRouter API
- **Workflows**: n8n

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Formatting**: Prettier
- **Version Control**: Git

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
