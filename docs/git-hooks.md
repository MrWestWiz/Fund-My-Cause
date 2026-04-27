# Git Hooks Setup

This project uses Husky and lint-staged to enforce code quality standards through pre-commit hooks.

## Installed Hooks

### pre-commit
Runs linting and formatting checks before each commit:
- ESLint for TypeScript/TSX files
- Prettier for code formatting
- Cargo fmt and clippy for Rust files

### commit-msg
Validates commit messages follow conventional commits format:
- Type: feat, fix, docs, style, refactor, perf, test, chore, ci, revert
- Format: `type(scope): subject`
- Example: `feat(wallet): add freighter integration`

## Configuration Files

- `.husky/` - Hook scripts
- `commitlint.config.js` - Commit message validation rules
- `package.json` - lint-staged configuration

## Bypassing Hooks

To skip hooks (not recommended):
```bash
git commit --no-verify
```

## Manual Hook Execution

Run linting manually:
```bash
npm run lint
npm run format
```

## Troubleshooting

If hooks don't run:
1. Ensure husky is installed: `npm install`
2. Reinstall hooks: `npx husky install`
3. Check hook permissions: `ls -la .husky/`

## Conventional Commits

Follow this format for commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, etc.
- **ci**: Changes to CI/CD configuration
- **revert**: Reverts a previous commit

### Examples
```
feat(components): add error boundary component
fix(wallet): resolve connection timeout issue
docs(readme): update installation instructions
refactor(types): improve type safety across frontend
```
