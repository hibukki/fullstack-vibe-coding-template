// Lint only — never a formatter (auto-formatting churns untouched lines).
// Returning an array runs each command verbatim, without the staged filenames
// appended: `tsc -b` type-checks the whole project (build mode rejects file
// args), while eslint lints only staged files. `--no-warn-ignored` skips
// eslint-ignored files instead of failing.
// https://github.com/lint-staged/lint-staged#example-run-tsc-on-changes-to-typescript-files-but-do-not-pass-any-filename-arguments
export default {
  "*.{ts,tsx}": (stagedFiles) => [
    `eslint --max-warnings 0 --no-warn-ignored ${stagedFiles.join(" ")}`,
    "tsc -b",
  ],
};
