#!/usr/bin/env node
/**
 * Cleanup script to remove test payment records (no valid amount) from Firestore
 * Run: node cleanup-test-payments.js <user-email>
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccount = require(path.join(__dirname, 'functions/service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'uxshari-670fd'
});

const db = admin.firestore();

// Base64url encode email
function encodeEmail(email) {
  return Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Check if payment has valid amount
function hasValidAmount(payment) {
  if (typeof payment.amount === 'number' && payment.amount > 0) return true;
  if (typeof payment.amount_total === 'number' && payment.amount_total > 0) return true;
  if (typeof payment.amount_usd === 'number' && payment.amount_usd > 0) return true;
  if (typeof payment.unit_amount === 'number' && payment.unit_amount > 0) return true;
  if (typeof payment.amount_cents === 'number' && payment.amount_cents > 0) return true;
  if (typeof payment.price === 'number' && payment.price > 0) return true;
  return false;
}

async function cleanupTestPayments(email) {
  const docId = encodeEmail(email);
  const docRef = db.collection('users_by_email').doc(docId);
  
  console.log(`🔍 Checking user: ${email}`);
  console.log(`📄 Document ID: ${docId}`);
  
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.log('❌ User document not found');
    return;
  }
  
  const data = doc.data();
  const payments = data.payments || [];
  
  console.log(`\n📊 Found ${payments.length} payment records`);
  
  // Filter out test payments (no valid amount)
  const validPayments = payments.filter(hasValidAmount);
  const removedCount = payments.length - validPayments.length;
  
  if (removedCount === 0) {
    console.log('✅ No test payment records to remove');
    return;
  }
  
  console.log(`\n🗑️  Removing ${removedCount} test payment record(s)...`);
  
  // Show what will be removed
  payments.forEach((p, idx) => {
    if (!hasValidAmount(p)) {
      const date = p.createdAt?.toDate?.() || new Date(p.createdAt?.seconds * 1000 || p.createdAt);
      console.log(`   - Record ${idx + 1}: ${date.toLocaleString('zh-TW')} (no amount)`);
    }
  });
  
  // Update document
  await docRef.update({ payments: validPayments });
  
  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Remaining payment records: ${validPayments.length}`);
}

// Main
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: node cleanup-test-payments.js <user-email>');
  process.exit(1);
}

cleanupTestPayments(email)
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
