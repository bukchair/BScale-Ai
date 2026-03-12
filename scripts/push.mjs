/**
 * Auto push: git add, commit (if changes), push.
 * Requires: git remote origin set (e.g. git remote add origin <url>)
 */
import { execSync } from 'child_process';

try {
  execSync('git add -A', { stdio: 'inherit' });
  const status = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (status.trim()) {
    execSync('git commit -m "Auto commit: update"', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    console.log('Done: pushed.');
  } else {
    console.log('Nothing to commit.');
    try {
      execSync('git push', { stdio: 'inherit' });
      console.log('Pushed (no new commits).');
    } catch (e) {
      console.log('No remote or nothing to push.');
    }
  }
} catch (e) {
  console.error('Push failed. Did you set remote? Run: git remote add origin <your-repo-url>');
  process.exit(1);
}
