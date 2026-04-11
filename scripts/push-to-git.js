import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

try {
  process.chdir(projectRoot);
  
  console.log('[v0] Current directory:', process.cwd());
  
  // Stage all changes
  console.log('[v0] Staging changes...');
  execSync('git add -A', { stdio: 'inherit' });
  
  // Check if there are changes to commit
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  
  if (status.trim().length === 0) {
    console.log('[v0] No changes to commit');
    process.exit(0);
  }
  
  // Commit changes
  const commitMessage = `fix: Fix session persistence, account breakdown, and quantity input

- Session persistence: Preserve current step and vouchers when continuing session
- Account breakdown: Show account holder names instead of generic bank names
- Quantity input: Add manual quantity input with confirmation button
- Deduction logic: Fix GR/Discount handling to properly reduce outstanding amounts

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>`;

  console.log('[v0] Committing changes...');
  execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  
  // Push to remote
  console.log('[v0] Pushing to remote...');
  execSync('git push', { stdio: 'inherit' });
  
  console.log('[v0] Successfully pushed changes to Git!');
  
} catch (error) {
  console.error('[v0] Error:', error.message);
  process.exit(1);
}
