import type { FinancialChecklistProps } from "../types/types";

export const FinancialChecklist: React.FC<FinancialChecklistProps> = ({ stockData }) => {
    const { quote, ratios, historicalEPS } = stockData;
    const checks = [
        { label: "P/E Ratio por debajo de 25", passed: (quote?.pe ?? ratios?.priceEarningsRatioTTM ?? 99) < 25 },
        { label: "Deuda/Capital por debajo de 1", passed: (ratios?.debtToEquityRatioTTM ?? 99) < 1 },
        { label: "ROE (Rentabilidad) superior al 15%", passed: ((ratios?.returnOnEquityTTM ?? 0) * 100) > 15 },
        { label: "Crecimiento constante de EPS (3 de 5 años)", passed: historicalEPS.slice(0, 5).filter((v, i, a) => i > 0 && v.eps > a[i-1].eps).length >= 3 }
    ];

    return (
        <div className="bg-gray-800 p-4 rounded-lg">
             <h3 className="text-xl font-bold text-center mb-4">Checklist de Salud Financiera</h3>
             <ul className="space-y-2">
                {checks.map(check => (
                    <li key={check.label} className="flex items-center">
                        <span className={`mr-2 text-xl ${check.passed ? 'text-green-400' : 'text-red-400'}`}>{check.passed ? '✅' : '❌'}</span>
                        <span>{check.label}</span>
                    </li>
                ))}
             </ul>
        </div>
    )
};
