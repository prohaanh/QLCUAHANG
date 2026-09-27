-- Align legacy user_job_functions.function_id with the current application schema.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_job_functions'
      and column_name = 'function_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_job_functions'
      and column_name = 'job_function_id'
  ) then
    alter table public.user_job_functions
      rename column function_id to job_function_id;
  end if;
end
$$;

notify pgrst, 'reload schema';