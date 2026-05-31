-- Row Level Security for the single-admin MVP.
-- All app tables are admin-only via authenticated session; the Python agent
-- layer uses the service role key (bypasses RLS) for server-side writes.

alter table brand_profiles  enable row level security;
alter table trends          enable row level security;
alter table strategies      enable row level security;
alter table content_items   enable row level security;
alter table media_assets    enable row level security;
alter table publications    enable row level security;
alter table analytics       enable row level security;
alter table ai_usage        enable row level security;
alter table budgets         enable row level security;
alter table prompt_templates enable row level security;
alter table cache_entries   enable row level security;
alter table commands        enable row level security;
alter table audit_logs      enable row level security;

-- Authenticated admin can do everything (single-admin model).
do $$
declare t text;
begin
  foreach t in array array[
    'brand_profiles','trends','strategies','content_items','media_assets',
    'publications','analytics','ai_usage','budgets','prompt_templates',
    'cache_entries','commands','audit_logs'
  ]
  loop
    execute format(
      'drop policy if exists admin_all on %I;', t
    );
    execute format(
      'create policy admin_all on %I for all to authenticated using (true) with check (true);', t
    );
  end loop;
end $$;
