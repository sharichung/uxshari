// Test script to verify private key format
const testKey = process.env.GOOGLE_PRIVATE_KEY || "";

console.log("Key length:", testKey.length);
console.log("First 100 chars:", testKey.substring(0, 100));
console.log("Has \\n escapes:", testKey.includes("\\n"));
console.log("Has real newlines:", testKey.includes("\n"));
console.log("Starts with BEGIN:", testKey.includes("BEGIN PRIVATE KEY"));

// Try cleaning
const cleaned = testKey
  .replace(/-----BEGIN PRIVATE KEY-----/g, "")
  .replace(/-----END PRIVATE KEY-----/g, "")
  .replace(/\\n/g, "")
  .replace(/\n/g, "")
  .replace(/\r/g, "")
  .replace(/\s+/g, "");

console.log("\nCleaned length:", cleaned.length);
console.log("Cleaned first 50:", cleaned.substring(0, 50));
console.log("Is valid base64:", /^[A-Za-z0-9+/=]+$/.test(cleaned));
