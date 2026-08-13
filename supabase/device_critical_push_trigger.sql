-- Optional backup if Database Webhook URL is hard to configure.
-- Calls the Edge Function when devices become critical.
-- Requires: pg_net extension enabled (Database → Extensions → pg_net)

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_emergency_push()
returns trigger
language plpgsql
security definer
as $$
declare
  became boolean;
  url text := 'https://vpwqtmppfxxthwcfupnr.supabase.co/functions/v1/send-emergency-push';
begin
  became :=
    (NEW.system_status = 'critical' or NEW.emergency_latched = true)
    and not (OLD.system_status = 'critical' or OLD.emergency_latched = true);

  if not became then
    return NEW;
  end if;

  perform net.http_post(
    url := url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'devices',
      'record', to_jsonb(NEW),
      'old_record', to_jsonb(OLD)
    )
  );

  return NEW;
end;
$$;

drop trigger if exists devices_emergency_push on public.devices;
create trigger devices_emergency_push
  after update on public.devices
  for each row
  execute function public.notify_emergency_push();
