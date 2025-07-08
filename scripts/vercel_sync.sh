#!/bin/bash

SOURCE_DIR="/Users/aman/Welzin/Dev/credzin"
TARGET_DIR="/Users/aman/Welzin/Dev/credzin-vercel"

# credzin git push
git add .
COMMIT_MESSAGE="Aman: Auto pushed the Code Edits & Features: $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MESSAGE"
git push

# Sync the directories
echo "Syncing $SOURCE_DIR to $TARGET_DIR..."
rsync -av --delete --exclude='.git/' "$SOURCE_DIR/" "$TARGET_DIR/"

# Check if rsync was successful
if [ $? -ne 0 ]; then
    echo "rsync failed. Exiting."
    exit 1
fi

echo "Sync complete. Committing and pushing changes in $TARGET_DIR..."

# Navigate to the target directory
cd "$TARGET_DIR" || { echo "Failed to change directory to $TARGET_DIR. Exiting."; exit 1; }

# Add all changes
git add .

# Commit changes with a timestamp
COMMIT_MESSAGE="Sync from credzin: $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MESSAGE"

# Push to the remote repository
git push

echo "Script finished."
