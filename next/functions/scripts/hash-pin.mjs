import { randomBytes, scryptSync } from "node:crypto";

const pin = process.argv[2];
if (!pin || !/^\d{5,8}$/.test(pin)) {
  console.error("Usage: npm run pin:hash -- <5-to-8-digit-pin>");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(pin, salt, 64).toString("hex");
console.log(`${salt}:${hash}`);
