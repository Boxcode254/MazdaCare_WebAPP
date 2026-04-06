// @ts-nocheck
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push'

interface VehicleRow {
  id: string
  user_id: string
  model: string
  current_mileage: number
}

interface ServiceLogRow {
  vehicle_id: string
  next_service_mileage: number | null
  service_date: string
}

interface PushSubscriptionRow {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidEmail = Deno.env.get('VAPID_CONTACT_EMAIL') ?? 'mailto:alerts@mazdacare.co.ke'

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)

    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, user_id, model, current_mileage')

    if (vehiclesError) throw vehiclesError

    const { data: logs, error: logsError } = await supabase
      .from('service_logs')
      .select('vehicle_id, next_service_mileage, service_date')
      .order('service_date', { ascending: false })

    if (logsError) throw logsError

    const latestByVehicle = new Map<string, ServiceLogRow>()
    for (const log of (logs ?? []) as ServiceLogRow[]) {
      if (!latestByVehicle.has(log.vehicle_id)) {
        latestByVehicle.set(log.vehicle_id, log)
      }
    }

    // Query vehicles where current_mileage >= (next_service_mileage - 500)
    const dueVehicles = ((vehicles ?? []) as VehicleRow[]).filter((vehicle) => {
      const latest = latestByVehicle.get(vehicle.id)
      if (!latest?.next_service_mileage) return false
      return vehicle.current_mileage >= latest.next_service_mileage - 500
    })

    if (dueVehicles.length === 0) {
      return new Response(
        JSON.stringify({ checkedVehicles: (vehicles ?? []).length, dueVehicles: 0, notificationsSent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const dueByUser = new Map<string, VehicleRow[]>()
    for (const vehicle of dueVehicles) {
      const list = dueByUser.get(vehicle.user_id) ?? []
      list.push(vehicle)
      dueByUser.set(vehicle.user_id, list)
    }

    const userIds = Array.from(dueByUser.keys())

    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', userIds)

    if (subsError) throw subsError

    let notificationsSent = 0

    for (const sub of (subscriptions ?? []) as PushSubscriptionRow[]) {
      const dueForUser = dueByUser.get(sub.user_id) ?? []
      if (dueForUser.length === 0) continue

      const payload = {
        title: 'MazdaCare Service Reminder',
        body:
          dueForUser.length === 1
            ? `Your ${dueForUser[0].model} is within 500 km of its next service.`
            : `${dueForUser.length} vehicles are due for service soon.`,
        url: '/',
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload),
        )
        notificationsSent += 1
      } catch (err) {
        const statusCode =
          err && typeof err === 'object' && 'statusCode' in err
            ? Number((err as { statusCode?: number }).statusCode)
            : undefined

        // Expired/invalid subscriptions are cleaned up.
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }

    return new Response(
      JSON.stringify({
        checkedVehicles: (vehicles ?? []).length,
        dueVehicles: dueVehicles.length,
        notificationsSent,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
