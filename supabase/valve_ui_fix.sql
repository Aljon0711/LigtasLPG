-- Fix: valve button flickering (stale ESP32 telemetry overwrites app close/open).
-- Run in Supabase SQL Editor. Safe to re-run.

create or replace function public.report_device_telemetry(
  p_hardware_id text,
  p_api_key text,
  p_pressure_volts numeric,
  p_pressure_kpa numeric,
  p_flame_detected boolean,
  p_valve_open boolean,
  p_system_status text,
  p_emergency_latched boolean default false,
  p_alarm_active boolean default false,
  p_wifi_ssid text default null,
  p_signal_strength text default null,
  p_firmware_version text default null,
  p_uptime_seconds bigint default null,
  p_log_title text default null,
  p_log_description text default null,
  p_log_type text default null,
  p_log_icon text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device public.devices%rowtype;
  v_command text;
begin
  if p_hardware_id is null or p_api_key is null then
    raise exception 'hardware_id and api_key are required';
  end if;

  select * into v_device
  from public.devices
  where hardware_id = p_hardware_id
    and device_api_key = p_api_key
  limit 1;

  if not found then
    raise exception 'Invalid hardware credentials';
  end if;

  if p_system_status is null
     or p_system_status not in ('safe', 'warning', 'critical', 'offline') then
    p_system_status := 'safe';
  end if;

  update public.devices
  set
    pressure_volts = coalesce(p_pressure_volts, pressure_volts),
    pressure_kpa = coalesce(p_pressure_kpa, pressure_kpa),
    flame_detected = coalesce(p_flame_detected, flame_detected),
    valve_open = case
      when pending_command in ('close_valve', 'emergency_shutoff') then false
      when pending_command = 'open_valve' then true
      else coalesce(p_valve_open, valve_open)
    end,
    system_status = p_system_status,
    emergency_latched = coalesce(p_emergency_latched, emergency_latched),
    alarm_active = coalesce(p_alarm_active, alarm_active),
    wifi_ssid = coalesce(p_wifi_ssid, wifi_ssid),
    signal_strength = coalesce(p_signal_strength, signal_strength),
    firmware_version = coalesce(p_firmware_version, firmware_version),
    uptime_seconds = coalesce(p_uptime_seconds, uptime_seconds),
    last_seen_at = now(),
    updated_at = now()
  where id = v_device.id
  returning * into v_device;

  if p_log_title is not null and length(trim(p_log_title)) > 0 then
    insert into public.activity_logs (
      user_id,
      device_id,
      title,
      description,
      log_type,
      icon,
      icon_filled,
      has_report,
      pressure_kpa
    ) values (
      v_device.user_id,
      v_device.id,
      trim(p_log_title),
      p_log_description,
      coalesce(p_log_type, 'info'),
      coalesce(p_log_icon, 'info'),
      coalesce(p_log_type, 'info') in ('warning', 'critical', 'safe'),
      coalesce(p_log_type, 'info') in ('warning', 'critical'),
      p_pressure_kpa
    );
  end if;

  v_command := v_device.pending_command;

  return jsonb_build_object(
    'ok', true,
    'device_id', v_device.id,
    'pending_command', v_command,
    'pending_command_payload', v_device.pending_command_payload,
    'leak_sensitivity', (
      select leak_sensitivity
      from public.device_settings
      where device_id = v_device.id
      limit 1
    )
  );
end;
$$;

grant execute on function public.report_device_telemetry(
  text, text, numeric, numeric, boolean, boolean, text, boolean, boolean,
  text, text, text, bigint, text, text, text, text
) to anon, authenticated;

create or replace function public.ack_device_command(
  p_hardware_id text,
  p_api_key text,
  p_command text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device_id uuid;
begin
  update public.devices
  set
    pending_command = null,
    pending_command_payload = null,
    command_updated_at = now(),
    updated_at = now(),
    valve_open = case
      when p_command in ('close_valve', 'emergency_shutoff') then false
      when p_command in ('open_valve', 'reset_emergency') then true
      else valve_open
    end
  where hardware_id = p_hardware_id
    and device_api_key = p_api_key
    and pending_command is not distinct from p_command
  returning id into v_device_id;

  if v_device_id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_matching_command');
  end if;

  return jsonb_build_object('ok', true, 'device_id', v_device_id);
end;
$$;

grant execute on function public.ack_device_command(text, text, text)
  to anon, authenticated;
