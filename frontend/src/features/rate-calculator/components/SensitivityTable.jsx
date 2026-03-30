import React from 'react';

export default function SensitivityTable({
  locInfo,
  shipType,
  visibleCouriers,
  sensitivityData,
  chargeWt,
  getPerCourierSell,
  rnd,
  fmt,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="font-bold text-sm text-gray-700">Weight Sensitivity — Cost at Different Weights</h2>
        <p className="text-xs text-gray-400 mt-0.5">Destination: {locInfo?.label} · Type: {shipType} · Showing visible couriers</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">Weight (kg)</th>
              {visibleCouriers.map((courier) => (
                <th key={courier.id} className="px-3 py-2 text-right font-semibold text-gray-500 whitespace-nowrap">
                  {courier.label.replace('Trackon ', 'TK ').replace('Delhivery ', 'DL ').replace('BlueDart ', 'BD ').replace('DTDC ', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sensitivityData.map((row, index) => (
              <tr key={index} className={`border-t border-gray-50 ${row.w === chargeWt ? 'bg-blue-50' : ''}`}>
                <td className={`px-3 py-1.5 font-bold ${row.w === chargeWt ? 'text-blue-700' : ''}`}>
                  {row.w} kg {row.w === chargeWt && <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded">current</span>}
                </td>
                {visibleCouriers.map((courier) => {
                  const sell = getPerCourierSell(courier);
                  const cost = row[courier.id];
                  const margin = cost && sell ? rnd(((sell - cost) / sell) * 100) : null;
                  return (
                    <td key={courier.id} className={`px-3 py-1.5 text-right font-mono ${!cost ? 'text-gray-300' : margin < 0 ? 'text-red-500' : margin > 30 ? 'text-green-700' : 'text-gray-700'}`}>
                      {cost ? <>{fmt(cost)}<span className="text-[8px] ml-0.5 opacity-60">{margin !== null ? `${margin.toFixed(0)}%` : ''}</span></> : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-50 text-[10px] text-gray-400 border-t border-gray-100">
        Green = profitable · Red = loss · % = margin at current sell price. Blanks = below MCW.
      </div>
    </div>
  );
}
