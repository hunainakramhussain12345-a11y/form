MCP + Agent Skills Setup for Alpha Orbit

1) MCP config (VS Code)
- File: .vscode/mcp.json
- This project already contains an MCP config pointing to your MCP endpoint:

  {
    "servers": {
      "supabase": {
        "type": "http",
        "url": "https://mcp.supabase.com/mcp?project_ref=qitgpnugxjameulzhyoq"
      }
    }
  }

2) Install Agent Skills (one-liner)
- Run this in your project folder (requires npm):

  npx skills add supabase/agent-skills

- Or run the helper script:

  ./scripts/install-agent-skills.sh

3) Supabase project details (you provided)
- Project URL: https://qitgpnugxjameulzhyoq.supabase.co
- Public/anon key: sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM

4) Update `config.js` (if you want the form to write to this new DB)
- Edit `config.js` and set the `supabaseUrl` to `https://qitgpnugxjameulzhyoq.supabase.co`.
- Store the anon/public key in your local environment (do not commit it to the repo).

5) Migration cleanup and new consolidated migration
- All previous migration files in `migrations/` were removed and replaced with a single consolidated migration:

  migrations/001_create_sales_applications.sql

- This migration creates the `sales_applications` table, enables RLS, and adds a conservative `anon` insert policy with basic validation. Run it in the new project's SQL editor. Do not paste keys into the SQL file.

6) Security note

5) Security note
- The anon/public key is not secret but rotate it if it is exposed unintentionally.
- Do not commit service_role keys into this repo.

6) Next steps I can do for you
- Update `config.js` in this repo with the new project values (paste confirmation),
- Or generate a safe SQL migration to create the `sales_applications` table and policies in the new project (if you want me to).