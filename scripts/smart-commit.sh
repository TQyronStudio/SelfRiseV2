#!/bin/bash

# Smart commit script for SelfRise V2 - detects completed checkpoints
echo "🤖 Creating smart backup commit..."

# Function to extract the most recently completed checkpoint
get_latest_completed_checkpoint() {
    # Look for the most recent "✅ COMPLETED" line in projectplan.md
    if [ -f "projectplan.md" ]; then
        latest_checkpoint=$(grep -E "^#{4,5}.*✅ COMPLETED" projectplan.md | tail -1)
        if [ ! -z "$latest_checkpoint" ]; then
            # Extract just the checkpoint name and remove markdown symbols
            checkpoint_name=$(echo "$latest_checkpoint" | sed -E 's/^#{4,5} //' | sed -E 's/ ✅ COMPLETED$//' | sed -E 's/^Sub-checkpoint |^Checkpoint //')
            echo "$checkpoint_name"
        fi
    fi
}

# Get the latest completed checkpoint
completed_checkpoint=$(get_latest_completed_checkpoint)

# Create commit message based on what was found
if [ ! -z "$completed_checkpoint" ]; then
    commit_message="✅ Completed: $completed_checkpoint - $(date +'%Y-%m-%d %H:%M')"
else
    commit_message="✅ Task completed - $(date +'%Y-%m-%d %H:%M')"
fi

# Add all changes
git add .

# Check if there are any changes to commit
if git diff --cached --quiet; then
    echo "📝 No changes to commit"
    exit 0
fi

# Create commit with smart message
git commit -m "$commit_message"

# Push to main branch
git push origin main

echo "✅ Backup completed: $commit_message"