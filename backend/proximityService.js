const User = require('./models/User');
const Letter = require('./models/Letter');

// Cooldown map: key = `${userId}:${courierId}`, value = timestamp
const alertCooldowns = new Map();
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes cooldown so sender is pinged only once per encounter
const DEFAULT_REALM_COORDS = { lat: 51.5074, lng: -0.1278 };

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
    return Infinity;
  }
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Emit an alert event to all active sockets belonging to a specific user
 */
function emitToUserSockets(io, userSocketMap, userId, eventName, payload) {
  if (!io || !userSocketMap || !userId) return;
  const targetId = String(userId);
  for (const [socketId, mappedUserId] of userSocketMap.entries()) {
    if (String(mappedUserId) === targetId) {
      io.to(socketId).emit(eventName, payload);
    }
  }
}

/**
 * Evaluates real-time proximity when ANY user (mailman or scribe) moves, joins, or logs in.
 * NOTE: Pings are ONLY sent to Senders/Scribes. Mailmen never receive proximity pings.
 */
async function evaluateProximity(userId, lat, lng, role, io, activeMapUsers, userSocketMap) {
  try {
    if (!io || !userSocketMap) return;

    const movingUserId = String(userId);

    // Fetch all pending letters in the realm
    const pendingLetters = await Letter.find({ status: 'pending' })
      .populate('senderRef', 'name email pickupAlertSettings location')
      .populate('receiverRef', 'name');

    const pendingBySender = new Map();
    for (const letter of pendingLetters) {
      if (!letter.senderRef) continue;
      const sId = String(letter.senderRef._id || letter.senderRef);
      if (!pendingBySender.has(sId)) {
        pendingBySender.set(sId, []);
      }
      pendingBySender.get(sId).push(letter);
    }

    if (role === 'mailman') {
      // Mailman moved: check all Scribes who have pending letters or alert settings enabled
      const courier = await User.findById(movingUserId).select('name role rank xp reputationScore location');
      if (!courier) return;

      const courierLat = (typeof lat === 'number' && lat !== 0) ? lat : (courier.location?.coordinates?.[1] || DEFAULT_REALM_COORDS.lat);
      const courierLng = (typeof lng === 'number' && lng !== 0) ? lng : (courier.location?.coordinates?.[0] || DEFAULT_REALM_COORDS.lng);

      const candidateUserIds = new Set();
      if (activeMapUsers) {
        for (const u of activeMapUsers.values()) {
          const uId = String(u.userId || u._id);
          if (uId !== movingUserId && u.role !== 'mailman') candidateUserIds.add(uId);
        }
      }
      for (const sId of pendingBySender.keys()) {
        if (sId !== movingUserId) candidateUserIds.add(sId);
      }

      for (const targetId of candidateUserIds) {
        await checkPairProximity(targetId, movingUserId, courier, courierLat, courierLng, pendingBySender, activeMapUsers, io, userSocketMap);
      }
    } else {
      // Sender/Scribe moved: check nearby Mailmen
      const targetUser = await User.findById(movingUserId).select('name role pickupAlertSettings location');
      if (!targetUser || targetUser.role === 'mailman') return;

      const activeList = activeMapUsers ? Array.from(activeMapUsers.values()) : [];
      const couriersToCheck = activeList.filter(u => u.role === 'mailman' && String(u.userId || u._id) !== movingUserId);

      for (const activeCourier of couriersToCheck) {
        const courierId = String(activeCourier.userId || activeCourier._id);
        const cLat = activeCourier.lat ?? activeCourier.location?.coordinates?.[1] ?? DEFAULT_REALM_COORDS.lat;
        const cLng = activeCourier.lng ?? activeCourier.location?.coordinates?.[0] ?? DEFAULT_REALM_COORDS.lng;

        await checkPairProximity(movingUserId, courierId, activeCourier, cLat, cLng, pendingBySender, activeMapUsers, io, userSocketMap);
      }
    }
  } catch (err) {
    console.error('Error evaluating proximity:', err);
  }
}

/**
 * Helper to check distance and dispatch alerts ONLY to the Scribe
 */
async function checkPairProximity(targetUserId, courierId, courierObj, courierLat, courierLng, pendingBySender, activeMapUsers, io, userSocketMap) {
  try {
    const user = await User.findById(targetUserId).select('name email location pickupAlertSettings role');
    if (!user || user.role === 'mailman') return;

    const settings = user.pickupAlertSettings || {
      enabled: true,
      radiusMeters: 250,
      soundEnabled: true,
      notifyAllCouriers: false
    };

    if (settings.enabled === false) return;

    const userPendingLetters = pendingBySender.get(String(targetUserId)) || [];
    if (userPendingLetters.length === 0 && !settings.notifyAllCouriers) {
      return;
    }

    // Determine target user coordinates
    let userLat = null;
    let userLng = null;

    const activePresence = activeMapUsers ? activeMapUsers.get(String(targetUserId)) : null;
    if (activePresence && typeof activePresence.lat === 'number' && typeof activePresence.lng === 'number' && (activePresence.lat !== 0 || activePresence.lng !== 0)) {
      userLat = activePresence.lat;
      userLng = activePresence.lng;
    } else if (user.location?.coordinates && (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0)) {
      userLat = user.location.coordinates[1];
      userLng = user.location.coordinates[0];
    } else if (userPendingLetters.length > 0 && userPendingLetters[0].senderLocation?.lat && userPendingLetters[0].senderLocation?.lng) {
      userLat = userPendingLetters[0].senderLocation.lat;
      userLng = userPendingLetters[0].senderLocation.lng;
    } else {
      userLat = DEFAULT_REALM_COORDS.lat;
      userLng = DEFAULT_REALM_COORDS.lng;
    }

    const cLat = typeof courierLat === 'number' && courierLat !== 0 ? courierLat : DEFAULT_REALM_COORDS.lat;
    const cLng = typeof courierLng === 'number' && courierLng !== 0 ? courierLng : DEFAULT_REALM_COORDS.lng;

    const distance = calculateDistanceMeters(cLat, cLng, userLat, userLng);
    const alertRadius = settings.radiusMeters || 250;

    if (distance <= alertRadius) {
      const cooldownKey = `${targetUserId}:${courierId}`;
      const lastAlert = alertCooldowns.get(cooldownKey) || 0;
      const now = Date.now();

      if (now - lastAlert >= COOLDOWN_MS) {
        alertCooldowns.set(cooldownKey, now);

        const realCourierName = courierObj.name || 'Royal Mailman';
        const realCourierRank = courierObj.rank || 'Royal Mailman';

        const alertPayload = {
          id: `alert-${targetUserId}-${courierId}-${now}`,
          mailmanId: String(courierId),
          mailmanName: realCourierName,
          mailmanRank: realCourierRank,
          distanceMeters: distance,
          alertRadius: alertRadius,
          soundEnabled: settings.soundEnabled !== false,
          timestamp: new Date().toISOString(),
          pendingCount: userPendingLetters.length,
          pendingLetters: userPendingLetters.map(l => ({
            id: l._id,
            receiverName: l.receiverRef?.name || 'Fellow Scribe',
            qrCodeToken: l.qrCodeToken,
            type: l.type,
            font: l.font
          })),
          message: userPendingLetters.length > 0
            ? `Royal Mailman ${realCourierName} is within ${distance}m! ${userPendingLetters.length} missive(s) ready for physical handover.`
            : `Royal Mailman ${realCourierName} is within ${distance}m perimeter.`
        };

        console.log(`[PROXIMITY ALERT] Emitting single encounter alert to Scribe "${user.name}" (${targetUserId}) for Mailman "${realCourierName}" at ${distance}m`);
        emitToUserSockets(io, userSocketMap, targetUserId, 'pickup-radius-alert', alertPayload);
      }
    }
  } catch (e) {
    console.error('Error checking pair proximity:', e);
  }
}

/**
 * Check proximity immediately upon a new letter being dispatched / sealed
 */
async function checkProximityForNewLetter(letter, io, activeMapUsers, userSocketMap) {
  try {
    if (!letter || letter.status !== 'pending') return;
    const senderId = String(letter.senderRef?._id || letter.senderRef);

    const sender = await User.findById(senderId).select('name pickupAlertSettings location role');
    if (!sender || sender.role === 'mailman') return;

    const settings = sender?.pickupAlertSettings || {
      enabled: true,
      radiusMeters: 250,
      soundEnabled: true
    };
    if (settings.enabled === false) return;

    const senderLat = letter.senderLocation?.lat || sender?.location?.coordinates?.[1] || DEFAULT_REALM_COORDS.lat;
    const senderLng = letter.senderLocation?.lng || sender?.location?.coordinates?.[0] || DEFAULT_REALM_COORDS.lng;

    const alertRadius = settings.radiusMeters || 250;
    const activeList = activeMapUsers ? Array.from(activeMapUsers.values()) : [];
    const couriersToCheck = activeList.filter(u => u.role === 'mailman' && String(u.userId || u._id) !== senderId);

    for (const activeUser of couriersToCheck) {
      const courierId = String(activeUser.userId || activeUser._id);
      const cLat = activeUser.lat ?? activeUser.location?.coordinates?.[1] ?? DEFAULT_REALM_COORDS.lat;
      const cLng = activeUser.lng ?? activeUser.location?.coordinates?.[0] ?? DEFAULT_REALM_COORDS.lng;

      const distance = calculateDistanceMeters(cLat, cLng, senderLat, senderLng);
      if (distance <= alertRadius) {
        const cooldownKey = `${senderId}:${courierId}`;
        const lastAlert = alertCooldowns.get(cooldownKey) || 0;
        const now = Date.now();

        if (now - lastAlert >= COOLDOWN_MS) {
          alertCooldowns.set(cooldownKey, now);

          const realCourierName = activeUser.name || 'Royal Mailman';
          const realCourierRank = activeUser.rank || 'Royal Mailman';

          const alertPayload = {
            id: `alert-${senderId}-${courierId}-${now}`,
            mailmanId: courierId,
            mailmanName: realCourierName,
            mailmanRank: realCourierRank,
            distanceMeters: distance,
            alertRadius: alertRadius,
            soundEnabled: settings.soundEnabled !== false,
            timestamp: new Date().toISOString(),
            pendingCount: 1,
            pendingLetters: [{
              id: letter._id,
              receiverName: letter.receiverRef?.name || 'Fellow Scribe',
              qrCodeToken: letter.qrCodeToken,
              type: letter.type
            }],
            message: `Royal Mailman ${realCourierName} is within ${distance}m! Ready for QR handover.`
          };

          emitToUserSockets(io, userSocketMap, senderId, 'pickup-radius-alert', alertPayload);
        }
      }
    }
  } catch (err) {
    console.error('Error checking proximity for new letter:', err);
  }
}

module.exports = {
  calculateDistanceMeters,
  evaluateProximity,
  checkProximityForNewLetter
};

