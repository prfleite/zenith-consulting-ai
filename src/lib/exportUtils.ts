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
 * Export data to simple HTML table and open print dialog (PDF)
 */
export function exportToPDF(title: string, data: Record<string, any>[], columnLabels?: Record<string, string>) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const labels = columnLabels || {};

  const html = `
    <!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #1a1a1a; }
      h1 { font-size: 20px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
      th { background: #f5f5f5; font-weight: 600; }
      tr:nth-child(even) { background: #fafafa; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <h1>${title}</h1>
    <p style="color:#666;font-size:12px;margin-bottom:12px;">Exportado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
    <table>
      <thead><tr>${headers.map((h) => `<th>${labels[h] || h}</th>`).join("")}</tr></thead>
      <tbody>${data.map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
    </body></html>
  `;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}
