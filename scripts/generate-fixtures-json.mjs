import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { kickoffAtIsoFromFixture } from "../lib/kickoff.mjs";

function isDateLine(line) {
  return /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{1,2}\s+\w+\s+\d{4}$/.test(
    line,
  );
}

function parseCity(line) {
  const m = line.match(/^\((.+)\)$/);
  return m?.[1];
}

function parseFixtureText(text) {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l !== "·");

  const matches = [];
  let currentDate;
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

    if (!home || !time || !away || !stage || !group || !stadium) {
      i += 1;
      continue;
    }

    const city = maybeCity && parseCity(maybeCity) ? parseCity(maybeCity) : undefined;
    const consumed = city ? 7 : 6;

    if (city === undefined && isDateLine(maybeCity ?? "")) {
      matches.push({
        id: `${currentDate}|${time}|${home}|${away}`,
        dateLabel: currentDate,
        home,
        away,
        time,
        stage,
        group,
        stadium,
        kickoffAt: kickoffAtIsoFromFixture({ dateLabel: currentDate, time }),
      });
      i += 6;
      continue;
    }

    matches.push({
      id: `${currentDate}|${time}|${home}|${away}`,
      dateLabel: currentDate,
      home,
      away,
      time,
      stage,
      group,
      stadium,
      city,
      kickoffAt: kickoffAtIsoFromFixture({ dateLabel: currentDate, time }),
    });

    i += consumed;
  }

  return matches;
}

async function main() {
  const root = process.cwd();
  const fixturePath = path.join(root, "fixture.txt");
  const outDir = path.join(root, "data");
  const outPath = path.join(outDir, "fixtures.json");

  const text = await readFile(fixturePath, "utf8");
  const fixtures = parseFixtureText(text);

  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, JSON.stringify(fixtures, null, 2) + "\n", "utf8");

  console.log(`Wrote ${fixtures.length} matches to ${path.relative(root, outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

