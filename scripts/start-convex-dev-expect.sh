#!/usr/bin/env bash

# Starts Convex dev server using expect to handle interactive prompts
# Requires: expect to be installed (apt-get install expect / brew install expect)

if ! command -v expect &> /dev/null; then
    echo "❌ 'expect' is not installed."
    echo "   Install it with: sudo apt-get install expect  (Ubuntu/Debian)"
    echo "   or: brew install expect  (macOS)"
    exit 1
fi

echo "🚀 Starting Convex dev server with expect..."

expect << 'EOF'
set timeout 60

# Start convex dev
spawn npx convex dev

# Handle different possible prompts
expect {
    # If asked to create a new project
    "Create a new project" {
        send "y\r"
        exp_continue
    }
    # If asked to select a project
    "Select a project" {
        send "1\r"
        exp_continue
    }
    # If asked to log in
    "Log in" {
        send "y\r"
        exp_continue
    }
    # If asked to continue
    "Continue" {
        send "y\r"
        exp_continue
    }
    # If asked for project name
    "Enter project name" {
        send "swapcard6\r"
        exp_continue
    }
    # If asked for team
    "Select a team" {
        send "1\r"
        exp_continue
    }
    # If successfully started
    "Convex dev server running" {
        # Keep the process running
        interact
    }
    # If already running
    "already running" {
        puts "✅ Convex is already running"
        exit 0
    }
    # Timeout
    timeout {
        puts "⏱️  Timed out waiting for Convex to start"
        exit 1
    }
    # EOF
    eof {
        puts "Convex dev process exited"
    }
}
EOF

exit_code=$?
if [ $exit_code -eq 0 ]; then
    echo "✅ Convex dev server started successfully"
else
    echo "❌ Failed to start Convex dev server (exit code: $exit_code)"
fi

exit $exit_code
