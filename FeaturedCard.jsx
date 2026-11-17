import { formatKoreanWon } from '../utils/calculators';
import moneyIcon from '../assets/money.svg';
import calendarIcon from '../assets/calendar.svg';

export default function FeaturedCard({ data }) {
    const { initialExpense, cumulativeProfit, yearResult } = data;

    return (
        <div className="flex justify-between items-center w-full">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:grid-cols-3 gap-3 sm:gap-4 w-full">

                <StatCard
                    title="초기 투자 비용"
                    value={formatKoreanWon(initialExpense)}
                    cardIcon={moneyIcon}
                />

                <StatCard
                    title="20년 누적 수익"
                    value={formatKoreanWon(cumulativeProfit)}
                    cardIcon={moneyIcon}
                />

                <StatCard
                    title="예상 투자비용 회수 기간"
                    value={yearResult}
                    cardIcon={calendarIcon}
                    className="col-start-2 row-start-1 row-span-2 sm:col-start-auto sm:row-start-auto sm:row-span-1 flex-col sm:flex-row justify-center sm:justify-start text-center sm:text-left"
                />

            </div>
        </div>
    );
}

function StatCard({ title, value, cardIcon, className = '' }) {
    return (
        <div className={`flex items-center gap-2 md:gap-4 p-3 md:p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all min-w-0 ${className}`}>

            <img
                src={cardIcon}
                alt={title}
                className="w-auto h-8 md:h-12 mt-0.5 flex-shrink-0 opacity-85 object-contain"
            />

            <div className="flex flex-col min-w-0 max-w-full justify-center">

                <span className="text-[11px] md:text-xs text-slate-500 uppercase tracking-wider mb-0.5 md:mb-1 break-keep">
                    {title}
                </span>

                <div className="mt-0.5 min-w-0">
                    <span className="block text-base sm:text-lg md:text-xl font-black text-slate-800 break-words">
                        {value}
                    </span>
                </div>

            </div>
        </div>
    );
}