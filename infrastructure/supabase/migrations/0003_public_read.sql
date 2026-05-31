-- Allow anonymous read on GitHub Pages (static site uses the public anon key).
-- Writes still require service role (Python agents) or authenticated admin.

do $$
declare t text;
begin
  foreach t in array array[
    'trends','content_items','ai_usage','budgets','audit_logs','cache_entries'
  ]
  loop
    execute format(
      'drop policy if exists public_read on %I;', t
    );
    execute format(
      'create policy public_read on %I for select to anon using (true);', t
    );
  end loop;
end $$;
