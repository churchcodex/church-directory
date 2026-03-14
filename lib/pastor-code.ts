import Pastor from "@/models/Pastor";

const CODE_PREFIX = "G-";
const CODE_WIDTH = 4;
const MAX_CODE_VALUE = 9999;
const MAX_ATTEMPTS = 100;
const CODE_PATTERN = /^G-(\d{4})$/;

function formatPastorCode(value: number) {
  return `${CODE_PREFIX}${String(value).padStart(CODE_WIDTH, "0")}`;
}

export function isSequentialPastorCode(value?: string | null) {
  if (!value) {
    return false;
  }

  return CODE_PATTERN.test(value);
}

async function getLatestPastorCodeNumber() {
  const latestPastor = await Pastor.findOne({
    personal_code: {
      $regex: `^${CODE_PREFIX}\\d{${CODE_WIDTH}}$`,
    },
  })
    .sort({ personal_code: -1 })
    .select({ personal_code: 1, _id: 0 })
    .lean<{ personal_code?: string } | null>();

  const code = latestPastor?.personal_code;

  if (!code) {
    return 0;
  }

  const match = code.match(CODE_PATTERN);

  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10);
}

export async function generateUniquePastorCode() {
  const latestCodeNumber = await getLatestPastorCodeNumber();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const nextCodeNumber = latestCodeNumber + attempt + 1;

    if (nextCodeNumber > MAX_CODE_VALUE) {
      throw new Error("Unable to generate a unique pastor code: maximum code value reached.");
    }

    const code = formatPastorCode(nextCodeNumber);
    const existingPastor = await Pastor.exists({ personal_code: code });

    if (!existingPastor) {
      return code;
    }
  }

  throw new Error("Unable to generate a unique pastor code");
}
