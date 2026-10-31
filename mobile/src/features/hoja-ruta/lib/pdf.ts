import type { HojaRutaPayloadData, HojaTotales } from "../types";
import { distritoFromDireccion, formatFechaPdf } from "./format";
import { hojaLogoDataUrl } from "./logo";

/** A4 horizontal en puntos, el mismo tamaño que el PDF de Cristian. */
export const HOJA_PDF_PAGE = { width: 842, height: 595 };

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellNum(n: number) {
  return n ? n.toFixed(2) : "";
}

export async function buildHojaRutaHtml(
  data: HojaRutaPayloadData,
  totales: HojaTotales,
): Promise<string> {
  const logo = await hojaLogoDataUrl();
  const minRows = Math.max(4, data.filas.length);
  const bodyRows: string[] = [];

  for (let i = 0; i < minRows; i += 1) {
    const fila = data.filas[i];
    if (!fila) {
      bodyRows.push(
        `<tr>${Array.from({ length: 12 }, () => "<td>&nbsp;</td>").join("")}</tr>`,
      );
      continue;
    }
    bodyRows.push(`
      <tr>
        <td>${esc(fila.localNombre)}</td>
        <td>${esc(distritoFromDireccion(fila.localDireccion))}</td>
        <td>${esc(fila.localDireccion)}</td>
        <td class="num">${cellNum(fila.galones)}</td>
        <td class="num">${cellNum(fila.galonesPrecio)}</td>
        <td class="num">${cellNum(fila.galones * fila.galonesPrecio)}</td>
        <td class="num">${cellNum(fila.baldes)}</td>
        <td class="num">${cellNum(fila.baldesPrecio)}</td>
        <td class="num">${cellNum(fila.baldes * fila.baldesPrecio)}</td>
        <td class="num">${cellNum(fila.litros)}</td>
        <td class="num">${cellNum(fila.litrosPrecio)}</td>
        <td class="num">${cellNum(fila.litros * fila.litrosPrecio)}</td>
      </tr>
    `);
  }

  const gastosVisibles = data.gastos.filter((g) => g.descripcion.trim() || g.monto);
  const minGastos = Math.max(4, gastosVisibles.length);
  const gastosRows: string[] = [];
  for (let i = 0; i < minGastos; i += 1) {
    const g = gastosVisibles[i];
    gastosRows.push(`
      <tr>
        <td>${g ? esc(g.descripcion) : "&nbsp;"}</td>
        <td class="num">${g && g.monto ? cellNum(g.monto) : ""}</td>
      </tr>
    `);
  }

  const fechaLabel = formatFechaPdf(data.fecha);
  const logoCell = logo
    ? `<img src="${logo}" alt="BIOCLIM" />`
    : `<div class="logo-fallback">BIOCLIM</div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 9px;
    color: #000;
    width: 281mm;
  }
  .head {
    display: table;
    width: 100%;
    border: 0.4mm solid #000;
    border-collapse: collapse;
    height: 28mm;
  }
  .head-logo, .head-main { display: table-cell; vertical-align: middle; }
  .head-logo {
    width: 35mm;
    border-right: 0.4mm solid #000;
    text-align: center;
    padding: 2mm;
  }
  .head-logo img { max-width: 31mm; max-height: 22mm; }
  .logo-fallback { font-size: 9px; font-weight: bold; }
  .head-main { padding: 0 2mm 2mm; }
  .title {
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 0.4px;
    padding: 2mm 0 1.5mm;
    border-bottom: 0.3mm solid #000;
    margin-bottom: 2mm;
  }
  .meta { width: 100%; border-collapse: collapse; }
  .meta td { padding: 1.2mm 2mm 0; vertical-align: bottom; width: 33.33%; }
  .lbl { font-weight: bold; font-size: 8px; }
  .val {
    display: inline-block;
    min-width: 38mm;
    border-bottom: 0.2mm solid #000;
    padding: 0 1mm 0.4mm;
    font-size: 8.5px;
  }
  .bv { font-weight: bold; font-size: 9px; padding-top: 4mm; }
  table.main { width: 100%; border-collapse: collapse; margin-top: 3mm; table-layout: fixed; }
  table.main th, table.main td {
    border: 0.2mm solid #000;
    padding: 1mm 1.1mm;
    font-size: 6.8px;
    vertical-align: middle;
  }
  table.main th {
    background: #dcdcdc;
    font-size: 6.5px;
    text-align: center;
  }
  .num { text-align: right; white-space: nowrap; }
  .total-row td { background: #f0f0f0; font-weight: bold; }
  .footer { margin-top: 3mm; width: 100%; border-collapse: collapse; }
  .footer > tbody > tr > td { width: 50%; vertical-align: top; padding: 0 2mm 0 0; }
  .footer > tbody > tr > td + td { padding: 0 0 0 2mm; }
  .box { width: 100%; border-collapse: collapse; }
  .box th, .box td { border: 0.2mm solid #000; padding: 1.3mm 1.5mm; font-size: 8px; }
  .box th { background: #dcdcdc; text-align: center; font-size: 8px; }
  .resumen td { font-size: 9px; font-weight: bold; }
  .vuelto { color: #1B5E20; font-size: 11px; }
</style>
</head>
<body>
  <div class="head">
    <div class="head-logo">${logoCell}</div>
    <div class="head-main">
      <div class="title">HOJA DE RUTA</div>
      <table class="meta">
        <tr>
          <td><span class="lbl">NOMBRE DE CHOFER:</span> <span class="val">${esc(data.chofer)}</span></td>
          <td><span class="lbl">FECHA:</span> <span class="val">${esc(fechaLabel)}</span></td>
          <td class="bv">B.V. = BALDES VACIOS</td>
        </tr>
        <tr>
          <td><span class="lbl">NOMBRE DE OPERADOR:</span> <span class="val">${esc(data.operadorAcompanante || "")}</span></td>
          <td><span class="lbl">PLACA:</span> <span class="val">${esc(data.placa || "")}</span></td>
          <td></td>
        </tr>
      </table>
    </div>
  </div>
  <table class="main">
    <thead>
      <tr>
        <th style="width:16%">NOMBRE DE LOCAL</th>
        <th style="width:9%">DISTRITO</th>
        <th style="width:21%">DIRECCION</th>
        <th>GALONES</th><th>P. UNIT.</th><th>P. TOTAL</th>
        <th>B.V</th><th>P. UNIT.</th><th>P. TOTAL</th>
        <th>LITROS</th><th>P. UNIT.</th><th>P. TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows.join("")}
      <tr class="total-row">
        <td></td><td></td><td class="num">TOTAL</td>
        <td></td><td></td><td class="num">${cellNum(totales.sumGalones)}</td>
        <td></td><td></td><td class="num">${cellNum(totales.sumBaldes)}</td>
        <td></td><td></td><td class="num">${cellNum(totales.sumLitros)}</td>
      </tr>
    </tbody>
  </table>
  <table class="footer">
    <tr>
      <td>
        <table class="box">
          <thead><tr><th colspan="2">GASTOS PERSONALES</th></tr></thead>
          <tbody>${gastosRows.join("")}</tbody>
        </table>
      </td>
      <td>
        <table class="box resumen">
          <tr><td>CAJA:</td><td class="num">${data.caja.toFixed(2)}</td></tr>
          <tr><td>GASTO:</td><td class="num">${totales.sumGastos.toFixed(2)}</td></tr>
          <tr><td>TOTAL:</td><td class="num">${totales.totalGeneral.toFixed(2)}</td></tr>
          <tr><td class="vuelto">VUELTO:</td><td class="num vuelto">${totales.vuelto.toFixed(2)}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
