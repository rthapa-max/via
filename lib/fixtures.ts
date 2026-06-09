export type FixturePredictionStatus = "scheduled" | "pending" | "finished";

export type FixtureMatch = {
  id?: string;
  dateLabel: string;
  home: string;
  away: string;
  time: string;
  stage?: string;
  group?: string;
  stadium?: string;
  city?: string;
  status?: FixturePredictionStatus;
  kickoffAt?: string;
};

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

/** Parse "Friday 12 June 2026" into a sortable UTC timestamp. */
export function dateLabelToSortValue(dateLabel: string) {
  const parts = dateLabel.trim().split(/\s+/);
  if (parts.length < 4) return Number.POSITIVE_INFINITY;
  const day = Number(parts[1]);
  const month = MONTHS[parts[2]?.toLowerCase()];
  const year = Number(parts[3]);
  if (!Number.isFinite(day) || !Number.isFinite(year) || month === undefined) return Number.POSITIVE_INFINITY;
  return Date.UTC(year, month, day);
}

/** Parse "07:45" into minutes since midnight for sorting. */
export function timeToSortValue(time: string) {
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return Number.POSITIVE_INFINITY;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return Number.POSITIVE_INFINITY;
  return hh * 60 + mm;
}

export function compareByDateAndTime(
  a: { dateLabel?: string; date_label?: string; time: string },
  b: { dateLabel?: string; date_label?: string; time: string },
) {
  const dateA = dateLabelToSortValue(a.dateLabel ?? a.date_label ?? "");
  const dateB = dateLabelToSortValue(b.dateLabel ?? b.date_label ?? "");
  if (dateA !== dateB) return dateA - dateB;
  return timeToSortValue(a.time) - timeToSortValue(b.time);
}

function normalizeTeamName(team: string) {
  return team
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[’']/g, "'")
    .toLowerCase();
}

const TEAM_TO_ISO2: Record<string, string> = {
  mexico: "mx",
  "south africa": "za",
  "korea republic": "kr",
  czechia: "cz",
  canada: "ca",
  usa: "us",
  paraguay: "py",
  qatar: "qa",
  switzerland: "ch",
  brazil: "br",
  morocco: "ma",
  haiti: "ht",
  scotland: "gb",
  australia: "au",
  "türkiye": "tr",
  turkey: "tr",
  germany: "de",
  "curaçao": "cw",
  netherlands: "nl",
  japan: "jp",
  "côte d'ivoire": "ci",
  ecuador: "ec",
  sweden: "se",
  tunisia: "tn",
  spain: "es",
  "cabo verde": "cv",
  belgium: "be",
  egypt: "eg",
  "saudi arabia": "sa",
  uruguay: "uy",
  "ir iran": "ir",
  "new zealand": "nz",
  france: "fr",
  senegal: "sn",
  iraq: "iq",
  norway: "no",
  argentina: "ar",
  algeria: "dz",
  austria: "at",
  jordan: "jo",
  portugal: "pt",
  "congo dr": "cd",
  england: "gb",
  croatia: "hr",
  ghana: "gh",
  panama: "pa",
  uzbekistan: "uz",
  colombia: "co",
  "bosnia and herzegovina": "ba",
};

export function flagCodeForTeam(team: string): string | null {
  const normalized = normalizeTeamName(team);
  return TEAM_TO_ISO2[normalized] ?? null;
}

export function flagUrlForTeam(team: string, sizePx: 40 | 80 = 40): string | null {
  const code = flagCodeForTeam(team);
  if (!code) return null;
  const sizeSegment = sizePx === 80 ? "w80" : "w40";
  // Public CDN; avoids adding assets to repo.
  return `https://flagcdn.com/${sizeSegment}/${code}.png`;
}

function isDateLine(line: string) {
  // e.g. "Friday 12 June 2026"
  return /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{1,2}\s+\w+\s+\d{4}$/.test(
    line,
  );
}

function parseCity(line: string) {
  const m = line.match(/^\((.+)\)$/);
  return m?.[1];
}

export function parseFixtureText(text: string): FixtureMatch[] {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l !== "·");

  const matches: FixtureMatch[] = [];

  let currentDate: string | undefined;
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    if (isDateLine(line)) {
      currentDate = line;
      i += 1;
      continue;
    }

    if (!currentDate) {
      i += 1;
      continue;
    }

    const home = rawLines[i];
    const time = rawLines[i + 1];
    const away = rawLines[i + 2];
    const stage = rawLines[i + 3];
    const group = rawLines[i + 4];
    const stadium = rawLines[i + 5];
    const maybeCity = rawLines[i + 6];

    // If the next block doesn't look like a match, skip forward.
    if (!home || !time || !away || !stage || !group || !stadium) {
      i += 1;
      continue;
    }

    const city = maybeCity && parseCity(maybeCity) ? parseCity(maybeCity) : undefined;
    const consumed = city ? 7 : 6;

    // Avoid accidentally consuming the next date line as "city".
    if (city === undefined && isDateLine(maybeCity ?? "")) {
      matches.push({
        dateLabel: currentDate,
        home,
        away,
        time,
        stage,
        group,
        stadium,
      });
      i += 6;
      continue;
    }

    matches.push({
      dateLabel: currentDate,
      home,
      away,
      time,
      stage,
      group,
      stadium,
      city,
    });

    i += consumed;
  }

  return matches;
}

