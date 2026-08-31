-- =============================================================================
-- JobPrepOS local dev seed
-- Password: 123123123
--
-- Account:
--   contact@jobprepos.com  (admin)
-- =============================================================================

create or replace function public.seed_dev_auth_user(
  p_user_id uuid,
  p_email text,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at,
    is_anonymous
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    p_user_id,
    'authenticated',
    'authenticated',
    lower(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf', 12)),
    now(),
    null,
    '',
    null,
    '',
    null,
    '',
    '',
    null,
    null,
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('display_name', 'Test User'),
    null,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null,
    false,
    null,
    false
  )
  on conflict (id) do update
  set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now(),
    confirmation_token = '',
    email_change = '',
    email_change_token_new = '',
    recovery_token = '';

  delete from auth.identities
  where user_id = p_user_id
    and provider = 'email';

  insert into auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    p_user_id,
    'email',
    p_user_id::text,
    jsonb_build_object(
      'sub', p_user_id::text,
      'email', lower(p_email),
      'email_verified', true,
      'phone_verified', false
    ),
    now(),
    now(),
    now()
  );
end;
$$;

do $$
declare
  v_pass text := '123123123';
  v_test_user_id uuid := 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
begin
  perform public.seed_dev_auth_user(v_test_user_id, 'contact@jobprepos.com', v_pass);

  update app.profiles
  set
    display_name = 'Test User',
    is_admin = true
  where id = v_test_user_id;
end $$;
