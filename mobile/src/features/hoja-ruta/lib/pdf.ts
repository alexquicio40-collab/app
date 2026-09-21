import type { HojaRutaPayloadData, HojaTotales } from "../types";
import { distritoFromDireccion, formatFechaPdf, formatMoney } from "./format";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellMoney(n: number) {
  if (!n) return "";
  return esc(formatMoney(n));
}

function cellQty(n: number) {
  if (!n) return "";
  return String(n);
}

export function buildHojaRutaHtml(
  data: HojaRutaPayloadData,
  totales: HojaTotales,
): string {
  const minRows = Math.max(8, data.filas.length);
  const bodyRows: string[] = [];

  for (let i = 0; i < minRows; i += 1) {
    const fila = data.filas[i];
    if (!fila) {
      bodyRows.push(
        `<tr>${Array.from({ length: 12 }, () => "<td>&nbsp;</td>").join("")}</tr>`,
      );
      continue;
    }
    const tG = fila.galones * fila.galonesPrecio;
    const tB = fila.baldes * fila.baldesPrecio;
    const tL = fila.litros * fila.litrosPrecio;
    bodyRows.push(`
      <tr>
        <td>${esc(fila.localNombre)}</td>
        <td>${esc(distritoFromDireccion(fila.localDireccion))}</td>
        <td>${esc(fila.localDireccion)}</td>
        <td class="num">${cellQty(fila.galones)}</td>
        <td class="num">${cellMoney(fila.galonesPrecio)}</td>
        <td class="num">${cellMoney(tG)}</td>
        <td class="num">${cellQty(fila.baldes)}</td>
        <td class="num">${cellMoney(fila.baldesPrecio)}</td>
        <td class="num">${cellMoney(tB)}</td>
        <td class="num">${cellQty(fila.litros)}</td>
        <td class="num">${cellMoney(fila.litrosPrecio)}</td>
        <td class="num">${cellMoney(tL)}</td>
      </tr>
    `);
  }

  const gastosRows: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    const g = data.gastos[i];
    gastosRows.push(`
      <tr>
        <td>${g ? esc(g.descripcion) : "&nbsp;"}</td>
        <td class="num">${g && g.monto ? esc(formatMoney(g.monto)) : "&nbsp;"}</td>
      </tr>
    `);
  }

  const fechaLabel = formatFechaPdf(data.fecha.slice(0, 10));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: #111; }
  h1 { font-size: 16px; margin: 0 0 6px; }
  .meta { margin-bottom: 10px; }
  .meta td { padding: 2px 8px 2px 0; }
  table.main { width: 100%; border-collapse: collapse; }
  table.main th, table.main td { border: 1px solid #333; padding: 3px 4px; }
  table.main th { background: #eee; font-size: 8px; }
  .num { text-align: right; white-space: nowrap; }
  .footer { margin-top: 12px; width: 100%; }
  .footer-table { width: 100%; border-collapse: collapse; }
  .footer-table > tbody > tr > td { vertical-align: top; width: 50%; padding: 0 6px; }
  .box { border-collapse: collapse; width: 100%; }
  .box th, .box td { border: 1px solid #333; padding: 4px; }
  .vuelto { font-weight: bold; color: #0B5340; }
  .note { margin-top: 6px; font-size: 8px; color: #555; }
</style>
</head>
<body>
  <h1>HOJA DE RUTA</h1>
  <table class="meta">
    <tr><td><b>CHOFER</b></td><td>${esc(data.chofer)}</td><td><b>FECHA</b></td><td>${esc(fechaLabel)}</td></tr>
    <tr><td><b>OPERADOR</b></td><td>${esc(data.operadorAcompanante || "—")}</td><td><b>PLACA</b></td><td>${esc(data.placa || "—")}</td></tr>
  </table>
  <div class="note">B.V. = BALDES VACIOS</div>
  <table class="main">
    <thead>
      <tr>
        <th>NOMBRE DE LOCAL</th><th>DISTRITO</th><th>DIRECCION</th>
        <th>GALONES</th><th>P. UNIT.</th><th>P. TOTAL</th>
        <th>B.V</th><th>P. UNIT.</th><th>P. TOTAL</th>
        <th>LITROS</th><th>P. UNIT.</th><th>P. TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows.join("")}
      <tr>
        <td colspan="3"><b>TOTAL</b></td>
        <td></td><td></td><td class="num"><b>${esc(formatMoney(totales.sumGalones))}</b></td>
        <td></td><td></td><td class="num"><b>${esc(formatMoney(totales.sumBaldes))}</b></td>
        <td></td><td></td><td class="num"><b>${esc(formatMoney(totales.sumLitros))}</b></td>
      </tr>
    </tbody>
  </table>
  <div class="footer">
    <table class="footer-table">
      <tr>
        <td>
          <table class="box">
            <thead><tr><th colspan="2">GASTOS PERSONALES</th></tr></thead>
            <tbody>${gastosRows.join("")}</tbody>
          </table>
        </td>
        <td>
          <table class="box">
            <tr><td>CAJA</td><td class="num">${esc(formatMoney(data.caja))}</td></tr>
            <tr><td>GASTO</td><td class="num">${esc(formatMoney(totales.sumGastos))}</td></tr>
            <tr><td>TOTAL</td><td class="num">${esc(formatMoney(totales.totalGeneral))}</td></tr>
            <tr><td class="vuelto">VUELTO</td><td class="num vuelto">${esc(formatMoney(totales.vuelto))}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
