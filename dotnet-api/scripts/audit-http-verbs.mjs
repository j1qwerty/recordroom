// Audits every controller for an action that has lost its HTTP method
// attribute. Such an action answers to every verb on the controller's route
// prefix, which MVC accepts but Swashbuckle rejects outright ("Ambiguous HTTP
// method"), so the whole OpenAPI document 500s.
//
// Run from the dotnet-api project root:  node scripts/audit-http-verbs.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'src/RecordRoom.Api/Api/Controllers';
const files = readdirSync(dir).filter((name) => name.endsWith('.cs'));

const problems = [];

for (const name of files) {
  const lines = readFileSync(join(dir, name), 'utf8').split(/\r?\n/);
  let classDepth = 0;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (/^(public|internal)\s+(sealed\s+)?class\s/.test(trimmed)) classDepth += 1;
    if (trimmed === '}') classDepth -= 1;

    // An action is a public method returning IResult or Task<IResult>.
    const isAction =
      classDepth > 0 &&
      /^\s*public\s+(async\s+)?(Task<)?IResult/.test(line) &&
      !/\b(class|interface)\b/.test(line);

    if (!isAction) return;

    // Walk back over the whole contiguous attribute block. Stopping at the
    // nearest attribute is not enough: [Authorize] and [HttpPost] are usually
    // both present, in either order.
    let cursor = index - 1;
    let sawAttribute = false;
    while (cursor >= 0) {
      const candidate = lines[cursor].trim();
      if (candidate === '') {
        if (sawAttribute) break; // blank line ends the block
        cursor -= 1;
        continue;
      }
      if (!candidate.startsWith('[')) break;
      if (/\[Http(Get|Post|Put|Delete|Patch|Head|Options)/i.test(candidate)) {
        sawAttribute = true;
        break;
      }
      sawAttribute = true;
      cursor -= 1;
    }

    if (!sawAttribute) {
      problems.push({
        file: name,
        line: index + 1,
        method: trimmed.replace(/\{.*$/, '').trim(),
        nearestAttribute: cursor >= 0 ? lines[cursor].trim() : '(none)',
      });
    }
  });
}

if (problems.length === 0) {
  console.log(`OK: every action in ${dir} declares an HTTP method.`);
} else {
  console.error(`${problems.length} action(s) with no HTTP method attribute:\n`);
  for (const p of problems) {
    console.error(`  ${p.file}:${p.line}  ${p.method}`);
    console.error(`      nearest attribute: ${p.lastAttribute}`);
  }
  process.exitCode = 1;
}