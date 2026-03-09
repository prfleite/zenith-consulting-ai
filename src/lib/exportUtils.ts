/**
 * Export data to CSV and trigger download
 */
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export data to branded HTML table and open print dialog (PDF)
 * Supports company branding (logo, primary color)
 */
export function exportToPDF(
  title: string,
  data: Record<string, any>[],
  columnLabels?: Record<string, string>,
  branding?: { companyName?: string; logoUrl?: string; primaryColor?: string }
) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const labels = columnLabels || {};
  const color = branding?.primaryColor || "#D4A843";
  const companyName = branding?.companyName || "";
  const logoUrl = branding?.logoUrl || "";

  const headerSection = logoUrl || companyName
    ? `<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid ${color}">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height:40px;max-width:120px;object-fit:contain" />` : ""}
        ${companyName ? `<span style="font-size:18px;font-weight:700;color:${color}">${companyName}</span>` : ""}
       </div>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; padding: 32px; color: #1a1a1a; }
      h1 { font-size: 22px; margin-bottom: 8px; color: ${color}; }
      .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #e0e0e0; padding: 10px 14px; text-align: left; }
      th { background: ${color}15; font-weight: 600; color: #333; border-bottom: 2px solid ${color}40; }
      tr:nth-child(even) { background: #fafafa; }
      .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999; text-align: center; }
      @media print { body { padding: 16px; } }
    </style></head><body>
    ${headerSection}
    <h1>${title}</h1>
    <p class="subtitle">Exportado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
    <table>
      <thead><tr>${headers.map((h) => `<th>${labels[h] || h}</th>`).join("")}</tr></thead>
      <tbody>${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    <div class="footer">${companyName ? `${companyName} · ` : ""}Documento gerado automaticamente</div>
    </body></html>
  `;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
