How to test the new Supabase DB (quick commands)

Option A — curl (no Node required)

Replace `<PROJECT>` and `<ANON_KEY>` before running.

1) POST a test row:

```bash
curl -i -X POST "https://<PROJECT>.supabase.co/rest/v1/sales_applications" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"curl test","email":"curltest@example.com","position":"Tester"}'
```

2) Verify rows:

```bash
curl -s "https://<PROJECT>.supabase.co/rest/v1/sales_applications?select=*&order=created_at.desc&limit=5" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"
```

Option B — Node (requires Node 18+)

Set env vars and run the included script:

```bash
export SUPABASE_URL="https://<PROJECT>.supabase.co"
export SUPABASE_ANON_KEY="<ANON_KEY>"
node tests/test_submit.js
```

Notes
- Use the anon/public key only (do NOT use `service_role` keys in the browser or committed code).
- If the POST returns 201/200 and the GET returns the inserted row, the DB and policy are correctly configured.
- If you get a 401/403/422 error, check RLS policy and headers.
