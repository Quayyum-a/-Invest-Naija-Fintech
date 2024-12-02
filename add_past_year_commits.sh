#!/bin/bash

# Script to add 348 commits spanning from January 2023 to October 2024
# This will make some days have multiple commits to make squares thicker

echo "Adding 348 commits for January 2023 - October 2024..."

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

# Past year commit messages
messages=(
    "Initial project setup"
    "Add basic authentication"
    "Create user dashboard"
    "Implement payment system"
    "Add investment features"
    "Create mobile app"
    "Add security measures"
    "Improve performance"
    "Fix bugs and issues"
    "Update documentation"
    "Add new features"
    "Refactor codebase"
    "Optimize database"
    "Add error handling"
    "Improve UI/UX"
    "Add testing"
    "Update dependencies"
    "Fix security vulnerabilities"
    "Add new components"
    "Improve accessibility"
    "Add API endpoints"
    "Fix mobile responsiveness"
    "Add validation logic"
    "Update styling"
    "Add new pages"
    "Fix navigation issues"
    "Add loading states"
    "Improve error messages"
    "Add new services"
    "Update configuration"
)

# Generate 348 commits spanning 2023-2024
for i in {1..348}; do
    # Calculate date (spread over 2023-2024)
    # Some days will have multiple commits to make squares thicker
    
    # Create clusters of commits on certain days
    if [ $((i % 7)) -eq 0 ]; then
        # Every 7th commit will be on the same day as the previous one
        # to create thicker green squares
        day_offset=$((i / 7))
    else
        day_offset=$((i / 7 + 1))
    fi
    
    # Calculate year and month
    if [ $day_offset -le 365 ]; then
        # 2023
        year=2023
        month=$((1 + (day_offset / 30)))
        day=$((1 + (day_offset % 30)))
    else
        # 2024 (up to October)
        year=2024
        month=$((1 + ((day_offset - 365) / 30)))
        day=$((1 + ((day_offset - 365) % 30)))
    fi
    
    # Ensure month is valid (1-12)
    if [ $month -gt 12 ]; then
        month=12
    fi
    
    # Ensure day is valid (1-31)
    if [ $day -gt 31 ]; then
        day=31
    fi
    
    # Add some randomness to hours and minutes
    hour=$((8 + (RANDOM % 12)))
    minute=$((RANDOM % 60))
    
    # Format date with leading zeros
    month_padded=$(printf "%02d" $month)
    day_padded=$(printf "%02d" $day)
    hour_padded=$(printf "%02d" $hour)
    minute_padded=$(printf "%02d" $minute)
    
    commit_date="${year}-${month_padded}-${day_padded} ${hour_padded}:${minute_padded}:00"
    
    # Select random file and message
    file_index=$((RANDOM % ${#files[@]}))
    message_index=$((RANDOM % ${#messages[@]}))
    
    file="${files[$file_index]}"
    message="${messages[$message_index]} #$i"
    
    # Create a unique change
    change="// Past year commit $i - $(date +%s)"
    
    echo "Creating past year commit $i: $message (${commit_date})"
    create_commit "$commit_date" "$message" "$file" "$change"
    
    # Show progress every 50 commits
    if [ $((i % 50)) -eq 0 ]; then
        echo "Progress: $i past year commits created"
    fi
done

echo "Past year commits creation completed!"
echo "Total commits: $(git log --oneline | wc -l)" 