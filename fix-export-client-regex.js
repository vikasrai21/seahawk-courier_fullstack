const fs = require('fs');

const exportFunc = `
  const exportToCSV = async () => {
    try {
      const p = new URLSearchParams({
        range,
        ...(dSearch && { search: dSearch }),
        ...(status && { status })
      });
      const res = await api.get(\`/portal/shipments/export?\${p}\`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = \`client_shipments_\${new Date().toISOString().split('T')[0]}.csv\`;
      a.click();
    } catch (err) {
      toast?.('Export failed: ' + err.message, 'error');
    }
  };
`;

let c = fs.readFileSync('frontend/src/pages/client/ClientShipmentsPage.jsx', 'utf8');
c = c.replace(/const exportToCSV = \(\) => \{[\s\S]*?  \};/, exportFunc.trim());
fs.writeFileSync('frontend/src/pages/client/ClientShipmentsPage.jsx', c);
