# Pending Payload Migration Check Action

This action will check your root project (or any specified projects) for pending PayloadCMS migrations and if it finds any it will report an error to stop deployments. This is useful to prevent deploying code that requires migrations without running them first.

NOTE: This repo is hosted at https://liamsgit.dev/LiamPietralla/pending-payload-migration, the GitHub repo is just a push mirror.

## Usage

```yaml
name: Check for Pending Payload Migrations
on:
  push:
    branches:
      - main

jobs:
  check-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install # Install dependencies before running the action
      - name: Check for Pending Payload Migrations
        uses: LiamPietralla/pending-payload-migration-action@v1.0.0
        with:
          paths: "path/to/your/payload/project" # Optional, defaults to root of the repository
```

## Inputs
- `paths`: The paths to check for pending migrations, allows multiple as array. Defaults to the root of the repository.

## Outputs
- `has-pending-migrations`: Whether there are pending migrations or not. This can be used in subsequent steps to conditionally run migration commands or fail the workflow.

## Release Steps

To release a new version of the action, follow these steps:

1. Update the version number in `package.json` and commit.
2. Push the commit to `main`.
3. Tag the commit and push the tag (e.g., `git tag v1.0.0 && git push origin v1.0.0`).

The CI pipeline will automatically build `dist/`, commit it to the tag, and create a GitHub Release.