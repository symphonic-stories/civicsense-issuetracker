// =============================
//  SAFE REWARD SYSTEM - reward.js
//  (Badges, Cyclic Progress, Coupons)
// =============================

// Wait until firebase, db, auth exist on window
async function waitForFirebase() {
  if (window.firebase && window.db && window.auth) return;
  return new Promise(resolve => {
    const t = setInterval(() => {
      if (window.firebase && window.db && window.auth) {
        clearInterval(t);
        resolve();
      }
    }, 50);
  });
}

// Clean badge list (remove legacy/invalid entries)
function cleanBadges(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(b => typeof b === "string")
    .map(b => b.trim())
    .filter(b => b && b.toUpperCase() !== "TEMP" && b !== "Level 5 Citizen");
}

// Milestones (ordered)
const MILESTONES = [
  { pts: 10, name: "First Step" },
  { pts: 30, name: "Level 1 Citizen" },
  { pts: 50, name: "Level 2 Citizen" },
  { pts: 70, name: "Level 3 Citizen" },
  { pts: 85, name: "Level 4 Citizen" },

  // Extended badges
  { pts: 100, name: "Century Achiever" },
  { pts: 150, name: "Rising Star" },
  { pts: 200, name: "Double Century Hero" },
  { pts: 250, name: "Elite Citizen" },
  { pts: 300, name: "Triple Century Legend" },
  { pts: 350, name: "Civic Champion" },
  { pts: 400, name: "Metro Master" },
  { pts: 500, name: "Golden Citizen" }
];

// Weighted discount picker
function getWeightedDiscount() {
  const weighted = [
    { d: 10, w: 30 },
    { d: 15, w: 20 },
    { d: 20, w: 15 },
    { d: 25, w: 10 },
    { d: 30, w: 8 },
    { d: 35, w: 6 },
    { d: 40, w: 4 },
    { d: 45, w: 3 },
    { d: 50, w: 2 },
    { d: 55, w: 2 }
  ];
  const total = weighted.reduce((s, it) => s + it.w, 0);
  let r = Math.random() * total;
  for (const it of weighted) {
    if (r < it.w) return it.d;
    r -= it.w;
  }
  return 10;
}
function getExpiryDateISO(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function genCouponCode() {
  return "CS-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ------------------------
// Core functions
// ------------------------

// Award points for a complaint safely (transactional for points)
async function rewardForComplaint(uid) {
  await waitForFirebase();
  const userRef = db.collection("users").doc(uid);

  try {
    // Use a transaction to safely increment points and compute badges
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);

      if (!snap.exists) {
        // Do not create a blank user with destructive defaults; create minimal safe fields
        tx.set(userRef, {
          points: 10,
          badges: [],
          coupons: [],
          lastCouponMilestone: 0
        }, { merge: true });
        return;
      }

      // Increment points
      const prevPoints = typeof snap.data().points === "number" ? snap.data().points : Number(snap.data().points) || 0;
      const newPoints = prevPoints + 10;
      tx.update(userRef, { points: newPoints });

      // Compute correct badges for newPoints
      const currentBadgesRaw = snap.data().badges || [];
      const currentBadges = cleanBadges(currentBadgesRaw);

      const shouldHave = MILESTONES.filter(m => newPoints >= m.pts).map(m => m.name);

      // Only update badges array if it differs (avoids stomping coupons)
      const changed = currentBadges.length !== shouldHave.length || !currentBadges.every(b => shouldHave.includes(b));
      if (changed) {
        tx.update(userRef, { badges: shouldHave });
      }
    });

    // UI: small feedback, reload visible rewards
    try { showPointsToast(); } catch(e) { /* ignore UI errors */ }
    await loadRewards(uid);

  } catch (err) {
    console.error("rewardForComplaint failed:", err);
    throw err;
  }
}

// Load rewards and update dashboard UI
async function loadRewards(uid) {
  await waitForFirebase();

  if (!uid) return;

  try {
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists) {
      // nothing to show
      const pEl = document.getElementById("userPoints");
      if (pEl) pEl.innerText = "0";
      return;
    }

    const user = snap.data() || {};
    const rawPoints = user.points;
    const points = (typeof rawPoints === "number" ? rawPoints : Number(rawPoints) || 0);

    // Badges auto-fix (only write back if mismatch)
    let badges = cleanBadges(user.badges || []);
    const correctBadges = MILESTONES.filter(m => points >= m.pts).map(m => m.name);
    if (JSON.stringify(badges) !== JSON.stringify(correctBadges)) {
      // Non-destructive update: only update badges field
      try {
        await ref.update({ badges: correctBadges });
        badges = correctBadges;
      } catch (err) {
        // permission error/other - continue with local badges to avoid blocking UI
        console.warn("Could not auto-update badges in DB:", err);
        badges = correctBadges; // still show correct badges in UI
      }
    }

    // Update UI elements if present (defensive)
    const pEl = document.getElementById("userPoints");
    if (pEl) pEl.innerText = points;

    // Cyclic progress: show progress 0..100 for every 100 interval
    const cycle = points % 100;
    const barEl = document.getElementById("progressBar");
    if (barEl) barEl.style.width = Math.min(Math.max(cycle, 0), 100) + "%";

    const nextMilestone = (Math.floor(points / 100) + 1) * 100;
    const txtEl = document.getElementById("progressText");
    if (txtEl) txtEl.innerText = `${Math.max(nextMilestone - points, 0)} pts to next reward`;

    // Render badges
    const badgeBox = document.getElementById("userBadges");
    if (badgeBox) {
      badgeBox.innerHTML = "";
      if (!badges || badges.length === 0) {
        const t = document.createElement("span");
        t.className = "no-badges";
        t.innerText = "No badges yet";
        badgeBox.appendChild(t);
      } else {
        badges.forEach(b => {
          const s = document.createElement("span");
          s.className = "badge";
          s.innerText = b;
          badgeBox.appendChild(s);
        });
      }
    }

    // Claim UI (if present) - show if user is eligible for next 100pts coupon
    const rewardMsg = document.getElementById("rewardMessage");
    const claimBtn = document.getElementById("claimRewardBtn");
    const rewardSection = document.getElementById("rewardSection");
    if (rewardMsg && claimBtn && rewardSection) {
      const coupons = Array.isArray(user.coupons) ? user.coupons : [];
      const reachedMilestones = Math.floor(points / 100);
      const claimed = coupons.length || 0;
      const nextToClaim = claimed + 1;

      if (reachedMilestones >= nextToClaim) {
        rewardMsg.innerHTML = `🎉 You can claim coupon for ${nextToClaim * 100} pts!`;
        claimBtn.style.display = "inline-block";
        claimBtn.disabled = false;
        // avoid stacking handlers
        claimBtn.onclick = () => {
          claimBtn.disabled = true;
          claimReward(uid, nextToClaim).catch(err => {
            console.error("claimReward error:", err);
            claimBtn.disabled = false;
          });
        };
      } else {
        rewardMsg.innerText = reachedMilestones >= 1 ? "🎉 No new coupons to claim right now." : "Reach 100 points to unlock a special reward.";
        claimBtn.style.display = "none";
      }
    }

  } catch (err) {
    console.error("loadRewards failed:", err);
  }
}

// Claim reward: transactional coupon issuance (race-safe)
async function claimReward(uid, milestoneNumber) {
  await waitForFirebase();
  const userRef = db.collection("users").doc(uid);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error("User not found");

      const user = snap.data() || {};
      const points = (typeof user.points === "number" ? user.points : Number(user.points) || 0);
      const coupons = Array.isArray(user.coupons) ? user.coupons : [];
      const issuedCount = coupons.length || 0;
      const reached = Math.floor(points / 100);

      if (reached < issuedCount + 1) {
        throw new Error("Not eligible for a new coupon yet");
      }

      // Create coupon object
      const discount = getWeightedDiscount();
      const code = genCouponCode();
      const expires = getExpiryDateISO(30);
      const issuedAt = new Date().toISOString();
      const couponObj = { code, discount, expires, issuedAt, milestone: issuedCount + 1 };

      // Use arrayUnion to append coupon (non-destructive)
      tx.update(userRef, {
        coupons: firebase.firestore.FieldValue.arrayUnion(couponObj),
        lastCouponMilestone: issuedCount + 1
      });
    });

    // After transaction, produce PDF and notify UI
    const postSnap = await userRef.get();
    const user = postSnap.data() || {};
    const coupons = user.coupons || [];
    const latest = coupons[coupons.length - 1];

    try {
      generateCouponPDF(latest, user);
    } catch (err) {
      console.warn("PDF generation failed, but coupon stored:", err);
    }

    alert(`🎉 Coupon issued: ${latest.code} — ${latest.discount}% OFF`);

    // refresh UI
    await loadRewards(uid);

  } catch (err) {
    console.error("claimReward failed:", err);
    throw err;
  }
}

// Generate PDF using jsPDF if available, else download fallback text
function generateCouponPDF(coupon, user) {
  try {
    const jsPDFCtor = window.jspdf?.jsPDF || window.jsPDF || (window.jspdf && window.jspdf.default);
    if (!jsPDFCtor) throw new Error("jsPDF not found");

    const doc = new jsPDFCtor({ unit: "pt", format: "a4" });
    const margin = 40;
    let y = 60;

    doc.setFontSize(20);
    doc.text("CivicSense Reward Coupon", margin, y);
    y += 30;

    doc.setFontSize(12);
    doc.text(`Coupon Code: ${coupon.code}`, margin, y); y += 18;
    doc.text(`Discount: ${coupon.discount}% OFF`, margin, y); y += 18;
    doc.text(`Valid for: Metro / Bus passes`, margin, y); y += 18;
    doc.text(`Expires On: ${new Date(coupon.expires).toLocaleDateString()}`, margin, y); y += 26;

    doc.setFontSize(10);
    doc.text("Show this coupon at the authorized counter to claim your discount. This coupon is valid once and tied to your CivicSense account.", margin, y); y += 40;

    if (user && (user.name || user.email)) {
      doc.setFontSize(11);
      doc.text(`Issued To: ${user.name || user.email}`, margin, y); y += 18;
    }

    doc.setFontSize(9);
    doc.text(`Issued: ${new Date(coupon.issuedAt).toLocaleString()}`, margin, doc.internal.pageSize.height - 40);

    doc.save(`CivicSense-Coupon-${coupon.code}.pdf`);
  } catch (err) {
    // fallback - download simple text file
    try {
      const text = `CivicSense Reward Coupon\n\nCoupon Code: ${coupon.code}\nDiscount: ${coupon.discount}% OFF\nExpires: ${new Date(coupon.expires).toLocaleDateString()}\nIssued: ${new Date(coupon.issuedAt).toLocaleString()}\n\nShow this coupon at the Metro/Bus counter to redeem.`;
      const blob = new Blob([text], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `CivicSense-Coupon-${coupon.code}.txt`;
      a.click();
    } catch (e) {
      console.error("Fallback coupon save failed:", e);
    }
  }
}

// Listen to complaint deletions and deduct points safely (transaction)
function listenToComplaintDeletions(uid) {
  if (!uid) return;
  return db.collection("complaints")
    .where("userId", "==", uid)
    .onSnapshot(async snap => {
      snap.docChanges().forEach(async change => {
        if (change.type === "removed") {
          // Use transaction to safely decrement points and recalc badges
          const userRef = db.collection("users").doc(uid);
          try {
            await db.runTransaction(async (tx) => {
              const uSnap = await tx.get(userRef);
              if (!uSnap.exists) return;

              const data = uSnap.data() || {};
              const prev = typeof data.points === "number" ? data.points : Number(data.points) || 0;
              const newPoints = Math.max(prev - 10, 0);
              tx.update(userRef, { points: newPoints });

              // Recalc badges based on newPoints (do not remove coupon history)
              const newBadges = MILESTONES.filter(m => newPoints >= m.pts).map(m => m.name);
              tx.update(userRef, { badges: newBadges });
            });
            // refresh UI
            await loadRewards(uid);
          } catch (err) {
            console.error("Complaint deletion handling failed:", err);
          }
        }
      });
    });
}

// Simple UI toast helpers (non-blocking)
function showPointsToast() {
  try {
    const t = document.getElementById("pointsToast");
    if (!t) return;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1400);
  } catch (e) { /* ignore */ }
}
function showBadgeToast(name) {
  try {
    const t = document.getElementById("badgeToast");
    if (!t) return;
    t.innerText = "🎖 " + name;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1700);
  } catch (e) { /* ignore */ }
}

// Auto-init on auth change (safe: doesn't redeclare auth/db)
auth?.onAuthStateChanged(user => {
  if (user) {
    setTimeout(() => {
      loadRewards(user.uid);
      loadLeaderboard();
      // keep listener reference if needed elsewhere
      window._complaintDeletionUnsub = listenToComplaintDeletions(user.uid);
    }, 200);
  } else {
    // if signed out, detach listener if exists
    if (window._complaintDeletionUnsub) {
      try { window._complaintDeletionUnsub(); } catch(_) {}
      window._complaintDeletionUnsub = null;
    }
  }
});

// Leaderboard: live top-5
function loadLeaderboard() {
  try {
    db.collection("users")
      .orderBy("points", "desc")
      .limit(5)
      .onSnapshot(snapshot => {
        const ul = document.getElementById("leaderboardList");
        if (!ul) return;
        ul.innerHTML = "";
        snapshot.forEach(doc => {
          const u = doc.data() || {};
          const li = document.createElement("li");
          li.innerText = `${u.name || u.email || "Unknown"} — ${u.points || 0} pts`;
          ul.appendChild(li);
        });
      });
  } catch (err) {
    console.error("loadLeaderboard failed:", err);
  }
}

// Export API to global
window.rewardForComplaint = rewardForComplaint;
window.loadRewards = loadRewards;
window.loadLeaderboard = loadLeaderboard;
window.listenToComplaintDeletions = listenToComplaintDeletions;
