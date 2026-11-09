-- handle_new_user() gira solo come trigger su auth.users: non deve essere
-- richiamabile dall'API (/rest/v1/rpc/handle_new_user).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
