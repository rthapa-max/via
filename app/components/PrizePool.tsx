type PrizeRow = { position: string; amount: number };

const GROUP_STAGE_PRIZES: PrizeRow[] = [
  { position: "1st Prize", amount: 5000 },
  { position: "2nd Prize", amount: 3000 },
  { position: "3rd Prize", amount: 2000 },
];

const KNOCKOUT_STAGE_PRIZES: PrizeRow[] = [
  { position: "1st Prize", amount: 7000 },
  { position: "2nd Prize", amount: 4000 },
  { position: "3rd Prize", amount: 2000 },
];

const OVERALL_PRIZES: PrizeRow[] = [
  { position: "1st Prize", amount: 12000 },
  { position: "2nd Prize", amount: 7000 },
  { position: "3rd Prize", amount: 4000 },
  { position: "4th Prize", amount: 2500 },
  { position: "5th Prize", amount: 1500 },
];

function subtotal(rows: PrizeRow[]) {
  return rows.reduce((sum, row) => sum + row.amount, 0);
}

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString("en-US")}`;
}

function PrizeTable({ title, rows }: { title: string; rows: PrizeRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-secondary-border bg-background">
      <div className="border-b border-secondary-border bg-secondary-25 px-3 py-2">
        <p className="font-semibold text-xs text-primary-dark sm:text-sm">{title}</p>
      </div>
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="text-secondary-text">
          <tr>
            <th className="px-3 py-2 font-normal">Position</th>
            <th className="px-3 py-2 text-right font-normal">Prize Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-75">
          {rows.map((row) => (
            <tr key={row.position}>
              <td className="px-3 py-2 text-primary-text">{row.position}</td>
              <td className="px-3 py-2 text-right tabular-nums text-primary-text">
                {formatAmount(row.amount)}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-secondary-border bg-secondary-25 font-semibold">
            <td className="px-3 py-2 text-primary-dark">Subtotal</td>
            <td className="px-3 py-2 text-right tabular-nums text-primary-dark">
              {formatAmount(subtotal(rows))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function PrizePool() {
  return (
    <section className="rounded-xl border border-secondary-border bg-background p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-semibold text-base text-primary-dark sm:text-lg">🏆 Prize Pool</h2>
        <p className="mt-0.5 text-xs text-secondary-text sm:text-sm">
          Cash prizes across the group stage, knockout stage, and overall tournament standings.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PrizeTable title="Group Stage Winners" rows={GROUP_STAGE_PRIZES} />
        <PrizeTable title="Knockout Stage Winners" rows={KNOCKOUT_STAGE_PRIZES} />
        <PrizeTable title="Overall Tournament Winners" rows={OVERALL_PRIZES} />
      </div>

      <p className="mt-4 rounded-lg border border-secondary-border bg-secondary-25 p-3 text-xs text-secondary-text sm:text-sm">
        <span className="font-semibold text-primary-dark">Note: </span>
        If there are multiple winners on the same position, the mentioned amount will be divided among the number of
        winners.
      </p>
    </section>
  );
}
