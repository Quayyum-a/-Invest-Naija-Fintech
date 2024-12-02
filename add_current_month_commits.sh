#!/bin/bash

# Script to add 127 commits for the current month (December 2024)
# This will make the current month very active

echo "Adding 127 commits for December 2024..."

# Function to create a commit with a specific date
create_commit() {
    local date="$1"
    local message="$2"
    local file="$3"
    local change="$4"
    
    # Make a small change to the file
    if [ ! -z "$file" ] && [ ! -z "$change" ]; then
        echo "$change" >> "$file"
    fi
    
    # Add and commit
    git add .
    GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git commit -m "$message"
}

# Files to modify
files=(
    "client/pages/Dashboard.tsx"
    "client/lib/api.ts"
    "server/index.ts"
    "README.md"
    "package.json"
    "client/global.css"
    "server/routes/auth.ts"
    "client/contexts/AuthContext.tsx"
    "mobile/App.tsx"
    "server/database/connection.ts"
)

# December 2024 commit messages
messages=(
    "Add new dashboard feature"
    "Improve API performance"
    "Fix authentication bug"
    "Update documentation"
    "Add security enhancement"
    "Optimize database queries"
    "Improve user experience"
    "Add new component"
    "Fix mobile responsiveness"
    "Update dependencies"
    "Add error handling"
    "Improve accessibility"
    "Fix navigation issue"
    "Add loading states"
    "Update styling"
    "Fix payment processing"
    "Add validation logic"
    "Improve error messages"
    "Add new route"
    "Fix responsive design"
    "Update configuration"
    "Add new service"
    "Fix database connection"
    "Improve form validation"
    "Add new utility function"
    "Update UI components"
    "Fix authentication flow"
    "Add new page"
    "Improve security measures"
    "Update deployment config"
)

# Generate 127 commits for December 2024
for i in {1..127}; do
    # Calculate date (spread over December 2024)
    day=$((1 + (i % 31)))  # Days 1-31
    hour=$((8 + (i % 12)))  # Hours 8-19
    minute=$((0 + (i % 60)))  # Minutes 0-59
    
    commit_date="2024-12-${day} ${hour}:${minute}:00"
    
    # Select random file and message
    file_index=$((RANDOM % ${#files[@]}))
    message_index=$((RANDOM % ${#messages[@]}))
    
    file="${files[$file_index]}"
    message="${messages[$message_index]} #$i"
    
    # Create a unique change
    change="// December commit $i - $(date +%s)"
    
    echo "Creating December commit $i: $message"
    create_commit "$commit_date" "$message" "$file" "$change"
    
    # Show progress every 20 commits
    if [ $((i % 20)) -eq 0 ]; then
        echo "Progress: $i December commits created"
    fi
done

echo "December commits creation completed!"
echo "Total commits: $(git log --oneline | wc -l)" 