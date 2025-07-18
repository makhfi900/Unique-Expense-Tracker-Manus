#!/bin/bash

# GitHub Issues Creation Script
# This script helps create GitHub issues for the Unique Expense Tracker

echo "🎯 GitHub Issues Creation Helper"
echo "=================================="

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Please install it first:"
    echo ""
    echo "# Install GitHub CLI"
    echo "curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
    echo "echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main\" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null"
    echo "sudo apt update && sudo apt install gh"
    echo ""
    echo "# Login to GitHub"
    echo "gh auth login"
    echo ""
    echo "📋 Manual Alternative:"
    echo "Copy content from github-issues/*.md files to create issues manually at:"
    echo "https://github.com/makhfi900/Unique-Expense-Tracker-Manus/issues/new"
    exit 1
fi

# Check if logged in
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in to GitHub. Please login first:"
    echo "gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is available and logged in"
echo ""

# Issue 1: Admin Role Bug
echo "🐛 Creating Issue #1: Admin Role Detection Bug"
if gh issue create \
    --title "Admin user shows as Account Officer after login" \
    --body-file "github-issues/issue-1-admin-role-bug.md" \
    --label "bug,authentication,role-management,high-priority,frontend"; then
    echo "✅ Issue #1 created successfully"
else
    echo "❌ Failed to create Issue #1"
fi

echo ""

# Issue 2: Currency Localization
echo "🌍 Creating Issue #2: Currency Localization (USD to PKR)"
if gh issue create \
    --title "Replace USD references with PKR currency for Pakistan localization" \
    --body-file "github-issues/issue-2-currency-localization.md" \
    --label "enhancement,localization,currency,frontend,backend,medium-priority"; then
    echo "✅ Issue #2 created successfully"
else
    echo "❌ Failed to create Issue #2"
fi

echo ""
echo "🎉 GitHub issues creation completed!"
echo ""
echo "📋 View issues at:"
echo "https://github.com/makhfi900/Unique-Expense-Tracker-Manus/issues"