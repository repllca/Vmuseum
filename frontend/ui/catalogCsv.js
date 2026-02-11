
// ui/catalogCsv.js
// 依存なし・軽量CSVパーサ（ダブルクォート対応、カンマ区切り）

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"'; // escaped quote
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c === "\r") {
        // ignore
      } else {
        field += c;
      }
    }
  }

  // last field
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function toNum(x) {
  const v = Number(String(x ?? "").trim());
  return Number.isFinite(v) ? v : null;
}

export async function loadCatalogCsv(csvUrl) {
  const res = await fetch(csvUrl, { cache: "no-cache" });
  if (!res.ok) throw new Error(`failed to load csv: ${res.status} ${csvUrl}`);
  const text = await res.text();

  const table = parseCsv(text);
  if (table.length < 2) throw new Error("csv has no rows");

  const header = table[0].map((h) => h.trim());
  const idx = (name) => header.indexOf(name);

  const iF = idx("catalogF");
  if (iF === -1) throw new Error("csv missing column: catalogF");

  // 任意列
  const iTitle = idx("title");
  const iW = idx("width");
  const iH = idx("height");
  const iFile = idx("imagefilename");
  const iWiki = idx("wikimediaurl");
  const iYear = idx("year");

  const map = new Map();

  for (let r = 1; r < table.length; r++) {
    const row = table[r];
    const fid = String(row[iF] ?? "").trim();
    if (!fid) continue;

    map.set(fid, {
      id: fid,
      title_en: iTitle !== -1 ? String(row[iTitle] ?? "").trim() : "",
      year: iYear !== -1 ? String(row[iYear] ?? "").trim() : "",
      w_m: iW !== -1 ? toNum(row[iW]) : null,      // meter想定
      h_m: iH !== -1 ? toNum(row[iH]) : null,
      imagefilename: iFile !== -1 ? String(row[iFile] ?? "").trim() : "",
      wikimediaurl: iWiki !== -1 ? String(row[iWiki] ?? "").trim() : "",
    });
  }

  return map;
}
