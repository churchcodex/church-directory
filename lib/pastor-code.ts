import { randomBytes } from "crypto";
import Pastor from "@/models/Pastor";

const CODE_PREFIX = "FLC-";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 30;

function randomLetters(length: number) {
  const bytes = randomBytes(length);

  return Array.from(bytes, (value) => ALPHABET[value % ALPHABET.length]).join("");
}

export function createPastorCodeValue() {
  return `${CODE_PREFIX}${randomLetters(CODE_LENGTH)}`;
}

export async function generateUniquePastorCode() {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const code = createPastorCodeValue();
    const existingPastor = await Pastor.exists({ personal_code: code });

    if (!existingPastor) {
      return code;
    }
  }

  throw new Error("Unable to generate a unique pastor code");
}
