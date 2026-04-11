#!/usr/bin/env python3
import subprocess
import os
import sys

# Find the git repository root
try:
    result = subprocess.run(['git', 'rev-parse', '--show-toplevel'], 
                          capture_output=True, text=True, cwd='/vercel/share/v0-project')
    git_root = result.stdout.strip()
    print(f'[v0] Git repository root: {git_root}')
except Exception as e:
    print(f'[v0] Error finding git root: {e}')
    sys.exit(1)

# Change to git repository directory
os.chdir(git_root)
print(f'[v0] Changed to directory: {os.getcwd()}')

try:
    # Check git status
    print('[v0] Checking git status...')
    result = subprocess.run(['git', 'status', '--porcelain'], 
                          capture_output=True, text=True)
    print(f'[v0] Changed files:\n{result.stdout}')
    
    # Add all changes
    print('[v0] Staging all changes...')
    subprocess.run(['git', 'add', '-A'], check=True)
    
    # Check if there are changes to commit
    result = subprocess.run(['git', 'diff', '--cached', '--name-only'], 
                          capture_output=True, text=True)
    if not result.stdout.strip():
        print('[v0] No changes to commit')
        sys.exit(0)
    
    # Commit changes
    commit_message = '''fix: session persistence, account holder breakdown, quantity input, and GR/Discount logic

- Fix vouchers being cleared on session continuation
- Show account holder names in summary instead of just bank names
- Add manual quantity input with OK button confirmation
- Improve GR/Discount deduction logic - deductions now reduce outstanding amount
- Vouchers with zero balance after deductions are no longer marked as outstanding
- Add totalQuantity to summary and exports
- Update session manager to save currentStep and manualQuantity

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>'''
    
    print('[v0] Committing changes...')
    subprocess.run(['git', 'commit', '-m', commit_message], check=True)
    
    # Push to remote
    print('[v0] Pushing to remote...')
    subprocess.run(['git', 'push', 'origin', 'voucher-session-fix'], check=True)
    
    print('[v0] ✓ All changes pushed successfully!')
    
except subprocess.CalledProcessError as e:
    print(f'[v0] Error during git operations: {e}')
    sys.exit(1)
except Exception as e:
    print(f'[v0] Unexpected error: {e}')
    sys.exit(1)
