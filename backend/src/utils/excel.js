const ExcelJS = require('exceljs');

/**
 * Reads an Excel file buffer and returns JSON rows from the first worksheet.
 */
async function readExcelAsJson(buffer, sheetIndex = 0) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[sheetIndex];
  if (!ws) return [];

  const rows = [];
  const headers = [];

  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = cell.value?.toString().trim() || `Column${colNumber}`;
      });
    } else {
      const obj = {};
      let hasData = false;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          let val = cell.value;
          // Handle formulas, rich text, etc.
          if (val && typeof val === 'object') {
            if (val.result !== undefined) val = val.result;
            else if (val.richText) val = val.richText.map(t => t.text).join('');
          }
          if (val !== undefined && val !== null && val !== '') {
            hasData = true;
          }
          obj[header] = val;
        }
      });
      if (hasData) rows.push(obj);
    }
  });

  return rows;
}

module.exports = {
  readExcelAsJson
};
