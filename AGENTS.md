# JS Event Loop Visualizer

Educational app built with Google Stitch MCP that illustrates the JavaScript event loop.

## Structure

- `index.html` — app hub/launcher
- `screens/` — 5 screens generated via Google Stitch MCP
- `.ai/mcp/mcp.json` — MCP server config (stitch, playwright)
- `.gitignore` — ignores `.idea/` and `.ai/`

## MCP Servers

Configured in `.ai/mcp/mcp.json`. Stitch MCP is a remote server at `stitch.googleapis.com/mcp` using an API key for authentication. Tools: `create_project`, `generate_screen_from_text`, `edit_screens`, `list_screens`, `get_screen`, `list_projects`, `get_project`, design system tools.

## How to Use

Open `index.html` in a browser (no build step needed — standalone HTML with Tailwind CSS via CDN).

## Google Stitch

To regenerate or add screens:
- Requires Google Cloud project with Stitch API enabled
- API key in `.ai/mcp/mcp.json`
- Call `generate_screen_from_text` MCP tool with `projectId` and `prompt`
