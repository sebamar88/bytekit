import fs from "fs";
import { execSync } from "child_process";

const args = process.argv.slice(2);
let bumpType = args[0] || "auto";
const prTitle = args[1] || "";
const prBody = process.env.PR_BODY || "";

const pkgPath = "./package.json";
const changelogPath = "./CHANGELOG.md";

// Map conventional commits / PR titles / PR body to bump types
if (bumpType === "auto") {
    // 1. Check Body Checkboxes (Highest priority if specific)
    if (prBody.includes("- [x] 💥 Breaking change")) {
        bumpType = "major";
    } else if (prBody.includes("- [x] ✨ New feature")) {
        bumpType = "minor";
    } else if (
        prBody.includes("- [x] 🐛 Bug fix") ||
        prBody.includes("- [x] 📝 Documentation update") ||
        prBody.includes("- [x] 🔧 Chore")
    ) {
        bumpType = "patch";
    }
    // 2. Check PR Title (Conventional Commits)
    else if (prTitle.match(/BREAKING CHANGE/) || prTitle.includes("!")) {
        bumpType = "major";
    } else if (prTitle.toLowerCase().startsWith("feat")) {
        bumpType = "minor";
    } else if (
        prTitle.toLowerCase().startsWith("fix") ||
        prTitle.toLowerCase().startsWith("docs") ||
        prTitle.toLowerCase().startsWith("chore")
    ) {
        bumpType = "patch";
    }
    // 3. Default
    else {
        bumpType = "patch";
    }
}

// Read package.json
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const oldVersion = pkg.version;

console.info(`Bumping ${oldVersion} with type: ${bumpType}`);
console.info(
    `Context - Title: "${prTitle}", Body checkboxes: ${prBody.includes("[x]") ? "Found" : "None"}`
);

try {
    // Perform the bump
    execSync(`npm version ${bumpType} --no-git-tag-version`);
} catch (error) {
    console.error(`Failed to bump version: ${error.message}`);
    process.exit(1);
}

// Get the new version
const newPkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const newVersion = newPkg.version;

// Update CHANGELOG.md
if (fs.existsSync(changelogPath)) {
    let changelog = fs.readFileSync(changelogPath, "utf8");
    const date = new Date().toISOString().split("T")[0];

    // Find [Unreleased] section
    const unreleasedHeader = "## [Unreleased]";
    const newHeader = `## [${newVersion}] - ${date}`;

    if (changelog.includes(unreleasedHeader)) {
        // Move [Unreleased] content to the new version
        // This is a simple replacement that assumes the format is correct
        changelog = changelog.replace(
            unreleasedHeader,
            `${unreleasedHeader}\n\n### Changed\n\n- No changes yet.\n\n${newHeader}`
        );
        fs.writeFileSync(changelogPath, changelog);
        console.info(
            `Updated CHANGELOG.md: created section for [${newVersion}]`
        );
    } else {
        console.warn("Could not find [Unreleased] header in CHANGELOG.md");
    }
}

console.info(`Successfully bumped version to ${newVersion}`);
