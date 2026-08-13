-- Run this if you ALREADY have a working Database Webhook for push.
-- Having BOTH webhook + SQL trigger sends TWO notifications.

drop trigger if exists devices_emergency_push on public.devices;
drop function if exists public.notify_emergency_push();
