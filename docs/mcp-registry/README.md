# Listing the MCP server in the official registry (owner steps, about 10 minutes)

The server is live at https://www.oversize-escort-hub.com/api/mcp (read-only, no login). The official registry (registry.modelcontextprotocol.io) is where AI apps and the other directories find servers; most directories copy from it.

1. On your computer, install the publisher: https://github.com/modelcontextprotocol/registry/releases/latest (Windows: `mcp-publisher_windows_amd64.tar.gz`, unzip it, open a terminal in that folder).
2. Put the `server.json` from this folder in the same folder.
3. Run `mcp-publisher login github`. It prints a code and a link; open the link, enter the code, approve. Use the GitHub account that owns the repo (PettyMiggzy). The name in server.json (`io.github.PettyMiggzy/oversize-escort-hub`) must match that account; if it says you have no permission, try the account name in lower case.
4. Run `mcp-publisher publish`.
5. Check: https://registry.modelcontextprotocol.io/v0.1/servers?search=oversize-escort-hub

Other directories that accept a link by hand (free): Smithery, mcp.so, PulseMCP, Glama. They ask for the URL above and the one-line description in server.json.
The registry is in preview; its rules can change. Nothing secret is in the file or the steps. Never paste a login code or token in chat.
