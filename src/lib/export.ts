import type { ServiceLog, Vehicle } from '@/types'

export interface DateRange {
  from: Date
  to: Date
}

export interface ExportIncludeOptions {
  costs: boolean
  garage: boolean
  oil: boolean
  notes: boolean
}

function toDateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function filterByRange(logs: ServiceLog[], dateRange?: DateRange) {
  if (!dateRange) {
    return logs
  }

  const from = toDateOnly(dateRange.from).getTime()
  const to = toDateOnly(dateRange.to).getTime()

  return logs.filter((log) => {
    const logDate = new Date(log.serviceDate)
    if (Number.isNaN(logDate.getTime())) {
      return false
    }

    const normalized = toDateOnly(logDate).getTime()
    return normalized >= from && normalized <= to
  })
}

function normalizeText(value: string | undefined) {
  return (value ?? '').replace(/,/g, ';')
}

function normalizeServiceType(value: ServiceLog['serviceType']) {
  if (value === 'oil_change') return 'oil change'
  if (value === 'tyre_rotation') return 'tyre rotation'
  if (value === 'brake_service') return 'brake service'
  return value
}

export function exportToCSV(
  vehicle: Vehicle,
  logs: ServiceLog[],
  dateRange?: DateRange,
  includes: ExportIncludeOptions = { costs: true, garage: true, oil: true, notes: true }
) {
  const filteredLogs = filterByRange(logs, dateRange)

  const headers = ['Date', 'Service Type', 'Mileage (km)', 'Next Service (km)']
  if (includes.oil) {
    headers.push('Oil Brand', 'Oil Grade')
  }
  if (includes.garage) {
    headers.push('Garage')
  }
  if (includes.costs) {
    headers.push('Cost (KES)', 'Rating')
  }
  if (includes.notes) {
    headers.push('Notes')
  }

  const rows = filteredLogs.map((log) => {
    const row: Array<string | number> = [
      log.serviceDate,
      normalizeServiceType(log.serviceType),
      Math.round(log.mileageAtService ?? 0),
      Math.round(log.nextServiceMileage ?? 0),
    ]

    if (includes.oil) {
      row.push(log.oilBrand ?? '', log.oilGrade ?? '')
    }
    if (includes.garage) {
      row.push(log.garageName ?? '')
    }
    if (includes.costs) {
      row.push(Math.round(log.serviceCost ?? 0), Math.round(log.rating ?? 0) || '')
    }
    if (includes.notes) {
      row.push(normalizeText(log.notes))
    }

    return row
  })

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `MazdaCare_${vehicle.registration}_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportToPDF(
  vehicle: Vehicle,
  logs: ServiceLog[],
  dateRange?: DateRange,
  includes: ExportIncludeOptions = { costs: true, garage: true, oil: true, notes: true }
) {
  const filteredLogs = filterByRange(logs, dateRange)

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MazdaCare - ${vehicle.registration} Service History</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Outfit', sans-serif; color: #111010; padding: 32px; max-width: 800px; margin: auto; }
    .header { border-bottom: 2px solid #9B1B30; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: #9B1B30; margin-bottom: 6px; }
    .vehicle-name { font-size: 28px; font-weight: 300; color: #111010; }
    .vehicle-meta { font-size: 13px; color: #6B6163; margin-top: 4px; }
    .generated { font-size: 11px; color: #9B6163; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 0; }
    th { background: #111010; color: white; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 8px 10px; text-align: left; }
    td { padding: 8px 10px; font-size: 12px; border-bottom: 0.5px solid #F0ECEC; color: #3D3536; vertical-align: top; }
    tr:nth-child(even) td { background: #FDFBFB; }
    .type-badge { background: #F5E8EA; color: #9B1B30; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 0.5px solid #F0ECEC; font-size: 10px; color: #9B6163; text-align: center; }
    @media print { body { padding: 16px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">MazdaCare - Service History Report</div>
    <div class="vehicle-name">${vehicle.make} ${vehicle.model}</div>
    <div class="vehicle-meta">${vehicle.year} - ${vehicle.registration} - ${vehicle.fuelType} - ${vehicle.engineSize ?? ''}</div>
    <div class="generated">Generated: ${new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>
  <table>
    <thead><tr>
      <th>Date</th><th>Type</th><th>Mileage</th>${includes.garage ? '<th>Garage</th>' : ''}${includes.oil ? '<th>Oil</th>' : ''}${includes.costs ? '<th>Cost (KES)</th>' : ''}${includes.costs ? '<th>Rating</th>' : ''}${includes.notes ? '<th>Notes</th>' : ''}
    </tr></thead>
    <tbody>
      ${filteredLogs
        .map(
          (log) => `<tr>
        <td>${log.serviceDate}</td>
        <td><span class="type-badge">${normalizeServiceType(log.serviceType)}</span></td>
        <td>${Math.round(log.mileageAtService ?? 0).toLocaleString()} km</td>
        ${includes.garage ? `<td>${log.garageName ?? '-'}</td>` : ''}
        ${includes.oil ? `<td>${log.oilBrand ? `${log.oilBrand} ${log.oilGrade ?? ''}` : '-'}</td>` : ''}
        ${includes.costs ? `<td>${log.serviceCost ? Math.round(Number(log.serviceCost)).toLocaleString('en-KE') : '-'}</td>` : ''}
        ${includes.costs ? `<td>${log.rating ? '★'.repeat(Math.round(log.rating)) : '-'}</td>` : ''}
        ${includes.notes ? `<td>${log.notes ? normalizeText(log.notes) : '-'}</td>` : ''}
      </tr>`
        )
        .join('')}
    </tbody>
  </table>
  <div class="footer">MazdaCare - mazdacare-app.vercel.app - ${filteredLogs.length} service records</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

export function shareToWhatsApp(vehicle: Vehicle, logs: ServiceLog[], dateRange?: DateRange) {
  const filteredLogs = filterByRange(logs, dateRange)
  const recent = filteredLogs.slice(0, 3)
  const total = Math.round(filteredLogs.reduce((sum, l) => sum + (Number(l.serviceCost) || 0), 0))
  const lastLog = filteredLogs[0]

  const text = [
    `*MazdaCare - Service Summary*`,
    `Vehicle: ${vehicle.make} ${vehicle.model} ${vehicle.year} (${vehicle.registration})`,
    `Current mileage: ${Math.round(vehicle.currentMileage).toLocaleString()} km`,
    lastLog
      ? `Last service: ${normalizeServiceType(lastLog.serviceType)} on ${lastLog.serviceDate} at ${Math.round(lastLog.mileageAtService ?? 0).toLocaleString()} km`
      : '',
    lastLog?.garageName ? `Garage: ${lastLog.garageName}` : '',
    recent.length > 0 ? `Recent logs included: ${recent.length}` : '',
    `Total services logged: ${filteredLogs.length}`,
    total > 0 ? `Total maintenance spend: KES ${total.toLocaleString()}` : '',
    '',
    `_Tracked with MazdaCare - mazdacare-app.vercel.app_`,
  ]
    .filter(Boolean)
    .join('\n')

  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
}