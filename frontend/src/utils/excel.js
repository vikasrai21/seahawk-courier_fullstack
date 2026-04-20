let excelJsLoader = null;

async function loadExcelJs() {
  if (!excelJsLoader) {
    excelJsLoader = import('exceljs');
  }
  const mod = await excelJsLoader;
  return mod.default || mod;
}

export function getSheetAsJson(wb, sheetIndex = 0) {
  const sheetNames = wb.worksheets.map(s => s.name);
  const ws = wb.worksheets[sheetIndex];
  if (!ws) return { rows: [], sheetNames };

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
          if (val && typeof val === 'object') {
             if (val.result !== undefined) val = val.result;
             else if (val.richText) val = val.richText.map(t => t.text).join('');
          }
          if (val instanceof Date) {
            val = val.toISOString().split('T')[0];
          }
          if (val !== undefined && val !== null && val !== '') {
            hasData = true;
          }
          obj[header] = val ?? '';
        }
      });
      if (hasData) rows.push(obj);
    }
  });

  return { rows, sheetNames };
}

export async function readExcelAsJson(arrayBuffer, sheetIndex = 0) {
  const ExcelJS = await loadExcelJs();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arrayBuffer);
  const data = getSheetAsJson(wb, sheetIndex);
  return { ...data, rawWorkbook: wb };
}

export async function advancedExportToExcel(config = {}, fileName = 'report.xlsx') {
  const ExcelJS = await loadExcelJs();
  const wb = new ExcelJS.Workbook();
  
  const { sheets = [] } = config;
  
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name || 'Sheet');
    if (s.columns) {
      ws.columns = s.columns;
    }
    
    if (s.data && s.mode === 'json') {
      ws.addRows(s.data);
    } else if (s.data && s.mode === 'aoa') {
      s.data.forEach(row => ws.addRow(row));
    }

    if (s.columnWidths) {
      s.columnWidths.forEach((w, i) => {
        const col = ws.getColumn(i + 1);
        if (col) col.width = w;
      });
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function exportJsonToExcel(data, fileName = 'export.xlsx', sheetName = 'Sheet1') {
  return advancedExportToExcel({
    sheets: [{
      name: sheetName,
      mode: 'json',
      data,
      columns: data.length > 0 ? Object.keys(data[0]).map(k => ({ header: k, key: k })) : []
    }]
  }, fileName);
}
