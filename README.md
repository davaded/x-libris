# X Manager (Self-Hosted)

A powerful, self-hosted dashboard for managing your X (formerly Twitter) bookmarks and likes. It comes with a Chrome Extension that automatically syncs your browsing activity to your local database.

## Features

- **Dashboard**: Clean, dark-mode UI to view and manage tweets.
- **Auto-Import**: Chrome Extension intercepts X.com traffic to automatically save tweets you view or bookmark.
- **Organization**: Organize tweets into folders (AI, Dev, Design, etc.) automatically or manually.
- **Search**: Full-text search through your saved tweets.
- **Privacy**: Self-hosted data. Your bookmarks live on your machine, not in the cloud.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide React
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL, Prisma ORM
- **Extension**: Chrome Manifest V3

## Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (Local installation or Docker)
- **Google Chrome** (for the extension)

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd X-Libris
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (or modify the existing one):

```env
# Database Connection
# Replace 'root' with your actual Postgres password if different
DATABASE_URL="postgresql://postgres:root@127.0.0.1:5432/x_manager?connect_timeout=10&sslmode=disable"

# API Security
API_SECRET="secret-api-key-123"
```

### 4. Setup Database

Initialize the database schema:

```bash
npx prisma db push
```

### 5. Run the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the `extension` folder inside this project directory.
5. The extension "X Manager Interceptor" should now be active.

## Usage

1. Ensure the Next.js app is running (`npm run dev`).
2. Visit [x.com](https://x.com).
3. Browse your Bookmarks, Likes, or Timeline.
4. The extension will automatically capture tweet data and send it to your local dashboard.
5. Refresh [http://localhost:3000](http://localhost:3000) to see your imported tweets.

## Troubleshooting

- **Database Connection Failed**:
  - Ensure PostgreSQL is running.
  - Check if the password in `.env` matches your local Postgres user (`postgres`).
  - Try changing `localhost` to `127.0.0.1` in `DATABASE_URL`.

- **Extension Errors**:
  - If you see `InvalidStateError` or JSON errors in the console, it might be a conflict with other extensions. Try disabling other X/Twitter-related extensions.
  - Ensure the backend server is running on port 3000.
