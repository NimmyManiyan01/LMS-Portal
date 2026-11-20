// In-memory WebRTC Signaling & Frame Store for Student-to-Admin Live Proctoring
const sessions = new Map();

function getSession(attemptId) {
  const key = String(attemptId);
  if (!sessions.has(key)) {
    sessions.set(key, {
      offer: null,
      answer: null,
      studentCandidates: [],
      adminCandidates: [],
      frame: null,
      lastFrameAt: 0,
      updatedAt: Date.now(),
    });
  }
  return sessions.get(key);
}

function storeStudentSignal(attemptId, payload) {
  if (!attemptId || !payload) return;
  const session = getSession(attemptId);
  session.updatedAt = Date.now();

  if (payload.offer) {
    session.offer = payload.offer;
    // Reset answer and candidates for fresh offer renegotiation
    session.answer = null;
    session.adminCandidates = [];
  }
  if (payload.candidate) {
    if (session.studentCandidates.length < 30) {
      session.studentCandidates.push(payload.candidate);
    }
  }
  if (payload.frame && typeof payload.frame === "string") {
    session.frame = payload.frame;
    session.lastFrameAt = Date.now();
  }
}

function storeAdminSignal(attemptId, payload) {
  if (!attemptId || !payload) return;
  const session = getSession(attemptId);
  session.updatedAt = Date.now();

  if (payload.answer) {
    session.answer = payload.answer;
  }
  if (payload.candidate) {
    if (session.adminCandidates.length < 30) {
      session.adminCandidates.push(payload.candidate);
    }
  }
}

function getSessionState(attemptId) {
  const key = String(attemptId);
  if (!sessions.has(key)) return null;
  const session = sessions.get(key);

  // Expire session if inactive for > 30 seconds
  if (Date.now() - session.updatedAt > 30000) {
    sessions.delete(key);
    return null;
  }
  return session;
}

function clearSession(attemptId) {
  sessions.delete(String(attemptId));
}

module.exports = {
  storeStudentSignal,
  storeAdminSignal,
  getSessionState,
  clearSession,
};
