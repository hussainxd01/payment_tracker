#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

// Change to project directory
const projectDir = '/vercel/share/v0-project';
process.chdir(projectDir);

console.log('[v0] Starting git operations...');
console.log('[v0] Working directory:', process.cwd());

try {
  // Check git status
  console.log('[v0] Checking git status...');
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  console.log('[v0] Changed files:\n', status);

  // Stage all changes
  console.log('[v0] Staging all changes...');
  execSync('git add -A', { stdio: 'inherit' });

  // Check if there are changes to commit
  const stagedChanges = execSync('git diff --cached --name-only', { encoding: 'utf-8' });
  if (!stagedChanges.trim()) {
    console.log('[v0] No changes to commit');
    process.exit(0);
  }

  // Create commit message
  const commitMessage = 'fix: session persistence, account holder breakdown, quantity input, and GR/Discount logic

- Fix vouchers being cleared on session continuation
- Show account holder names in summary instead of just bank names
- Add manual quantity input with OK button confirmation
- Improve GR/Discount deduction logic - deductions now reduce outstanding amount
- Vouchers with zero balance after deductions are no longer marked as outstanding
- Add totalQuantity to summary and exports
- Update session manager to save currentStep and manualQuantity

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>';

  // Commit changes
  console.log('[v0] Committing changes...');
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

  // Push to remote
  console.log('[v0] Pushing to remote...');
  execSync('git push origin voucher-session-fix', { stdio: 'inherit' });

  console.log('[v0] ✓ All changes pushed successfully!');
} catch (error) {
  console.error('[v0] Error during git operations:', error.message);
  process.exit(1);
}
