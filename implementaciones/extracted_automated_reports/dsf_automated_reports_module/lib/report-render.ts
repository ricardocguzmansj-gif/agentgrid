export type ExecutiveSummaryPayload = {
  companyName: string;
  periodLabel: string;
  generatedAtIso: string;
  revenue: number;
  weightedForecast: number;
  openOpportunities: number;
  wonThisPeriod: number;
  lostThisPeriod: number;
  newConversations: number;
  byStage: Array<{ stage: string; count: number; amount: number }>;
  topSellers: Array<{ owner: string; revenue: number; wins: number }>;
};

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function renderExecutiveSummaryText(data: ExecutiveSummaryPayload): string {
  const lines = [
    `Reporte automático - ${data.companyName}`,
    `Período: ${data.periodLabel}`,
    `Generado: ${data.generatedAtIso}`,
    '',
    `Revenue: ${currency.format(data.revenue)}`,
    `Forecast ponderado: ${currency.format(data.weightedForecast)}`,
    `Oportunidades abiertas: ${data.openOpportunities}`,
    `Ganadas en el período: ${data.wonThisPeriod}`,
    `Perdidas en el período: ${data.lostThisPeriod}`,
    `Conversaciones nuevas: ${data.newConversations}`,
    '',
    'Pipeline por etapa:',
    ...data.byStage.map((row) => `- ${row.stage}: ${row.count} ops / ${currency.format(row.amount)}`),
    '',
    'Top vendedores:',
    ...data.topSellers.map((seller) => `- ${seller.owner}: ${seller.wins} cierres / ${currency.format(seller.revenue)}`),
  ];

  return lines.join('\n');
}

export function renderExecutiveSummaryHtml(data: ExecutiveSummaryPayload): string {
  const stages = data.byStage
    .map(
      (row) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(row.stage)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${row.count}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${currency.format(row.amount)}</td>
      </tr>`
    )
    .join('');

  const sellers = data.topSellers
    .map(
      (seller) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(seller.owner)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${seller.wins}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${currency.format(seller.revenue)}</td>
      </tr>`
    )
    .join('');

  return `
  <div style="font-family:Arial,sans-serif;color:#111;max-width:760px;margin:0 auto;">
    <h1 style="margin-bottom:4px;">Reporte automático</h1>
    <p style="margin-top:0;color:#666;">${escapeHtml(data.companyName)} · ${escapeHtml(data.periodLabel)}</p>

    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:24px 0;">
      ${metricCard('Revenue', currency.format(data.revenue))}
      ${metricCard('Forecast ponderado', currency.format(data.weightedForecast))}
      ${metricCard('Oportunidades abiertas', String(data.openOpportunities))}
      ${metricCard('Conversaciones nuevas', String(data.newConversations))}
    </div>

    <h2>Pipeline por etapa</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr>
          <th align="left" style="padding:8px;border-bottom:2px solid #111;">Etapa</th>
          <th align="right" style="padding:8px;border-bottom:2px solid #111;">Cantidad</th>
          <th align="right" style="padding:8px;border-bottom:2px solid #111;">Monto</th>
        </tr>
      </thead>
      <tbody>${stages}</tbody>
    </table>

    <h2>Top vendedores</h2>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          <th align="left" style="padding:8px;border-bottom:2px solid #111;">Vendedor</th>
          <th align="right" style="padding:8px;border-bottom:2px solid #111;">Cierres</th>
          <th align="right" style="padding:8px;border-bottom:2px solid #111;">Revenue</th>
        </tr>
      </thead>
      <tbody>${sellers}</tbody>
    </table>

    <p style="margin-top:24px;color:#666;font-size:12px;">Generado: ${escapeHtml(data.generatedAtIso)}</p>
  </div>`;
}

function metricCard(label: string, value: string) {
  return `
  <div style="border:1px solid #eee;border-radius:12px;padding:16px;">
    <div style="font-size:12px;color:#666;">${escapeHtml(label)}</div>
    <div style="font-size:28px;font-weight:700;margin-top:8px;">${escapeHtml(value)}</div>
  </div>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
