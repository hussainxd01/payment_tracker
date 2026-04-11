#!/bin/bash

cd /vercel/share/v0-project

# Configure git user for this commit
git config user.email "v0[bot]@users.noreply.github.com"
git config user.name "v0[bot]"

# Add all changes
git add -A

# Commit with descriptive message
git commit -m "fix: fix session persistence, account breakdown, and quantity input

- Fix vouchers being cleared on session continuation by preserving currentStep
- Update summary to show account holder names instead of generic bank names
- Add account-wise breakdown in both summary and tally report
- Implement total quantity (PCS) input with OK button confirmation
- Fix GR/Discount deduction logic to properly reduce outstanding amounts
- Ensure vouchers with zero balance are not marked as outstanding
- Add manual quantity tracking across session continuations

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"

# Push to current branch
git push origin HEAD

echo "Changes committed and pushed successfully!"
