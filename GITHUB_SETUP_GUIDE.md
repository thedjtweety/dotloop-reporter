# GitHub Setup & Collaboration Guide

**Instructions for setting up the GitHub repository and collaborating with Claude and other developers.**

---

## Table of Contents
1. [Repository Setup](#repository-setup)
2. [Cloning the Repository](#cloning-the-repository)
3. [Branching Strategy](#branching-strategy)
4. [Pull Request Workflow](#pull-request-workflow)
5. [Code Review Guidelines](#code-review-guidelines)
6. [Collaboration with Claude](#collaboration-with-claude)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Issue Management](#issue-management)

---

## Repository Setup

### Creating a New Repository

If you don't have a GitHub repository yet, create one:

1. **Go to GitHub:** https://github.com/new
2. **Repository Name:** `dotloop-reporter`
3. **Description:** "A comprehensive web-based reporting and analytics platform for Dotloop real estate transaction data"
4. **Visibility:** Private (recommended for proprietary code)
5. **Initialize:** Don't add README (we have one)
6. **Click:** Create repository

### Repository Settings

**Configure the following in GitHub Settings:**

**General:**
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Dismiss stale pull request approvals when new commits are pushed

**Branch Protection:**
- Create rule for `main` branch
- Require 1 pull request review
- Require status checks (tests, build)
- Require branches to be up to date

**Secrets & Variables:**
- Add environment variables needed for CI/CD
- Store sensitive data (API keys, tokens)

---

## Cloning the Repository

### Initial Clone

```bash
# Clone the repository
git clone https://github.com/your-org/dotloop-reporter.git
cd dotloop-reporter

# Add upstream remote (if forking)
git remote add upstream https://github.com/original-org/dotloop-reporter.git

# Verify remotes
git remote -v
# origin    https://github.com/your-org/dotloop-reporter.git (fetch)
# origin    https://github.com/your-org/dotloop-reporter.git (push)
```

### Setting Up Git Configuration

```bash
# Configure git user (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Or configure per repository
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Verify configuration
git config --list
```

### SSH Setup (Recommended)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key to GitHub
# Settings → SSH and GPG keys → New SSH key
# Paste contents of ~/.ssh/id_ed25519.pub

# Test connection
ssh -T git@github.com
# Hi username! You've successfully authenticated...
```

---

## Branching Strategy

### Branch Naming Convention

Follow this naming convention for consistency:

```
feature/description          # New feature
bugfix/description           # Bug fix
docs/description             # Documentation
refactor/description         # Code refactoring
test/description             # Test improvements
chore/description            # Maintenance tasks
hotfix/description           # Urgent production fix
```

### Examples

```
feature/add-deals-closed-metric
bugfix/fix-agent-column-na-issue
docs/update-readme-with-features
refactor/simplify-chart-components
test/add-csv-validation-tests
chore/update-dependencies
hotfix/fix-critical-auth-bug
```

### Creating a Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create new branch
git checkout -b feature/my-feature

# Or create and switch in one command
git switch -c feature/my-feature

# Verify branch created
git branch
# * feature/my-feature
#   main
```

### Keeping Branch Updated

```bash
# Fetch latest changes
git fetch origin

# Rebase on main (preferred)
git rebase origin/main

# Or merge if conflicts exist
git merge origin/main

# Resolve conflicts if any
# Then continue
git rebase --continue
# or
git merge --continue
```

---

## Pull Request Workflow

### Creating a Pull Request

**Step 1: Commit Changes**

```bash
# Check status
git status

# Stage changes
git add .

# Or stage specific files
git add client/src/components/NewComponent.tsx
git add server/routers.ts

# Commit with descriptive message
git commit -m "feat: add deals closed metric to podium

- Calculate deals closed for each agent
- Display metric below revenue
- Format with singular/plural handling
- Test on mobile and desktop"
```

**Step 2: Push to GitHub**

```bash
# Push branch to GitHub
git push origin feature/my-feature

# If branch doesn't exist on remote
git push -u origin feature/my-feature
```

**Step 3: Create Pull Request**

1. **Go to GitHub repository**
2. **Click "Compare & pull request"** (appears after pushing)
3. **Fill in PR details:**
   - **Title:** Clear, descriptive title
   - **Description:** Explain what changed and why
   - **Link issues:** Reference related issues with `#123`
   - **Request reviewers:** Tag team members

**PR Template Example:**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Related Issues
Closes #123

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] No new warnings generated
```

### Addressing Review Comments

```bash
# Make requested changes
# Edit files as needed

# Stage and commit changes
git add .
git commit -m "fix: address review comments

- Simplify component logic
- Add error handling
- Update tests"

# Push changes (no need to recreate PR)
git push origin feature/my-feature

# GitHub will automatically update PR
```

### Merging a Pull Request

```bash
# Option 1: Merge via GitHub UI (recommended)
# Click "Merge pull request" button
# Choose merge strategy:
# - Create a merge commit (preserves history)
# - Squash and merge (cleaner history)
# - Rebase and merge (linear history)

# Option 2: Merge locally
git checkout main
git pull origin main
git merge feature/my-feature
git push origin main

# Delete branch after merging
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

---

## Code Review Guidelines

### For Authors (Submitting Code)

**Before Creating PR:**
- ✅ Run all tests: `pnpm test`
- ✅ Type check: `pnpm check`
- ✅ Format code: `pnpm format`
- ✅ Build project: `pnpm build`
- ✅ Test in browser (if UI changes)
- ✅ Update documentation
- ✅ Add/update tests for changes

**In PR Description:**
- Explain what changed and why
- Link related issues
- Describe testing performed
- Note any breaking changes
- Include screenshots for UI changes

### For Reviewers (Reviewing Code)

**Review Checklist:**
- ✅ Code follows project style guide
- ✅ Changes are well-tested
- ✅ No obvious bugs or issues
- ✅ Performance impact is acceptable
- ✅ Security implications considered
- ✅ Documentation is updated
- ✅ Commit messages are clear

**Providing Feedback:**

```markdown
# Good Review Comment
The CSV validation logic looks good, but I noticed it doesn't handle 
UTF-8 BOM (Byte Order Mark). Can you add a test case for this edge case?

# Avoid
"This is wrong"
"Why did you do it this way?"
"This won't work"
```

**Approval Types:**
- **Approve:** Code is ready to merge
- **Request Changes:** Issues must be fixed before merging
- **Comment:** Feedback for discussion (doesn't block merge)

---

## Collaboration with Claude

### Sharing Code with Claude

**Method 1: GitHub Access**
1. Invite Claude to repository (if using GitHub API)
2. Claude can read code and suggest improvements
3. Claude can help with debugging and architecture

**Method 2: Code Export**
```bash
# Export specific files
git show HEAD:client/src/components/WinnersPodium.tsx

# Export entire directory
tar -czf dotloop-reporter.tar.gz .

# Share via secure channel
```

**Method 3: Documentation-First**
1. Create comprehensive documentation (README, guides)
2. Share documentation with Claude
3. Claude can understand codebase from docs
4. Share specific files when needed

### Working with Claude on Features

**Step 1: Brief Claude**
- Share README.md and ARCHITECTURE.md
- Explain feature requirements
- Provide context on related code

**Step 2: Claude Proposes Solution**
- Claude suggests implementation approach
- Claude provides code examples
- Claude identifies potential issues

**Step 3: Review & Implement**
- Review Claude's suggestions
- Adapt to your specific needs
- Implement in your codebase

**Step 4: Testing & Refinement**
- Test Claude's code
- Report issues
- Claude refines solution

**Step 5: Integration**
- Merge into main branch
- Update documentation
- Deploy to production

### Asking Claude for Help

**Effective Questions:**
```
"I need to add a new chart component that shows agent performance trends. 
The component should:
1. Accept an array of agent metrics
2. Display trends over time
3. Be responsive on mobile
4. Support dark mode

Where should I create this component and what's the best approach?"
```

**Ineffective Questions:**
```
"How do I add a chart?"
"The code is broken, help!"
"What should I do next?"
```

---

## CI/CD Pipeline

### GitHub Actions Setup

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: dotloop_reporter
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: pnpm check
      
      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/dotloop_reporter
      
      - name: Build
        run: pnpm build
```

### Deployment Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Manus
        run: |
          # Deploy to Manus hosting
          # Implementation depends on Manus CLI
          echo "Deploying to production..."
```

---

## Issue Management

### Creating Issues

**Bug Report Template:**
```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 12.1]
- Browser: [e.g., Chrome 97]
- Node.js: [e.g., 18.0]

## Screenshots
[Add screenshots if applicable]
```

**Feature Request Template:**
```markdown
## Description
Clear description of the feature

## Motivation
Why is this feature needed?

## Proposed Solution
How should this work?

## Alternatives Considered
Other approaches considered

## Additional Context
Any other information
```

### Issue Labels

Organize issues with labels:

- **bug** – Something isn't working
- **feature** – New feature request
- **documentation** – Documentation improvements
- **enhancement** – Improvement to existing feature
- **good first issue** – Good for new contributors
- **help wanted** – Need assistance
- **question** – Question or discussion
- **priority-high** – Urgent issue
- **priority-low** – Can wait

### Issue Workflow

```
New Issue → Triage → In Progress → Review → Closed
```

**Triage:**
- Assign labels
- Assign to developer
- Set priority
- Link related issues

**In Progress:**
- Create branch: `feature/issue-123`
- Update issue status
- Link PR when created

**Review:**
- PR review process
- Address feedback
- Merge when approved

**Closed:**
- Verify fix in production
- Close issue
- Document resolution

---

## Best Practices

### Commit Messages

**Good Commit Message:**
```
feat: add deals closed metric to podium

- Calculate deals closed for each agent
- Display below revenue with color coding
- Add singular/plural handling
- Test on mobile and desktop

Closes #123
```

**Bad Commit Message:**
```
update stuff
fixed bugs
changes
```

### Pull Request Size

- **Ideal:** 200-400 lines changed
- **Acceptable:** 100-800 lines changed
- **Too Large:** 1000+ lines (split into multiple PRs)

**Why?**
- Easier to review
- Faster to merge
- Easier to revert if needed
- Better for git history

### Frequency of Commits

```bash
# Commit frequently (every 15-30 minutes)
# This helps with:
# - Easier to review individual changes
# - Better git history
# - Easier to revert specific changes
# - Less work lost if something goes wrong

# Example workflow:
git add client/src/components/NewComponent.tsx
git commit -m "feat: create new component structure"

git add client/src/components/NewComponent.tsx
git commit -m "feat: add component logic"

git add client/src/components/NewComponent.tsx
git commit -m "test: add component tests"
```

### Code Review Culture

- **Be respectful:** Assume good intent
- **Be constructive:** Suggest improvements, not just criticism
- **Be timely:** Review PRs within 24 hours
- **Be thorough:** Check logic, tests, documentation
- **Be collaborative:** Discuss alternatives, not just one way

---

## Troubleshooting

### Common Git Issues

**Issue: Merge Conflicts**
```bash
# View conflicts
git status

# Edit files to resolve conflicts
# Look for <<<<<<, ======, >>>>>>

# After resolving
git add .
git commit -m "fix: resolve merge conflicts"
git push origin feature/my-feature
```

**Issue: Accidentally Committed to Main**
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Create new branch
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat: my feature"

# Push
git push origin feature/my-feature
```

**Issue: Need to Update PR with Latest Main**
```bash
# Fetch latest
git fetch origin

# Rebase on main
git rebase origin/main

# If conflicts, resolve them
# Then continue
git rebase --continue

# Force push (only on your branch!)
git push origin feature/my-feature --force-with-lease
```

**Issue: Accidentally Pushed Sensitive Data**
```bash
# Remove file from history
git filter-branch --tree-filter 'rm -f .env.local' HEAD

# Force push
git push origin main --force

# Or use BFG Repo-Cleaner for large repos
```

---

## Resources

- **GitHub Docs:** https://docs.github.com
- **Git Documentation:** https://git-scm.com/doc
- **GitHub Flow Guide:** https://guides.github.com/introduction/flow/
- **Conventional Commits:** https://www.conventionalcommits.org/
- **GitHub Actions:** https://github.com/features/actions

---

**Last Updated:** January 27, 2026  
**For:** Claude AI Collaboration
