const ExcelJS = require('exceljs');

async function run() {
    const filePath = 'c:\\Users\\hp\\OneDrive\\Desktop\\seahawk-full_stack\\BILLS\\DTDC-16 M.xlsx';
    try {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(filePath);
        const ws = wb.worksheets[0];
        
        const headers = [];
        ws.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
            headers.push(cell.value);
        });
        
        const sampleRow = [];
        ws.getRow(2).eachCell({ includeEmpty: true }, (cell) => {
          sampleRow.push(cell.value);
        });

        console.log('Headers:', headers);
        console.log('Sample Row:', sampleRow);
    } catch (e) {
        console.error(e.message);
    }
}

run();
