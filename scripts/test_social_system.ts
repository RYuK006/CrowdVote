import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// 1. Initialize Firebase Admin
let serviceAccount: any;
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
const FIREBASE_API_KEY = config.apiKey;
const BASE_URL = "http://127.0.0.1:3000";

async function getIdTokenForUser(uid: string): Promise<string> {
  const customToken = await admin.auth().createCustomToken(uid);
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to exchange custom token: ${errText}`);
  }
  const data: any = await res.json();
  return data.idToken;
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  } else {
    console.log(`  ✅ ${msg}`);
  }
}

async function run() {
  console.log("==================================================");
  console.log("🧪 TESTING FULL SOCIAL SYSTEM: FOLLOW, FRIENDS, MODAL APIS");
  console.log("==================================================");

  try {
    const timestamp = Date.now();
    const userA_id = `user_social_a_${timestamp}`;
    const userB_id = `user_social_b_${timestamp}`;

    console.log(`\n1. Creating test users in Auth & Firestore...`);
    // Create users in auth
    await admin.auth().createUser({
      uid: userA_id,
      email: `${userA_id}@crowdvote.ai`,
      displayName: `Social Alice ${timestamp.toString().slice(-4)}`
    });

    await admin.auth().createUser({
      uid: userB_id,
      email: `${userB_id}@crowdvote.ai`,
      displayName: `Social Bob ${timestamp.toString().slice(-4)}`
    });

    // Populate user profile docs
    await db.collection("users").doc(userA_id).set({
      displayName: `Social Alice ${timestamp.toString().slice(-4)}`,
      email: `${userA_id}@crowdvote.ai`,
      accuracy: 94.2,
      tier: "Expert",
      bio: "Predictive intelligence researcher & poll enthusiast",
      createdAt: new Date().toISOString()
    });

    await db.collection("users").doc(userB_id).set({
      displayName: `Social Bob ${timestamp.toString().slice(-4)}`,
      email: `${userB_id}@crowdvote.ai`,
      accuracy: 91.8,
      tier: "Advanced",
      bio: "Quantitative election modeler",
      createdAt: new Date().toISOString()
    });

    // Obtain tokens
    const tokenA = await getIdTokenForUser(userA_id);
    const tokenB = await getIdTokenForUser(userB_id);
    console.log("  ✅ Users created & valid ID tokens obtained.");

    // 2. Initial state verification
    console.log(`\n2. Verifying initial social profile stats for User B viewed by User A...`);
    const initRes = await fetch(`${BASE_URL}/api/user/${userB_id}/social-profile`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(initRes.ok, "Initial social profile response is 200 OK");
    const initData: any = await initRes.json();
    assert(initData.stats.followersCount === 0, "Initial followers count is 0");
    assert(initData.stats.followingCount === 0, "Initial following count is 0");
    assert(initData.stats.friendsCount === 0, "Initial friends count is 0");
    assert(initData.stats.isFollowing === false, "User A is not following User B");
    assert(initData.stats.isFriend === false, "User A and User B are not friends");

    // 3. User A follows User B
    console.log(`\n3. Testing Follow: User A follows User B...`);
    const followRes = await fetch(`${BASE_URL}/api/user/follow/${userB_id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(followRes.ok, "Follow endpoint returned 200 OK");
    const followData: any = await followRes.json();
    assert(followData.isFollowing === true, "isFollowing is true");
    assert(followData.isFriend === false, "isFriend is false (not yet mutual)");

    // Verify stats
    const afterFollowRes = await fetch(`${BASE_URL}/api/user/${userB_id}/social-profile`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const afterFollowData: any = await afterFollowRes.json();
    assert(afterFollowData.stats.followersCount === 1, "User B followersCount is 1");
    assert(afterFollowData.stats.isFollowing === true, "User A sees isFollowing = true");
    assert(afterFollowData.stats.isFriend === false, "User A sees isFriend = false");

    // Check followers list of B
    const followersListRes = await fetch(`${BASE_URL}/api/user/${userB_id}/followers`);
    const followersList: any = await followersListRes.json();
    assert(followersList.some((f: any) => f.uid === userA_id), "User A is listed in User B's followers");

    // Check following list of A
    const followingListRes = await fetch(`${BASE_URL}/api/user/${userA_id}/following`);
    const followingList: any = await followingListRes.json();
    assert(followingList.some((f: any) => f.uid === userB_id), "User B is listed in User A's following list");

    // 4. Mutual Friendship: User B follows User A back
    console.log(`\n4. Testing Mutual Follow: User B follows User A back...`);
    const followBackRes = await fetch(`${BASE_URL}/api/user/follow/${userA_id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(followBackRes.ok, "Follow-back endpoint returned 200 OK");
    const followBackData: any = await followBackRes.json();
    assert(followBackData.isFollowing === true, "User B isFollowing User A");
    assert(followBackData.isFriend === true, "Automatic mutual friendship triggered (isFriend = true)!");

    // Verify mutual status for both
    const profBfromA = await (await fetch(`${BASE_URL}/api/user/${userB_id}/social-profile`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    })).json();
    assert(profBfromA.stats.isFriend === true, "User A sees User B as friend");
    assert(profBfromA.stats.friendsCount === 1, "User B friendsCount is 1");

    const profAfromB = await (await fetch(`${BASE_URL}/api/user/${userA_id}/social-profile`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    })).json();
    assert(profAfromB.stats.isFriend === true, "User B sees User A as friend");
    assert(profAfromB.stats.friendsCount === 1, "User A friendsCount is 1");

    // Check friends list API
    const friendsResA = await fetch(`${BASE_URL}/api/user/${userA_id}/friends`);
    const friendsListA: any = await friendsResA.json();
    assert(friendsListA.length === 1 && friendsListA[0].uid === userB_id, "User A friends list contains User B");

    const friendsResB = await fetch(`${BASE_URL}/api/user/${userB_id}/friends`);
    const friendsListB: any = await friendsResB.json();
    assert(friendsListB.length === 1 && friendsListB[0].uid === userA_id, "User B friends list contains User A");

    // 5. Unfollow and Break Mutual Friendship
    console.log(`\n5. Testing Unfollow: User A unfollows User B...`);
    const unfollowRes = await fetch(`${BASE_URL}/api/user/unfollow/${userB_id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(unfollowRes.ok, "Unfollow endpoint returned 200 OK");
    const unfollowData: any = await unfollowRes.json();
    assert(unfollowData.isFollowing === false, "isFollowing is false");
    assert(unfollowData.isFriend === false, "isFriend is broken");

    // Verify friends list is now empty
    const friendsAfterUnfollow = await (await fetch(`${BASE_URL}/api/user/${userA_id}/friends`)).json();
    assert(friendsAfterUnfollow.length === 0, "Friends list is now empty after unfollow");

    // But User B is still following User A
    const bStillFollowsA = await (await fetch(`${BASE_URL}/api/user/${userA_id}/social-profile`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    })).json();
    assert(bStillFollowsA.stats.isFollowing === true, "User B is still following User A");
    assert(bStillFollowsA.stats.isFriend === false, "Mutual friendship is false");

    // 6. Direct Friend Request Flow
    console.log(`\n6. Testing Direct Friend Request: User A sends friend request to User B...`);
    const sendReqRes = await fetch(`${BASE_URL}/api/user/friend-request/${userB_id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(sendReqRes.ok, "Send friend request returned 200 OK");
    const sendReqData: any = await sendReqRes.json();
    assert(sendReqData.success === true, "Friend request successfully sent");
    assert(sendReqData.request.status === "pending", "Request status is pending");

    // Check incoming requests for User B
    console.log(`\n7. Checking received friend requests for User B...`);
    const recvReqRes = await fetch(`${BASE_URL}/api/user/friend-requests`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(recvReqRes.ok, "Get friend requests returned 200 OK");
    const reqsData: any = await recvReqRes.json();
    assert(reqsData.incoming.some((r: any) => r.fromUid === userA_id), "User B received request from User A");

    // User B accepts friend request
    console.log(`\n8. User B accepts User A's friend request...`);
    const acceptRes = await fetch(`${BASE_URL}/api/user/friend-request/${userA_id}/respond`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenB}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "accept" })
    });
    assert(acceptRes.ok, "Accept friend request returned 200 OK");
    const acceptData: any = await acceptRes.json();
    assert(acceptData.status === "accepted", "Response status is accepted");
    assert(acceptData.isFriend === true, "Mutual friend established upon acceptance!");

    // Verify mutual friendship established in DB & friends endpoint
    const finalFriendsA = await (await fetch(`${BASE_URL}/api/user/${userA_id}/friends`)).json();
    assert(finalFriendsA.some((f: any) => f.uid === userB_id), "User A has User B in friends list after request acceptance");

    const finalFriendsB = await (await fetch(`${BASE_URL}/api/user/${userB_id}/friends`)).json();
    assert(finalFriendsB.some((f: any) => f.uid === userA_id), "User B has User A in friends list after request acceptance");

    // Clean up test users
    console.log(`\n9. Cleaning up test users...`);
    await admin.auth().deleteUser(userA_id);
    await admin.auth().deleteUser(userB_id);
    await db.collection("users").doc(userA_id).delete().catch(() => {});
    await db.collection("users").doc(userB_id).delete().catch(() => {});
    await db.collection("follows").doc(`${userA_id}_${userB_id}`).delete().catch(() => {});
    await db.collection("follows").doc(`${userB_id}_${userA_id}`).delete().catch(() => {});
    await db.collection("friends").doc([userA_id, userB_id].sort().join("_")).delete().catch(() => {});
    await db.collection("friend_requests").doc(`${userA_id}_${userB_id}`).delete().catch(() => {});
    console.log("  ✅ Cleaned up temporary test artifacts");

    console.log("\n==================================================");
    console.log("🎉 ALL SOCIAL SYSTEM TESTS PASSED PERFECTLY!");
    console.log("==================================================");
    process.exit(0);
  } catch (err: any) {
    console.error("Test Suite Failed:", err);
    process.exit(1);
  }
}

run();
