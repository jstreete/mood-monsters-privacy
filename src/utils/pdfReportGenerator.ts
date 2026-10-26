import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Incident } from '../types';
import { format, subDays, isAfter } from 'date-fns';

export interface ReportOptions {
  timeframeDays?: number; // 7, 30, 90, or undefined for all
  childName?: string;
  notes?: string;
}

/**
 * Generates an executive, IEP & clinician-ready PDF report for therapists,
 * pediatricians, schools, and parents.
 */
export async function generateAndSharePDFReport(
  incidents: Incident[],
  options: ReportOptions = {}
): Promise<void> {
  const { timeframeDays = 30, childName = 'Child', notes = '' } = options;

  // Filter by timeframe if specified
  const filtered = timeframeDays > 0
    ? incidents.filter((i) => isAfter(new Date(i.timestamp), subDays(new Date(), timeframeDays)))
    : incidents;

  const totalIncidents = filtered.length;
  const avgIntensity = totalIncidents > 0
    ? (filtered.reduce((acc, curr) => acc + curr.intensity, 0) / totalIncidents).toFixed(1)
    : '0.0';

  // High intensity count (4 or 5)
  const highIntensityCount = filtered.filter((i) => i.intensity >= 4).length;
  const highIntensityPct = totalIncidents > 0 ? Math.round((highIntensityCount / totalIncidents) * 100) : 0;

  // Behavior frequencies
  const behaviorCounts: Record<string, number> = {};
  const triggerCounts: Record<string, number> = {};
  const resolutionCounts: Record<string, number> = {};
  const timeOfDayCounts: Record<string, number> = {
    'Morning (6am-12pm)': 0,
    'Afternoon (12pm-5pm)': 0,
    'Evening (5pm-9pm)': 0,
    'Night (9pm-6am)': 0,
  };

  filtered.forEach((i) => {
    (i.behaviors || []).forEach((b) => (behaviorCounts[b] = (behaviorCounts[b] || 0) + 1));
    (i.triggers || []).forEach((t) => (triggerCounts[t] = (triggerCounts[t] || 0) + 1));
    (i.resolutions || []).forEach((r) => (resolutionCounts[r] = (resolutionCounts[r] || 0) + 1));

    const date = new Date(i.timestamp);
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) timeOfDayCounts['Morning (6am-12pm)']++;
    else if (hour >= 12 && hour < 17) timeOfDayCounts['Afternoon (12pm-5pm)']++;
    else if (hour >= 17 && hour < 21) timeOfDayCounts['Evening (5pm-9pm)']++;
    else timeOfDayCounts['Night (9pm-6am)']++;
  });

  const sortedBehaviors = Object.entries(behaviorCounts).sort((a, b) => b[1] - a[1]);
  const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
  const sortedResolutions = Object.entries(resolutionCounts).sort((a, b) => b[1] - a[1]);

  // Top time of day
  const peakTimeOfDay = Object.entries(timeOfDayCounts).sort((a, b) => b[1] - a[1])[0];

  const timeframeLabel = timeframeDays > 0 ? `Past ${timeframeDays} Days` : 'All Recorded History';

  const behaviorBars = sortedBehaviors
    .slice(0, 5)
    .map(([name, count]) => {
      const pct = totalIncidents > 0 ? Math.round((count / totalIncidents) * 100) : 0;
      return `
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px;">
            <span>${name}</span>
            <span style="color: #6B21A8;">${count} time(s) (${pct}%)</span>
          </div>
          <div style="background: #F3E8FF; height: 10px; border-radius: 6px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #9333EA, #A855F7); width: ${pct}%; height: 100%; border-radius: 6px;"></div>
          </div>
        </div>
      `;
    })
    .join('');

  const triggerChips = sortedTriggers
    .slice(0, 6)
    .map(([t, count]) => `<span class="chip chip-trigger">${t} (${count})</span>`)
    .join(' ');

  const resolutionChips = sortedResolutions
    .slice(0, 6)
    .map(([r, count]) => `<span class="chip chip-resolution">✓ ${r} (${count})</span>`)
    .join(' ');

  const incidentRows = filtered.slice(0, 35).map((inc) => {
    const formattedDate = format(new Date(inc.timestamp), 'MMM d, yyyy');
    const formattedTime = format(new Date(inc.timestamp), 'h:mm a');
    const intensityColor =
      inc.intensity >= 4 ? '#EF4444' : inc.intensity === 3 ? '#F59E0B' : '#10B981';
    
    return `
      <tr>
        <td style="white-space: nowrap;">
          <strong>${formattedDate}</strong><br/>
          <span style="font-size: 11px; color: #64748B;">${formattedTime}</span>
        </td>
        <td>
          <span style="display: inline-block; background: ${intensityColor}; color: white; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 11px;">
            Level ${inc.intensity}/5
          </span>
        </td>
        <td><strong>${inc.behaviors?.join(', ') || 'Unspecified'}</strong></td>
        <td>${inc.triggers?.join(', ') || 'None noted'}</td>
        <td style="color: #059669; font-weight: 500;">${inc.resolutions?.join(', ') || 'None recorded'}</td>
        <td style="font-size: 11px; color: #475569; max-width: 180px;">${inc.note ? `"${inc.note}"` : '—'}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Behavior & Incident Summary Report - ${childName}</title>
        <style>
          @page { margin: 25px 30px; size: letter portrait; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            background: #FFFFFF;
            margin: 0;
            padding: 0;
            line-height: 1.4;
          }
          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #7C3AED;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 800;
            color: #581C87;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .brand-subtitle {
            font-size: 13px;
            color: #64748B;
            margin: 3px 0 0 0;
          }
          .doc-badge {
            background: #F3E8FF;
            color: #7C3AED;
            border: 1px solid #DDD6FE;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            text-align: right;
          }
          .meta-banner {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 13px;
          }
          .stat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .stat-card {
            background: #FAF5FF;
            border: 1px solid #E9D5FF;
            border-radius: 10px;
            padding: 12px;
            text-align: center;
          }
          .stat-val {
            font-size: 24px;
            font-weight: 800;
            color: #6B21A8;
            margin-bottom: 2px;
          }
          .stat-lbl {
            font-size: 11px;
            font-weight: 600;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .section {
            margin-bottom: 22px;
          }
          .section-title {
            font-size: 15px;
            font-weight: 700;
            color: #1E293B;
            border-bottom: 1.5px solid #E2E8F0;
            padding-bottom: 6px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .columns-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
          }
          .box {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            padding: 14px;
          }
          .chip {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 14px;
            font-size: 12px;
            font-weight: 600;
            margin: 3px 2px;
          }
          .chip-trigger {
            background: #FEF3C7;
            color: #92400E;
            border: 1px solid #FDE68A;
          }
          .chip-resolution {
            background: #D1FAE5;
            color: #065F46;
            border: 1px solid #A7F3D0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 8px;
          }
          th {
            background: #F8FAFC;
            color: #475569;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 2px solid #CBD5E1;
            font-size: 11px;
            text-transform: uppercase;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #E2E8F0;
            vertical-align: top;
          }
          tr:nth-child(even) {
            background: #FAFAFA;
          }
          .provider-box {
            background: #F8FAFC;
            border: 1px dashed #94A3B8;
            border-radius: 8px;
            padding: 14px;
            margin-top: 24px;
            page-break-inside: avoid;
          }
          .signature-line {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
          }
          .sig-field {
            width: 45%;
            border-top: 1px solid #64748B;
            padding-top: 4px;
            font-size: 11px;
            color: #64748B;
          }
          .footer {
            margin-top: 24px;
            font-size: 10px;
            color: #94A3B8;
            text-align: center;
            border-top: 1px solid #E2E8F0;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header-container">
          <div>
            <h1 class="brand-title">Mood Monsters — Clinical Behavioral Summary</h1>
            <p class="brand-subtitle">Individualized Child Behavior & De-escalation Profile</p>
          </div>
          <div class="doc-badge">
            IEP & Medical Ready<br/>
            <span style="font-size: 10px; font-weight: normal; color: #6B21A8;">CONFIDENTIAL</span>
          </div>
        </div>

        <!-- Meta Banner -->
        <div class="meta-banner">
          <div><strong>Child:</strong> ${childName}</div>
          <div><strong>Period:</strong> ${timeframeLabel}</div>
          <div><strong>Generated:</strong> ${format(new Date(), 'MMMM d, yyyy')}</div>
          <div><strong>Total Logs:</strong> ${totalIncidents} incidents</div>
        </div>

        <!-- Stat Grid -->
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-val">${totalIncidents}</div>
            <div class="stat-lbl">Incidents Tracked</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: ${Number(avgIntensity) >= 3.5 ? '#EF4444' : '#6B21A8'}">${avgIntensity} / 5</div>
            <div class="stat-lbl">Average Severity</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #F59E0B;">${highIntensityPct}%</div>
            <div class="stat-lbl">Severe Incidents (4-5)</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="font-size: 16px; margin-top: 6px; color: #0284C7;">${peakTimeOfDay ? peakTimeOfDay[0].split(' ')[0] : 'N/A'}</div>
            <div class="stat-lbl">Peak Time Window</div>
          </div>
        </div>

        <!-- Two Column Breakdown -->
        <div class="columns-2 section">
          <!-- Top Behaviors -->
          <div class="box">
            <div class="section-title">Primary Behaviors Observed</div>
            ${behaviorBars || '<p style="color: #94A3B8; font-size: 13px;">No behavior patterns recorded.</p>'}
          </div>

          <!-- Triggers & Strategies -->
          <div class="box">
            <div class="section-title">Common Triggers (Antecedents)</div>
            <div style="margin-bottom: 14px;">
              ${triggerChips || '<span style="color: #94A3B8; font-size: 12px;">No triggers logged.</span>'}
            </div>

            <div class="section-title" style="margin-top: 14px;">Most Effective De-escalation Strategies</div>
            <div>
              ${resolutionChips || '<span style="color: #94A3B8; font-size: 12px;">No resolutions logged.</span>'}
            </div>
          </div>
        </div>

        ${notes ? `
          <div class="box" style="margin-bottom: 20px; background: #F8FAFC;">
            <strong style="font-size: 12px; color: #475569; text-transform: uppercase;">Parent Clinical Notes:</strong>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #1E293B;">${notes}</p>
          </div>
        ` : ''}

        <!-- Incident Table -->
        <div class="section">
          <div class="section-title">Detailed Incident Chronology (Most Recent First)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Date & Time</th>
                <th style="width: 12%;">Severity</th>
                <th style="width: 18%;">Behavior</th>
                <th style="width: 18%;">Triggers</th>
                <th style="width: 18%;">What Worked</th>
                <th style="width: 19%;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${incidentRows || '<tr><td colspan="6" style="text-align: center; color: #94A3B8; padding: 20px;">No incidents recorded in this timeframe.</td></tr>'}
            </tbody>
          </table>
          ${filtered.length > 35 ? `<p style="font-size: 11px; color: #64748B; margin-top: 6px; text-align: right;">Showing 35 most recent of ${filtered.length} total incidents in this timeframe.</p>` : ''}
        </div>

        <!-- Provider Review Section -->
        <div class="provider-box">
          <strong style="font-size: 12px; color: #334155; text-transform: uppercase;">Provider / Clinician Notes & IEP Observations:</strong>
          <div style="min-height: 40px; margin-top: 6px;"></div>
          <div class="signature-line">
            <div class="sig-field">Provider / Therapist Signature & Date</div>
            <div class="sig-field">Parent / Guardian Signature & Date</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          Mood Monsters Behavioral Health Suite • Encrypted On-Device Data • Formatted for HIPAA & IEP Documentation Consultations
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
}

/**
 * Generates and shares a structured, professional CSV data spreadsheet
 * for behavioral analysts, researchers, or parents.
 */
export async function generateAndShareCSVReport(
  incidents: Incident[],
  options: ReportOptions = {}
): Promise<void> {
  const { timeframeDays = 0, childName = 'Child' } = options;

  const filtered = timeframeDays > 0
    ? incidents.filter((i) => isAfter(new Date(i.timestamp), subDays(new Date(), timeframeDays)))
    : incidents;

  const headers = [
    'Incident ID',
    'Child Profile',
    'Date',
    'Time',
    'Intensity (1-5)',
    'Severity Level',
    'Primary Behaviors',
    'Identified Triggers',
    'De-escalation Strategies',
    'Notes / Reflection',
  ];

  const escapeCSV = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

  const rows = filtered.map((inc) => {
    const d = new Date(inc.timestamp);
    const dateStr = format(d, 'yyyy-MM-dd');
    const timeStr = format(d, 'HH:mm');
    const severityDesc = inc.intensity >= 4 ? 'Severe' : inc.intensity === 3 ? 'Moderate' : 'Mild';

    return [
      escapeCSV(inc.id),
      escapeCSV(childName),
      escapeCSV(dateStr),
      escapeCSV(timeStr),
      inc.intensity,
      escapeCSV(severityDesc),
      escapeCSV((inc.behaviors || []).join('; ')),
      escapeCSV((inc.triggers || []).join('; ')),
      escapeCSV((inc.resolutions || []).join('; ')),
      escapeCSV(inc.note || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  // Write file cleanly using expo-file-system for native file sharing
  const fileName = `Mood_Monsters_${childName.replace(/\s+/g, '_')}_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      UTI: 'public.comma-separated-values-text',
      mimeType: 'text/csv',
      dialogTitle: `Export ${childName}'s Mood Monsters Report`,
    });
  }
}
