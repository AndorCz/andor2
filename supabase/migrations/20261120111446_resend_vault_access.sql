create view public.resend_api_key with (security_invoker = true, security_barrier = true) as
select decrypted_secret as api_key
from vault.decrypted_secrets
where name = 'resend';

revoke all on public.resend_api_key from public, anon, authenticated, service_role;
grant select on public.resend_api_key to service_role;
