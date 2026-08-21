# Moving Podium into its own repository

Podium is developed inside the portfolio repo because that is where the session
had push access, but it does not belong there. Two problems come from the
nesting, and both already bit during development:

- The site's `.gitignore` has a blanket `*.md` rule, which silently dropped the
  entire bot roster, both design documents and the installer from a commit.
  `podium/.gitignore` undoes it with `!*.md`; a standalone repo would not need
  that line at all.
- The site's `package.json` declares `"type": "module"`, which made every `.js`
  file in the desktop app ESM and broke the tests until
  `desktop/package.json` shadowed it with `"type": "commonjs"`.

Neither is fatal. Both are the kind of thing that quietly costs an hour later.

## Lifting it out

I could not create the repository from this session - the GitHub app I am
running under does not have repository-creation permission, and it refused with
`403 Resource not accessible by integration`. So this is the one thing left for
you to run.

```sh
# 1. Create the repo (gh, or click through github.com/new)
gh repo create devYRPauli/podium --public \
  --description "Verified delegation for Pi. The runner, not the model, decides whether the work landed."

# 2. Lift the kit out and push it
./scripts/extract-repo.sh ~/code/podium
cd ~/code/podium
git remote add origin git@github.com:devYRPauli/podium.git
git push -u origin main
```

`scripts/extract-repo.sh` copies the kit, drops the `!*.md` line that only
mattered while nested, runs both test suites to confirm the copy is sound, and
makes the first commit. It refuses to overwrite a non-empty directory.

## Afterwards

Delete `podium/` from the portfolio repo and close the branch. The history stays
in git if you ever want it.
