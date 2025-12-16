# System Architecture

## File Structure & Roles

### Root Configuration
- **`docker-compose.yml`**: Defines the containerized infrastructure. Crucially, it uses the `pgvector/pgvector:pg16` image to enable vector embeddings storage in PostgreSQL, which is the backbone of the "Hybrid Search" feature.
- **`.env` / `.env.example`**: Manages sensitive configuration.
  - `EXTENSION_TOKEN`: The "physical isolation" key for the browser extension to write data without a user session.
  - `ADMIN_USER_ID`: Enforces the single-user ownership model by hardcoding the owner of imported tweets.
  - `AUTH_SECRET`: Secures NextAuth sessions.

### Application Core (`app/`)
- **`app/api/import/route.ts`**: The "Write-Only" gate. It validates `x-extension-token` and writes data to the DB with `processed: false`, triggering the async AI pipeline.
- **`app/api/process-queue/route.ts`** (Planned): The Async Worker. It will be triggered by Cron to fetch unproccessed tweets, call OpenAI, and update the DB with tags/summary/embeddings.

### Database Layer (`prisma/`)
- **`prisma/schema.prisma`**: The single source of truth for data models. It will be updated to include `vector` type fields and the new `User`/`Session` models for NextAuth.

### Extension (`extension/`)
- **`manifest.json`**: Configures the browser extension permissions.
- **`background.js`**: Handles the "fire-and-forget" data capture, securely signing requests with the user's configured token.
