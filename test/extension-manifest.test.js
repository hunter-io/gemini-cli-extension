const { test } = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.join(__dirname, "..")
// Present in the monorepo, absent in a public mirror of this folder.
const CURSOR_SKILLS = path.join(ROOT, "..", "cursor-plugin", "skills")

const SKILL_DIRS = [
  "hunter-build-sequences",
  "hunter-check-usage",
  "hunter-company-enrichment",
  "hunter-company-lists",
  "hunter-discover",
  "hunter-domain-search",
  "hunter-email-finder",
  "hunter-email-verifier",
  "hunter-lead-lists",
  "hunter-manage-leads",
  "hunter-person-enrichment",
  "hunter-prospecting",
  "hunter-push-to-crm",
]

const PRIMARY_TOOLS = {
  "hunter-build-sequences": ["Create-Sequence"],
  "hunter-check-usage": ["Get-Account-Details", "Get-Usage"],
  "hunter-company-enrichment": ["Company-Enrichment"],
  "hunter-company-lists": ["Save-Company"],
  "hunter-discover": ["Find-Companies", "Find-People"],
  "hunter-domain-search": ["Domain-Search", "Domain-Search-Found"],
  "hunter-email-finder": ["Email-Finder"],
  "hunter-email-verifier": ["Email-Verifier"],
  "hunter-lead-lists": ["Create-Leads-List"],
  "hunter-manage-leads": ["Create-Lead-If-Missing"],
  "hunter-person-enrichment": ["Person-Enrichment"],
  "hunter-prospecting": ["Find-Companies", "Domain-Search", "Email-Verifier"],
  "hunter-push-to-crm": ["Push-Leads-To-CRM"],
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"))
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8")
}

function skillPath(dir) {
  return `skills/${dir}/SKILL.md`
}

test("manifest names hunter, matches package.json, and loads GEMINI.md", () => {
  const manifest = readJson("gemini-extension.json")
  assert.equal(manifest.name, "hunter")
  assert.match(manifest.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/)
  assert.equal(manifest.version, readJson("package.json").version)
  assert.match(manifest.description, /Gemini CLI/)
  assert.equal(manifest.contextFileName, "GEMINI.md")
  assert.equal(fs.existsSync(path.join(ROOT, manifest.contextFileName)), true)
})

test("hunter server uses Streamable HTTP with OAuth, not a key header", () => {
  const hunter = readJson("gemini-extension.json").mcpServers.hunter
  // `url` is SSE in Gemini CLI; mcp.hunter.io answers /sse with 410.
  assert.equal(hunter.httpUrl, "https://mcp.hunter.io/mcp")
  assert.equal(hunter.url, undefined)
  assert.equal(hunter.headers, undefined)
  assert.equal(hunter.trust, undefined)

  // Explicit endpoints keep `/mcp auth hunter` off the discovery path, which
  // rejects the origin-level `resource` in mcp.hunter.io's RFC 9728 metadata.
  assert.deepEqual(hunter.oauth, {
    enabled: true,
    issuer: "https://hunter.io",
    authorizationUrl: "https://hunter.io/oauth/authorize",
    tokenUrl: "https://hunter.io/oauth/token",
    scopes: ["read", "write"],
    // With an issuer set, Gemini CLI otherwise demands an RFC 9207 `iss` on the callback.
    authorizationResponseIssParameterSupported: false,
  })
})

test("ships the 13 hunter-prefixed job-named skills covering the MCP surface", () => {
  const dirs = fs
    .readdirSync(path.join(ROOT, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  assert.deepEqual(dirs, [...SKILL_DIRS].sort())

  for (const dir of SKILL_DIRS) {
    const text = readText(skillPath(dir))
    assert.match(text, new RegExp(`^---\\nname: ${dir}\\ndescription: \\S`))
    assert.doesNotMatch(text, /\/hunter:/)
    assert.doesNotMatch(text, /Campaign-/)
    assert.doesNotMatch(text, /Cursor/)
    for (const tool of PRIMARY_TOOLS[dir]) {
      assert.match(text, new RegExp(tool))
    }
  }
})

test("skills match the Cursor plugin copy", { skip: !fs.existsSync(CURSOR_SKILLS) && "cursor-plugin not present" }, () => {
  for (const dir of SKILL_DIRS) {
    const cursor = fs.readFileSync(path.join(CURSOR_SKILLS, dir, "SKILL.md"), "utf8")
    assert.equal(readText(skillPath(dir)), cursor, `${dir} drifted from services/cursor-plugin; copy the change across`)
  }
})

test("GEMINI.md indexes every skill and states the shared rules", () => {
  const context = readText("GEMINI.md")
  for (const dir of SKILL_DIRS) {
    assert.match(context, new RegExp(`\`${dir}\``))
  }
  assert.match(context, /mcp_hunter_Email-Finder/)
  assert.match(context, /\/mcp auth hunter/)
  assert.match(context, /Get-Usage/)
  assert.match(context, /Do not compute `available - used`/)
  assert.match(context, /`error` envelope/)
  assert.match(context, /returns email counts per company, not named people/)
})

test("README covers install, OAuth, the API key fallback, and every skill", () => {
  const readme = readText("README.md")
  assert.match(readme, /gemini extensions link /)
  assert.match(readme, /gemini extensions install https:\/\/github\.com\//)
  assert.match(readme, /\/mcp auth hunter/)
  assert.match(readme, /"X-API-Key": "\$HUNTER_API_KEY"/)
  assert.match(readme, /13 job-named skills/)
  assert.match(readme, /50 credits a month/)
  assert.match(readme, /0\.5 credits \(valid, invalid, or accept_all\)/)
  assert.match(readme, /gemini-cli-extension` topic/)
  for (const dir of SKILL_DIRS) {
    assert.match(readme, new RegExp(`\`${dir}\``))
  }
})

test("extension files do not embed secrets", () => {
  const files = ["gemini-extension.json", "GEMINI.md", "README.md", ...SKILL_DIRS.map(skillPath)]
  for (const rel of files) {
    const text = readText(rel)
    assert.doesNotMatch(text, /hunter_[A-Za-z0-9]{8,}/)
    assert.doesNotMatch(text, /sk-[A-Za-z0-9]{10,}/)
    assert.doesNotMatch(text, /\b[0-9a-f]{40}\b/)
  }
})
