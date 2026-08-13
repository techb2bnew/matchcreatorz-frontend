# Matchcreatorz frontend deployment

This repository deploys `main` to the existing Ubuntu EC2 server through
`.github/workflows/ci-cd.yml`.

## One-time EC2 setup

The workflow expects the application root to be:

```text
/home/ubuntu/matchcreatorz-frontend
```

The path is derived from the SSH user's home directory, so it also works for a
different EC2 username if the same `~/matchcreatorz-frontend` layout is used.

On EC2, verify the required tools and environment file:

```bash
node --version
npm --version
pm2 --version
curl --version
test -f ~/matchcreatorz-frontend/.env.local && echo "env file is ready"
```

Node.js 20 or newer is required. If PM2 is missing, install it after Node.js is
ready:

```bash
sudo npm install --global pm2
pm2 startup
```

Run the command printed by `pm2 startup`, then run `pm2 save` after the first
successful deployment. The EC2 security group must allow SSH from the runner,
and the reverse proxy/load balancer should send application traffic to port
`3000`.

The server's existing `.env.local` is never uploaded to GitHub. It must contain:

```text
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_VAPID_KEY
```

## GitHub Actions secrets

Create a GitHub environment named `production` (recommended), or use repository
secrets. Add these secrets under **Settings → Secrets and variables → Actions**:

| Secret | Required | Value |
| --- | --- | --- |
| `EC2_HOST` | Yes | EC2 public IP or DNS name |
| `EC2_USER` | Yes | Usually `ubuntu` |
| `EC2_SSH_PRIVATE_KEY` | Yes | Complete private deployment key, including BEGIN/END lines |
| `EC2_PORT` | No | SSH port; defaults to `22` |
| `EC2_KNOWN_HOSTS` | Recommended | Output of `ssh-keyscan -H EC2_HOST` (add `-p PORT` for a custom port) |

The matching public key must be present in the EC2 user's
`~/.ssh/authorized_keys` file. Use a dedicated deployment key instead of a
personal day-to-day SSH key.

## What happens on each push

Pull requests and pushes to `main` install dependencies and verify a production
build. Lint is reported but is temporarily non-blocking because the current
codebase has pre-existing lint errors.

After a successful `main` build, GitHub uploads the source through SSH. EC2 then
creates an isolated release, links the server-only `.env.local`, installs exact
lockfile dependencies, builds, restarts PM2, and checks
`http://127.0.0.1:3000/`. A failed health check attempts to restart the previous
successful release.

The newest three releases are retained for rollback and older release folders
are permanently removed after a successful health check.

The first deployment may fail if another manually started process already owns
port `3000`. Stop that old process once, then re-run the failed workflow from
GitHub Actions.
