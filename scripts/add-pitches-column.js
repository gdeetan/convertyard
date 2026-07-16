const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function addPitchesColumn() {
  const xlsxPath = path.join(__dirname, '../SEO/outreach-targets.xlsx');
  const pitchesPath = path.join(__dirname, '../SEO/pitches/all-pitches.json');
  const pitches = JSON.parse(fs.readFileSync(pitchesPath, 'utf8'));

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);

  const sheet = wb.getWorksheet(2);
  if (!sheet) { console.error('Sheet 2 not found'); process.exit(1); }

  // Find header row columns
  const headerRow = sheet.getRow(1);
  let nameCol = 1, clusterCol = 0, lastCol = 0;
  headerRow.eachCell((cell, col) => {
    const v = String(cell.value || '').trim();
    if (v === 'Name') nameCol = col;
    if (v === 'Tool Cluster') clusterCol = col;
    lastCol = Math.max(lastCol, col);
  });

  console.log(`Name col: ${nameCol}, Cluster col: ${clusterCol}, Last col: ${lastCol}`);

  const pitchCol = lastCol + 1;
  headerRow.getCell(pitchCol).value = 'Pitches';
  headerRow.commit();

  let matched = 0;
  const unmatched = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const name = String(row.getCell(nameCol).value || '').trim();
    const cluster = clusterCol ? String(row.getCell(clusterCol).value || '').trim() : '';
    if (!name) return;

    // Try exact match first, then disambiguated
    const entry = pitches[name] || pitches[`${name} (${cluster})`];
    if (entry) {
      let text = entry.body || '';
      if (entry.subject) text = `Subject: ${entry.subject}\n\n${text}`;
      row.getCell(pitchCol).value = text;
      row.commit();
      matched++;
    } else {
      unmatched.push(cluster ? `${name} (${cluster})` : name);
    }
  });

  await wb.xlsx.writeFile(xlsxPath);
  console.log(`\nDone. Matched: ${matched} / Unmatched: ${unmatched.length}`);
  if (unmatched.length) console.log('Unmatched:\n' + unmatched.join('\n'));
}

addPitchesColumn().catch(console.error);
