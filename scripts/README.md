# Scripts

Helper scripts for running the development environment.

## Convex Noninteractive Development

### Problem

The `convex dev` command is interactive by design - it requires:
1. Authentication (first time)
2. Project selection
3. Deployment creation/selection

This makes it challenging to run in CI/CD environments or automated testing.

### Solutions

We provide two approaches to run Convex dev server noninteractively:

#### Approach 1: Node.js Script (Recommended)

**Usage:**
```bash
pnpm run dev:backend:noninteractive
```

**How it works:**
- `scripts/start-convex-dev.js` wraps `convex dev`
- Checks for existing `.convex` configuration
- Uses `CONVEX_URL` env variable if set
- Attempts to auto-answer prompts via stdin (may not work reliably)

**When to use:**
- When you have an existing `.convex` directory (already configured)
- When `CONVEX_URL` environment variable is set
- For local development after initial setup

#### Approach 2: Expect Script (More Reliable)

**Usage:**
```bash
# First install expect
sudo apt-get install expect  # Ubuntu/Debian
# or
brew install expect  # macOS

# Then run
pnpm run dev:backend:expect
```

**How it works:**
- `scripts/start-convex-dev-expect.sh` uses `expect` to handle interactive prompts
- Automatically selects first options and confirms prompts
- More reliable than stdin approach

**When to use:**
- First-time setup in CI/CD
- When stdin approach doesn't work
- When you need guaranteed automation

### Full Development Server (Noninteractive)

To run both frontend and backend noninteractively:

```bash
pnpm run dev:noninteractive
```

This runs:
- Frontend: `vite --open`
- Backend: `node scripts/start-convex-dev.js`

## Environment Variables

For fully noninteractive operation, set:

```bash
# Option 1: Use existing deployment URL
export VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Option 2: Use deployment name (if supported)
export CONVEX_DEPLOYMENT=your-deployment-name
```

## GitHub Actions Setup

To use these scripts in GitHub Actions, add to your workflow:

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v4
  with:
    version: 9

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'

- name: Install dependencies
  run: pnpm install

# Option A: Use existing deployment
- name: Setup Convex URL
  run: echo "VITE_CONVEX_URL=${{ secrets.CONVEX_URL }}" >> $GITHUB_ENV

# Option B: Install expect and use expect script
- name: Install expect
  run: sudo apt-get update && sudo apt-get install -y expect

- name: Start dev servers
  run: pnpm run dev:noninteractive
```

## Troubleshooting

### Script fails with "stdin is not a TTY"
- Use the expect-based approach instead: `pnpm run dev:backend:expect`

### Script fails with "expect: command not found"
- Install expect: `sudo apt-get install expect` (Linux) or `brew install expect` (macOS)

### Script starts but prompts for input anyway
- Make sure `.convex` directory exists from previous run
- OR set `VITE_CONVEX_URL` environment variable
- OR use the expect script which handles prompts

### Permission denied when running scripts
```bash
chmod +x scripts/start-convex-dev.js
chmod +x scripts/start-convex-dev-expect.sh
```

## Testing

To test if the noninteractive setup works:

1. Delete `.convex` directory: `rm -rf .convex`
2. Unset env variables: `unset CONVEX_URL VITE_CONVEX_URL`
3. Run: `pnpm run dev:backend:noninteractive`
4. Check if it starts without prompting
