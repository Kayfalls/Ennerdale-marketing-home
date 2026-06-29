# Git workflow for pulling remote changes and pushing your commit

Use this when you want to bring in remote commits without losing your local work.

## Safe sequence

```bash
git fetch origin
git pull --rebase origin main
# resolve any conflicts if Git pauses
# then continue the rebase
git add <resolved-files>
git rebase --continue
git push origin main
```

## What this does

- `git fetch origin` downloads the latest remote state.
- `git pull --rebase origin main` applies your local commit on top of the remote commits instead of overwriting it.
- If there is a conflict, resolve it, stage the file, and run `git rebase --continue`.
- `git push origin main` sends your rebased commit to GitHub.

## If you want to inspect what will be pulled first

```bash
git log --oneline --decorate --left-right HEAD...origin/main
```

## If you want to see the exact commits that are incoming

```bash
git log --oneline --decorate --reverse origin/main~7..origin/main
```

## If you need to stop the rebase

```bash
git rebase --abort
```
