# Project Scripts

This directory contains utility scripts for maintaining the Dotloop Reporting Tool project.

## Available Scripts

### `update-project-history.sh`

Automatically updates `PROJECT_HISTORY.md` with new git commits since the last documented update.

**Usage:**
```bash
./scripts/update-project-history.sh
```

**What it does:**
1. Reads the "Last Updated" date from PROJECT_HISTORY.md
2. Fetches all new commits since that date
3. Updates the header with current date and total commit count
4. Displays formatted commit entries for manual documentation
5. Creates a backup of PROJECT_HISTORY.md

**After running:**
1. Review the new commits displayed in the terminal
2. Manually add them to the appropriate phase section in PROJECT_HISTORY.md
3. Commit the updated document:
   ```bash
   git add PROJECT_HISTORY.md
   git commit -m "Update project history with [N] new commits"
   ```

## Best Practices

- Run `update-project-history.sh` after completing major features or at the end of each development session
- Always review the formatted commit entries before adding them to the document
- Group related commits into logical phases for better readability
- Keep the backup file until you've verified the update is correct
