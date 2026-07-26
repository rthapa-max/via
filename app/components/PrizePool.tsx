type PrizeSlot = { positions: string[]; amount: number; winners: string[] };

const GROUP_STAGE_PRIZES: PrizeSlot[] = [
  { positions: ["1st Prize"], amount: 5000, winners: ["rabin"] },
  {
    positions: ["2nd Prize", "3rd Prize"],
    amount: 3000 + 2000,
    winners: ["aayushshrestha3", "alishshrestha", "nabikamaharjan", "sneha"],
  },
];

const KNOCKOUT_STAGE_PRIZES: PrizeSlot[] = [
  { positions: ["1st Prize"], amount: 7000, winners: ["selina"] },
  { positions: ["2nd Prize"], amount: 4000, winners: ["sahil_maharjan"] },
  {
    positions: ["3rd Prize"],
    amount: 2000,
    winners: ["aayushneupane", "anil", "devendra1", "dipenshrestha"],
  },
];

const OVERALL_PRIZES: PrizeSlot[] = [
  { positions: ["1st Prize"], amount: 12000, winners: ["sneha"] },
  {
    positions: ["2nd Prize", "3rd Prize"],
    amount: 7000 + 4000,
    winners: ["aayushneupane", "aayushshrestha3"],
  },
  {
    positions: ["4th Prize", "5th Prize"],
    amount: 2500 + 1500,
    winners: ["nabikamaharjan", "purushottam", "selina", "sahil_maharjan"],
  },
];

function subtotal(slots: PrizeSlot[]) {
  return slots.reduce((sum, slot) => sum + slot.amount, 0);
}

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString("en-US")}`;
}

function slotLabel(positions: string[]) {
  return positions.map((position) => position.replace(" Prize", "")).join(" & ") + " Prize";
}

const RANK_DECOR: Record<string, { medal: string; badgeClass: string; rowClass: string }> = {
  "1st": {
    medal: "🥇",
    badgeClass: "bg-yellow-300 text-brown-500 ring-yellow-400",
    rowClass:
      "bg-gradient-to-r from-yellow-300/25 via-primary-100/40 to-primary-50 ring-1 ring-inset ring-yellow-400/50",
  },
  "2nd": {
    medal: "🥈",
    badgeClass: "bg-gray-200 text-gray-700 ring-gray-300",
    rowClass: "bg-secondary-25",
  },
  "3rd": {
    medal: "🥉",
    badgeClass: "bg-orange-50 text-orange-500 ring-orange-500/40",
    rowClass: "bg-secondary-25/60",
  },
};

function decorFor(positions: string[]) {
  const topRank = positions[0]?.split(" ")[0];
  return topRank ? RANK_DECOR[topRank] : undefined;
}

function medalsFor(positions: string[]) {
  return positions
    .map((position) => RANK_DECOR[position.split(" ")[0]]?.medal)
    .filter(Boolean)
    .join("");
}

function PrizeTable({ title, slots }: { title: string; slots: PrizeSlot[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-secondary-border bg-background">
      <div className="border-b border-secondary-border bg-secondary-25 px-3 py-2">
        <p className="font-semibold text-xs text-primary-dark sm:text-sm">{title}</p>
      </div>
      <table className="w-full text-left text-xs sm:text-sm">
        <thead className="text-secondary-text">
          <tr>
            <th className="px-3 py-2 font-normal">Position</th>
            <th className="px-3 py-2 font-normal">Winner</th>
            <th className="px-3 py-2 text-right font-normal">Prize Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-secondary-75">
          {slots.map((slot) => {
            const decor = decorFor(slot.positions);
            const isChampion = slot.positions[0] === "1st Prize";
            const medals = medalsFor(slot.positions);
            return (
              <tr key={slot.positions.join("-")} className={decor?.rowClass}>
                <td className="px-3 py-2 align-top text-primary-text">
                  {decor ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1 ${decor.badgeClass}`}
                    >
                      {medals ? <span aria-hidden="true">{medals}</span> : null}
                      {slotLabel(slot.positions)}
                    </span>
                  ) : (
                    slotLabel(slot.positions)
                  )}
                </td>
                <td className="px-3 py-2 align-top text-primary-text">
                  <div className="space-y-0.5">
                    {slot.winners.map((winner) => (
                      <div key={winner} className="flex items-center gap-1.5 truncate font-medium">
                        <span className="truncate">{winner}</span>
                        {isChampion ? (
                          <span className="shrink-0 rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                            🎉 Champion
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-right align-top tabular-nums text-primary-text">
                  {formatAmount(slot.amount)}
                  {slot.winners.length > 1 ? (
                    <span className="block text-[10px] font-normal text-secondary-text">
                      split {slot.winners.length} ways
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-secondary-border bg-secondary-25 font-semibold">
            <td className="px-3 py-2 text-primary-dark" colSpan={2}>
              Subtotal
            </td>
            <td className="px-3 py-2 text-right tabular-nums text-primary-dark">
              {formatAmount(subtotal(slots))}
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
        <PrizeTable title="Group Stage Winners" slots={GROUP_STAGE_PRIZES} />
        <PrizeTable title="Knockout Stage Winners" slots={KNOCKOUT_STAGE_PRIZES} />
        <PrizeTable title="Overall Tournament Winners" slots={OVERALL_PRIZES} />
      </div>

      <p className="mt-4 rounded-lg border border-secondary-border bg-secondary-25 p-3 text-xs text-secondary-text sm:text-sm">
        <span className="font-semibold text-primary-dark">Note: </span>
        If there are multiple winners on the same position, the mentioned amount will be divided among the number of
        winners.
      </p>
    </section>
  );
}
