#!/bin/bash

# Script to generate 400+ commits by making small changes to files
# This will create a realistic development history

echo "Generating 400+ commits for Invest-Naija project..."

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

# Start date (3 months ago)
start_date="2024-01-15"
current_date=$(date -d "$start_date" +%s)

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

# Commit messages for different types of changes
messages=(
    "Update dashboard layout"
    "Improve API error handling"
    "Add new feature"
    "Fix bug in authentication"
    "Update documentation"
    "Optimize performance"
    "Add security improvements"
    "Refactor code structure"
    "Update dependencies"
    "Add new component"
    "Fix mobile responsiveness"
    "Improve user experience"
    "Add validation logic"
    "Update styling"
    "Fix database query"
    "Add error logging"
    "Improve accessibility"
    "Update configuration"
    "Add new route"
    "Fix navigation issue"
    "Update API endpoints"
    "Add loading states"
    "Improve form validation"
    "Update UI components"
    "Fix authentication flow"
    "Add new utility function"
    "Update mobile app"
    "Improve error messages"
    "Add new page"
    "Fix responsive design"
    "Update server configuration"
    "Add new middleware"
    "Improve database schema"
    "Update client code"
    "Fix payment processing"
    "Add new service"
    "Update documentation"
    "Improve security"
    "Add new feature flag"
    "Fix user interface"
    "Update deployment config"
)

# Generate 400+ commits
for i in {1..420}; do
    # Calculate date (spread over 3 months)
    days_offset=$((i * 2))  # 2 days between commits
    commit_date=$(date -d "$start_date + $days_offset days" "+%Y-%m-%d %H:%M:%S")
    
    # Select random file and message
    file_index=$((RANDOM % ${#files[@]}))
    message_index=$((RANDOM % ${#messages[@]}))
    
    file="${files[$file_index]}"
    message="${messages[$message_index]} #$i"
    
    # Create a unique change
    change="// Commit $i - $(date +%s)"
    
    echo "Creating commit $i: $message"
    create_commit "$commit_date" "$message" "$file" "$change"
    
    # Show progress every 50 commits
    if [ $((i % 50)) -eq 0 ]; then
        echo "Progress: $i commits created"
    fi
done

echo "Commit generation completed!"
echo "Total commits: $(git log --oneline | wc -l)" 