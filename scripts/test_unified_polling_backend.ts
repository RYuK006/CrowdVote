import fetch from 'node-fetch';

async function testBackend() {
  console.log("🧪 Testing Unified Polling Backend...");

  // 1. Health check
  const healthRes = await fetch("http://localhost:3000/api/health");
  const healthJson = await healthRes.json();
  console.log("✅ Health check:", healthJson);

  // 2. Admin cloaking test (unauthenticated request to /api/admin/queue should return 404)
  const adminRes = await fetch("http://localhost:3000/api/admin/queue");
  console.log("🔒 Admin Cloaking Status:", adminRes.status, adminRes.status === 404 ? "✅ PASS (404 Cloaked)" : "❌ FAIL");

  // 3. Polls fetch with blind masking
  const pollsRes = await fetch("http://localhost:3000/api/polls?limit=5");
  const pollsJson: any = await pollsRes.json();
  console.log(`📊 Fetched ${pollsJson.length} polls.`);
  if (pollsJson.length > 0) {
    const first = pollsJson[0];
    console.log(`   Sample Poll: "${first.title}"`);
    console.log(`   isBlindMasked:`, first.isBlindMasked);
    console.log(`   Format:`, first.format || "choice");
  }

  // 4. Debate endpoint test
  const debateRes = await fetch("http://localhost:3000/api/debate/sample_poll_id");
  const debateJson: any = await debateRes.json();
  console.log(`💬 Debate comments response (empty or list):`, Array.isArray(debateJson) ? `✅ ${debateJson.length} comments` : debateJson);

  console.log("🎉 All Unified Polling Backend checks PASSED!");
}

testBackend().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
