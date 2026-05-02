const fs = require('fs');

const exportFunc = `
  const exportCSV = async () => {
    setExporting(true);
    try {
      const p = new URLSearchParams({
        sortBy, sortDir,
        ...(debouncedSearch       && { search:     debouncedSearch }),
        ...(filters.courier    && { courier:     filters.courier }),
        ...(filters.status     && { status:      filters.status }),
        ...(filters.clientCode && { clientCode:  filters.clientCode }),
        ...(filters.dateFrom   && { dateFrom:    filters.dateFrom }),
        ...(filters.dateTo     && { dateTo:      filters.dateTo }),
        ...(filters.filter     && { filter:      filters.filter }),
      });
      const res = await api.get(\`/shipments/export?\${p}\`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = \`shipments-\${new Date().toISOString().slice(0,10)}.csv\`;
      a.click();
    } catch (err) {
      toast?.('Export failed: ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  };
`;

let c = fs.readFileSync('frontend/src/pages/ShipmentDashboardPage.jsx', 'utf8');
c = c.replace(/const exportCSV = \(\) => \{[\s\S]*?  \};/, exportFunc.trim());
fs.writeFileSync('frontend/src/pages/ShipmentDashboardPage.jsx', c);
