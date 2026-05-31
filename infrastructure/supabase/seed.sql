-- Seed a single brand profile and default budgets for local dev.
-- Edit the brand niche/voice to match your channel before running content gen.

insert into brand_profiles (name, niche, voice, platforms)
values (
  'AICOS Demo Brand',
  'AI tools & autonomous workflows for builders',
  jsonb_build_object(
    'tone', 'confident, punchy, slightly futuristic',
    'personaDescription', 'A pragmatic AI engineer who ships fast and hates waste',
    'doList', jsonb_build_array('use concrete numbers', 'lead with a hook', 'stay on-brand'),
    'dontList', jsonb_build_array('no hype words', 'no emojis spam', 'no false claims'),
    'samplePosts', jsonb_build_array()
  ),
  '{instagram,youtube}'
)
on conflict do nothing;

insert into budgets (scope, scope_ref, daily_limit, monthly_limit) values
  ('global', null, 15.00, 300.00)
on conflict (scope, scope_ref) do nothing;
