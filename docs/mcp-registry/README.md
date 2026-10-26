# Listing the MCP server in the official registry

The server is live at https://www.oversize-escort-hub.com/api/mcp (read-only, no login). The official registry (registry.modelcontextprotocol.io) is where AI apps and the other directories find servers; PulseMCP says it picks listings up from there.

## From a phone (no computer needed)
1. Open github.com/PettyMiggzy/Oversize-Escort-Hub in a browser (desktop-site mode helps) and tap Actions.
2. Tap "Publish MCP server to the registry" in the left list, then "Run workflow" > "Run workflow".
3. Wait about a minute and refresh. A green check means it is listed. A red X: open it and send Claude the last lines of the log.
4. Check: https://registry.modelcontextprotocol.io/v0.1/servers?search=oversize-escort-hub

It signs in with the repository's own GitHub identity, so no password, key or token is involved. The name in `server.json` (`io.github.PettyMiggzy/oversize-escort-hub`) must match the repo owner; if it says no permission, tell Claude (a lower-case name may be needed).

## From a computer (alternative)
Download `mcp-publisher` from https://github.com/modelcontextprotocol/registry/releases/latest, put `server.json` beside it, run `mcp-publisher login github`, approve the code at github.com/login/device, then `mcp-publisher publish`.

## Other directories (checked 2026-10-26)
- PulseMCP: not accepting submissions right now; it will copy from the official registry.
- mcp.so: asks for a repository URL and offers a $39 paid fast listing; skip unless the repository is public.
- Glama: has an "Add Server" button; what it requires was not visible without an account.
The registry is in preview, so its rules can change. Never paste a login code or token in chat.
