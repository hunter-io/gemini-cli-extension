# Hunter for Gemini CLI

Find and verify professional email addresses, search contacts by domain, enrich company and person data, discover companies, organize leads and lists, run outreach sequences, and push to your CRM -- all through natural language in Gemini CLI.

The extension connects to the hosted Hunter MCP server (`https://mcp.hunter.io/mcp`). It ships the same **13 job-named skills** as the Cursor plugin, and the same jobs as the Claude plugin (`/hunter:email-finder` there is `hunter-email-finder` here). The skills are copies of `services/cursor-plugin/skills/`. A test fails when the two copies differ.

The public mirror is [`hunter-io/gemini-cli-extension`](https://github.com/hunter-io/gemini-cli-extension). Each merge to `master` that changes this folder syncs it to the mirror (see [Publish](#publish)).

## Installation

Install from the public mirror:

```sh
gemini extensions install https://github.com/hunter-io/gemini-cli-extension
```

Gemini CLI 0.70.0 to 0.71.1 cannot install an extension from a URL. The install stops with `Use of "GIT_CONFIG_SYSTEM" is not permitted` ([google-gemini/gemini-cli#30416](https://github.com/google-gemini/gemini-cli/issues/30416)). With these versions, clone the mirror and install from the folder:

```sh
git clone https://github.com/hunter-io/gemini-cli-extension
gemini extensions install ./gemini-cli-extension
```

An extension installed from a folder does not update itself. When a fixed Gemini CLI is out, install again from the URL.

To work on the extension, link a local checkout of this monorepo:

```sh
gemini extensions link /absolute/path/to/hunter/services/gemini-cli-extension
```

Restart Gemini CLI. Then run `gemini extensions list` and make sure that it shows the **hunter** MCP server and the 13 `hunter-*` agent skills.

Gemini CLI loads MCP servers only in trusted folders. If `gemini mcp list` shows **hunter** as disabled, start Gemini CLI in that folder and trust it when it asks.

## Authentication

Gemini CLI signs in to Hunter with OAuth. You do not need an API key.

1. Create a free Hunter account at [hunter.io/users/sign_up](https://hunter.io/users/sign_up) if you do not have one. The Free plan includes 50 credits a month. A search uses 1 credit and a verification 0.5.
2. Start Gemini CLI. When it asks to open the Hunter sign-in page, accept.
3. Sign in to Hunter in the browser and authorize **Gemini CLI MCP Client**.

To sign in again, run `/mcp auth hunter` in Gemini CLI. Gemini CLI stores the token and refreshes it when it expires.

The manifest gives no OAuth endpoints. The 401 response from `https://mcp.hunter.io/mcp` points Gemini CLI to the server metadata, and the metadata names `https://hunter.io` as the authorization server. Gemini CLI then registers itself with Hunter through dynamic client registration (`https://hunter.io/oauth/register`).

### Headless machines (API key)

OAuth needs a browser on the same machine. On a server or in a container, use an API key:

1. Create an API key at [hunter.io/api-keys](https://hunter.io/api-keys).
2. Export it as `HUNTER_API_KEY` in your shell.
3. Add this server to `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "hunter": {
      "httpUrl": "https://mcp.hunter.io/mcp",
      "headers": { "X-API-Key": "$HUNTER_API_KEY" }
    }
  }
}
```

A server in `settings.json` replaces the extension server with the same name. The skills and `GEMINI.md` stay active. Never put the key in git.

## Skills

Gemini CLI activates a skill when your request matches its description:

| Skill | What it does | Try saying... |
|-------|-------------|---------------|
| `hunter-email-finder` | Find someone's email from their name and company | "Find Jane Smith's email at Stripe" |
| `hunter-email-verifier` | Check if an email is deliverable | "Is jane@stripe.com valid?" |
| `hunter-domain-search` | List all contacts at a company | "Who works at notion.com?" |
| `hunter-company-enrichment` | Get company details from a domain | "Tell me about acme.com" |
| `hunter-person-enrichment` | Get person details from an email | "What do you know about jane@stripe.com?" |
| `hunter-discover` | Find companies by criteria and size their contacts (free) | "Fintech startups in France, 50-200 employees" |
| `hunter-prospecting` | Full end-to-end pipeline | "Build a prospect list of CTOs at fintech startups" |
| `hunter-build-sequences` | Create and run email outreach sequences | "Set up a 3-step sequence for my leads and start it" |
| `hunter-manage-leads` | Create, tag, and organize leads | "Tag these contacts 'priority'" |
| `hunter-lead-lists` | Build and organize leads lists | "Save these to a Q2 Outreach list" |
| `hunter-company-lists` | Save and organize target accounts | "Save these companies to Target Accounts" |
| `hunter-push-to-crm` | Sync leads to your connected CRM | "Push my Q2 leads to HubSpot" |
| `hunter-check-usage` | See your plan and remaining credits | "How many credits do I have left?" |

`GEMINI.md` loads into every session. It maps each job to its skill and gives the rules that apply to all Hunter tasks: credit approval, destructive actions, and error envelopes. The skills load only when Gemini CLI activates them.

Gemini CLI names each MCP tool `mcp_hunter_<Tool-Name>`, for example `mcp_hunter_Email-Finder`. The skills use the short name (`Email-Finder`).

## Credits

| Operation | Credit cost |
|-----------|------------|
| Domain Search | 1 credit per 10 results (rounded up; only if emails are found) |
| Email Finder | 1 credit (only if an email is found) |
| Email Verifier | 0.5 credits (valid, invalid, or accept_all) |
| Company / Person / Combined Enrichment | 0.2 credits on current plans (1 on a legacy two-bucket plan; only if data is found) |
| **Discover** (`Find-Companies` / `Find-People`) | **Free** |
| **Email Count** | **Free** |
| **Leads, lists, sequences, CRM push, saved searches, usage** | **Free** |

Gemini CLI asks for approval before it spends credits in bulk. It also asks before a destructive action: delete leads or lists, push to your CRM, or send email.

## Antigravity CLI

Since June 18, 2026, Antigravity CLI replaces Gemini CLI for unpaid and Google One users. Gemini CLI stays available with a paid Gemini API key and on Gemini Code Assist Standard and Enterprise. Antigravity CLI imports installed Gemini CLI extensions with `agy plugin import gemini`. We did not test this import with this package.

## Publish

The [Gemini CLI extensions gallery](https://geminicli.com/extensions/) indexes public GitHub repositories that have:

- `gemini-extension.json` at the repository root
- the `gemini-cli-extension` topic on the repository

The monorepo is private, so the gallery reads the public mirror [`hunter-io/gemini-cli-extension`](https://github.com/hunter-io/gemini-cli-extension), which has the `gemini-cli-extension` topic. On every push to `master` that touches this folder, `.github/workflows/plugin-sync.yml` mirrors `services/gemini-cli-extension/` onto the `main` branch of that repository. The Claude, ChatGPT, and Cursor packages use the same job. Edit here. Do not push to the public repository by hand.

The sync job reads the `GEMINI_CLI_EXTENSION_DEPLOY_KEY` secret, set on 2026-11-24. `gh repo deploy-key add` ties the deploy key to the `gh` token of the person who adds it. If that person revokes the `gh` authorization, GitHub removes the key and the sync fails. To replace the key, run:

```sh
ssh-keygen -t ed25519 -N "" -C "plugin-sync gemini-cli-extension" -f gemini-deploy-key
gh repo deploy-key add gemini-deploy-key.pub --repo hunter-io/gemini-cli-extension --allow-write --title "plugin-sync from hunter-io/hunter"
gh secret set GEMINI_CLI_EXTENSION_DEPLOY_KEY --repo hunter-io/hunter < gemini-deploy-key
rm gemini-deploy-key gemini-deploy-key.pub
```

The gallery crawls repositories with that topic once a day, and it has no submission step. The extension appears at [geminicli.com/extensions](https://geminicli.com/extensions/) if it passes the gallery validation.

## Development

```sh
cd services/gemini-cli-extension
npm test
```

The test checks the manifest, the MCP server and OAuth settings, the 13 skills, parity with `services/cursor-plugin/skills/`, `GEMINI.md`, and that no file contains a key.

## Links

- [Hunter.io](https://hunter.io)
- [API keys](https://hunter.io/api-keys)
- [API documentation](https://hunter.io/api-documentation)
- [Support](https://hunter.io/support)
- [Gemini CLI extensions docs](https://geminicli.com/docs/extensions/reference/)
- [Gemini CLI MCP and OAuth docs](https://geminicli.com/docs/tools/mcp-server/)
