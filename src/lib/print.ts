import { Alert, Platform } from 'react-native';

function wrapHtml(title: string, inner: string) {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #141622; padding: 36px; max-width: 720px; margin: 0 auto; }
    .brand { color: #D4AF37; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; font-size: 12px; }
    h1 { margin: 8px 0 20px; font-size: 26px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 8px 0; border-bottom: 1px solid #ececec; font-size: 14px; }
    .gold { color: #D4AF37; font-weight: 800; }
    .muted { color: #666; font-size: 12px; }
    .total { font-size: 18px; font-weight: 800; margin-top: 16px; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <div class="brand">MyHotel</div>
  <h1>${title}</h1>
  ${inner}
  <p class="muted">Document généré le ${new Date().toLocaleString('fr-FR')} — Montants en FCFA (XAF)</p>
</body>
</html>`;
}

export function printHtml(title: string, inner: string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    Alert.alert('Impression', 'Ouvrez MyHotel sur le web pour imprimer ou enregistrer en PDF.');
    return;
  }
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=760,height=900');
  if (!popup) {
    window.alert('Autorisez les pop-ups pour imprimer.');
    return;
  }
  popup.document.write(wrapHtml(title, inner));
  popup.document.close();
  popup.focus();
  popup.print();
}

export function downloadReport(filename: string, title: string, inner: string) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    printHtml(title, inner);
    return;
  }
  const blob = new Blob([wrapHtml(title, inner)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pdf') || filename.endsWith('.html') ? filename.replace(/\.pdf$/i, '.html') : `${filename}.html`;
  link.click();
  URL.revokeObjectURL(url);
  printHtml(title, inner);
}

export function printReceipt(opts: {
  title: string;
  rows: [string, string][];
  total?: string;
  actor?: string;
}) {
  const rows = opts.rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  printHtml(
    opts.title,
    `<table>${rows}</table>
     ${opts.total ? `<p class="total">${opts.total}</p>` : ''}
     ${opts.actor ? `<p class="muted">Opérateur : ${opts.actor}</p>` : ''}`,
  );
}
