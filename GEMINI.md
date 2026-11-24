# Hunter

This extension connects Gemini CLI to the hosted Hunter MCP server (`https://mcp.hunter.io/mcp`). Hunter finds and verifies professional email addresses, enriches companies and people, and stores leads, lists, and sequences.

## Tools

Gemini CLI shows each Hunter tool as `mcp_hunter_<Tool-Name>`, for example `mcp_hunter_Email-Finder`. The skills use the short name, for example `Email-Finder`.

If the `hunter` server is not connected, tell the user to run `/mcp auth hunter` and sign in to Hunter in the browser.

## Skills

Before you call a Hunter tool, activate the skill for the job. Each skill gives the tool order, the credit cost, and how to read the result.

| Skill | Job |
|---|---|
| `hunter-email-finder` | Find the email of a named person at a company |
| `hunter-email-verifier` | Check if an email address can receive mail |
| `hunter-domain-search` | List the contacts at a company domain |
| `hunter-company-enrichment` | Get company details from a domain |
| `hunter-person-enrichment` | Get person details from an email address |
| `hunter-discover` | Find companies that match criteria and count their contacts (free) |
| `hunter-prospecting` | Run the full pipeline: discover, search, verify, save |
| `hunter-build-sequences` | Create, start, pause, and measure outreach sequences |
| `hunter-manage-leads` | Create, update, tag, and delete leads |
| `hunter-lead-lists` | Build and organize leads lists |
| `hunter-company-lists` | Save companies and organize company lists |
| `hunter-push-to-crm` | Send leads to the connected CRM |
| `hunter-check-usage` | Show the plan and the credits that remain |

## Rules for every Hunter task

- Before a paid operation on more than one item, call `Get-Usage`, give the estimated cost, and get approval once.
- For credits that remain, read the `remaining` field. Do not compute `available - used`.
- Before you delete data, push leads to a CRM, or do an action that sends email, state the operation and the count. Then wait for a "yes".
- `Find-Companies`, `Find-People`, and `Email-Count` are free. Use them to size a batch before you spend credits.
- `Find-People` returns email counts per company, not named people. To get contacts, use `Domain-Search`.
- If a tool returns an `error` envelope, show that error to the user. Do not report it as "no results".
