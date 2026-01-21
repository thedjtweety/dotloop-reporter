#!/bin/bash

# Dotloop Reporting Tool - Project History Auto-Update Script
# This script automatically updates PROJECT_HISTORY.md with new commits

set -e

PROJECT_ROOT="/home/ubuntu/dotloop-reporter"
HISTORY_FILE="$PROJECT_ROOT/PROJECT_HISTORY.md"
TEMP_FILE="/tmp/new_commits.txt"

cd "$PROJECT_ROOT"

# Get the last update date from PROJECT_HISTORY.md
LAST_UPDATE=$(grep "Last Updated:" "$HISTORY_FILE" | head -1 | sed 's/.*: //')
echo "Last documented update: $LAST_UPDATE"

# Get new commits since last update
echo "Fetching new commits..."
git log --all --format="%ai|%s|%b" --since="$LAST_UPDATE" > "$TEMP_FILE"

# Count new commits
NEW_COMMIT_COUNT=$(wc -l < "$TEMP_FILE")

if [ "$NEW_COMMIT_COUNT" -eq 0 ]; then
    echo "No new commits to document."
    exit 0
fi

echo "Found $NEW_COMMIT_COUNT new commits to document."

# Get total commit count
TOTAL_COMMITS=$(git rev-list --all --count)

# Get current date
CURRENT_DATE=$(date "+%B %d, %Y")

# Create backup
cp "$HISTORY_FILE" "${HISTORY_FILE}.backup"

# Update the header with new counts and date
sed -i "s/\*\*Last Updated\*\*:.*/\*\*Last Updated\*\*: $CURRENT_DATE/" "$HISTORY_FILE"
sed -i "s/\*\*Total Commits\*\*:.*/\*\*Total Commits\*\*: $TOTAL_COMMITS/" "$HISTORY_FILE"

echo ""
echo "==================================="
echo "NEW COMMITS TO DOCUMENT:"
echo "==================================="
cat "$TEMP_FILE"
echo ""
echo "==================================="
echo ""
echo "✅ Updated PROJECT_HISTORY.md header"
echo "📝 Please manually add the new commits to the appropriate phase section"
echo "💾 Backup saved to: ${HISTORY_FILE}.backup"
echo ""
echo "New commits are saved in: $TEMP_FILE"
echo ""
echo "To complete the update:"
echo "1. Review the new commits above"
echo "2. Add them to the appropriate phase in PROJECT_HISTORY.md"
echo "3. Commit the updated document:"
echo "   git add PROJECT_HISTORY.md"
echo "   git commit -m 'Update project history with $NEW_COMMIT_COUNT new commits'"
echo ""

# Display the new commits in a formatted way
echo "FORMATTED COMMIT ENTRIES:"
echo "==================================="
while IFS='|' read -r date subject body; do
    # Extract just the date and time
    commit_date=$(echo "$date" | cut -d' ' -f1)
    commit_time=$(echo "$date" | cut -d' ' -f2 | cut -d':' -f1,2)
    
    echo ""
    echo "**Commit** | *$commit_date $commit_time* | **$(echo "$subject" | sed 's/Checkpoint: //')**"
    
    if [ -n "$body" ]; then
        echo "$body" | sed 's/^/- /'
    fi
done < "$TEMP_FILE"

echo ""
echo "==================================="
