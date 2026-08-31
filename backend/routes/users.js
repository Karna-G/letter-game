const express = require('express');
const mongoose = require('mongoose'); // Added so we can validate ID codes
const router = express.Router();
const User = require('../models/User');
const Letter = require('../models/Letter');
const Report = require('../models/Report'); // --- NEW: Importing the Report blueprint

// ============================================
// HELPER: FILTER NOTE STATUS BY PRIVACY & EXPIRATION (1-day lifespan)
// ============================================
function getVisibleNoteStatus(targetUser, viewerId) {
  if (!targetUser || !targetUser.noteStatus) {
    return {
      noteStatus: '',
      noteStatusPrivacy: 'public',
      noteStatusCreatedAt: null,
      noteStatusExpiresAt: null,
      noteStatusMood: 'quill',
      isNoteExpired: false
    };
  }

  const now = new Date();
  const isExpired = targetUser.noteStatusExpiresAt && new Date(targetUser.noteStatusExpiresAt) < now;
  const isOwner = viewerId && targetUser._id && targetUser._id.toString() === viewerId.toString();

  if (isExpired) {
    if (isOwner) {
      return {
        noteStatus: targetUser.noteStatus,
        noteStatusPrivacy: targetUser.noteStatusPrivacy || 'public',
        noteStatusCreatedAt: targetUser.noteStatusCreatedAt,
        noteStatusExpiresAt: targetUser.noteStatusExpiresAt,
        noteStatusMood: targetUser.noteStatusMood || 'quill',
        isNoteExpired: true
      };
    }
    return {
      noteStatus: '',
      noteStatusPrivacy: targetUser.noteStatusPrivacy || 'public',
      noteStatusCreatedAt: null,
      noteStatusExpiresAt: null,
      noteStatusMood: 'quill',
      isNoteExpired: true
    };
  }

  const privacy = targetUser.noteStatusPrivacy || 'public';
  if (privacy === 'private') {
    if (isOwner) {
      return {
        noteStatus: targetUser.noteStatus,
        noteStatusPrivacy: 'private',
        noteStatusCreatedAt: targetUser.noteStatusCreatedAt,
        noteStatusExpiresAt: targetUser.noteStatusExpiresAt,
        noteStatusMood: targetUser.noteStatusMood || 'quill',
        isNoteExpired: false
      };
    }
    return {
      noteStatus: '',
      noteStatusPrivacy: 'private',
      noteStatusCreatedAt: null,
      noteStatusExpiresAt: null,
      noteStatusMood: 'quill',
      isNoteExpired: false
    };
  }

  if (privacy === 'friends') {
    const isFriend = isOwner || (viewerId && targetUser.friends && targetUser.friends.some(f => (f._id ? f._id.toString() : f.toString()) === viewerId.toString()));
    if (isFriend) {
      return {
        noteStatus: targetUser.noteStatus,
        noteStatusPrivacy: 'friends',
        noteStatusCreatedAt: targetUser.noteStatusCreatedAt,
        noteStatusExpiresAt: targetUser.noteStatusExpiresAt,
        noteStatusMood: targetUser.noteStatusMood || 'quill',
        isNoteExpired: false
      };
    }
    return {
      noteStatus: '',
      noteStatusPrivacy: 'friends',
      noteStatusCreatedAt: null,
      noteStatusExpiresAt: null,
      noteStatusMood: 'quill',
      isNoteExpired: false
    };
  }

  // Public
  return {
    noteStatus: targetUser.noteStatus,
    noteStatusPrivacy: 'public',
    noteStatusCreatedAt: targetUser.noteStatusCreatedAt,
    noteStatusExpiresAt: targetUser.noteStatusExpiresAt,
    noteStatusMood: targetUser.noteStatusMood || 'quill',
    isNoteExpired: false
  };
}

// Get directory of all mailmen and their service history
router.get('/mailmen', async (req, res) => {
  try {
    const viewerId = req.query.viewerId;
    const mailmen = await User.find({ role: 'mailman' }).select('-password -location');
    
    const mailmenWithHistory = await Promise.all(mailmen.map(async (mailman) => {
      // Find all delivered letters by this mailman, populate sender and receiver
      const letters = await Letter.find({ mailmanRef: mailman._id, status: 'delivered' })
        .populate('senderRef', 'name')
        .populate('receiverRef', 'name');
        
      const sendersServiced = new Map();
      const receiversServiced = new Map();
      
      letters.forEach(letter => {
        if (letter.senderRef) {
          sendersServiced.set(letter.senderRef._id.toString(), letter.senderRef.name);
        }
        if (letter.receiverRef && letter.receiverRef.name) {
          receiversServiced.set(letter.receiverRef._id.toString(), letter.receiverRef.name);
        }
      });
      
      const noteInfo = getVisibleNoteStatus(mailman, viewerId);

      return {
        _id: mailman._id,
        name: mailman.name,
        reputationScore: mailman.reputationScore,
        rank: mailman.rank,
        xp: mailman.xp,
        badges: mailman.badges,
        deliveriesCompleted: mailman.deliveriesCompleted,
        servicedSenders: Array.from(sendersServiced.values()),
        servicedReceivers: Array.from(receiversServiced.values()),
        noteStatus: noteInfo.noteStatus,
        noteStatusPrivacy: noteInfo.noteStatusPrivacy,
        noteStatusExpiresAt: noteInfo.noteStatusExpiresAt,
        noteStatusMood: noteInfo.noteStatusMood,
        isNoteExpired: noteInfo.isNoteExpired
      };
    }));
    
    res.json(mailmenWithHistory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching mailmen directory' });
  }
});

// Feature 11: Guild Leaderboards — top mailmen (by XP) & top senders (by reputation)
// Must be declared before the generic '/:id' route below.
router.get('/leaderboard', async (req, res) => {
  try {
    const viewerId = req.query.viewerId;

    const topMailmenRaw = await User.find({ role: 'mailman' })
      .select('name xp rank deliveriesCompleted badges noteStatus noteStatusPrivacy noteStatusExpiresAt noteStatusMood friends')
      .sort({ xp: -1 })
      .limit(10);

    const topSendersRaw = await User.find({ role: 'sender' })
      .select('name reputationScore lettersSent noteStatus noteStatusPrivacy noteStatusExpiresAt noteStatusMood friends')
      .sort({ reputationScore: -1 })
      .limit(10);

    const formatUserWithNote = (u) => {
      const noteInfo = getVisibleNoteStatus(u, viewerId);
      return {
        _id: u._id,
        name: u.name,
        xp: u.xp,
        rank: u.rank,
        deliveriesCompleted: u.deliveriesCompleted,
        badges: u.badges,
        reputationScore: u.reputationScore,
        lettersSent: u.lettersSent,
        noteStatus: noteInfo.noteStatus,
        noteStatusPrivacy: noteInfo.noteStatusPrivacy,
        noteStatusExpiresAt: noteInfo.noteStatusExpiresAt,
        noteStatusMood: noteInfo.noteStatusMood,
        isNoteExpired: noteInfo.isNoteExpired
      };
    };

    const topMailmen = topMailmenRaw.map(formatUserWithNote);
    const topSenders = topSendersRaw.map(formatUserWithNote);

    res.json({
      mailmanOfTheMonth: topMailmen.length > 0 ? topMailmen[0] : null,
      topMailmen,
      topSenders
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
});

// ============================================
// --- NEW: THE REPORT SYSTEM ---
// ============================================
router.post('/report', async (req, res) => {
  try {
    const { reporterId, reportedUserId, reason, letterId } = req.body;
    const Letter = require('../models/Letter');
    
    let targetUserId = reportedUserId;
    let letterDoc = null;
    let isAnon = false;
    let snippet = '';

    if (letterId) {
      letterDoc = await Letter.findById(letterId);
      if (letterDoc) {
        targetUserId = letterDoc.senderRef || targetUserId;
        isAnon = letterDoc.isAnonymous || false;
        snippet = letterDoc.content ? letterDoc.content.slice(0, 200) : '';
      }
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Reported user identification could not be determined.' });
    }
    
    // Create the formal report document with true sender link
    const newReport = new Report({
      reporter: reporterId,
      reportedUser: targetUserId,
      letterRef: letterDoc ? letterDoc._id : undefined,
      letterSnippet: snippet,
      isAnonymousBottle: isAnon,
      reason: reason
    });
    
    await newReport.save();
    res.json({ message: 'Report submitted successfully. The Guild Tribunal will review this matter.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error submitting report' });
  }
});

// Admin: Fetch all reports for the Tribunal
router.get('/reports/all', async (req, res) => {
  try {
    // We 'populate' so the Admin sees actual names and unmasks anonymous senders
    const reports = await Report.find()
      .populate('reporter', 'name email role')
      .populate('reportedUser', 'name email role location restrictedUntil')
      .populate({
        path: 'letterRef',
        select: 'content type bottleMoniker isAnonymous bottleDrift createdAt'
      })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching reports' });
  }
});

// Admin: Resolve or Dismiss a report
// Admin: Verdict Delivery
router.post('/reports/:id/verdict', async (req, res) => {
  try {
    const Letter = require('../models/Letter');
    const Report = require('../models/Report');
    const User = require('../models/User'); // We need the User blueprint!
    
    const { message, reporterId } = req.body;
    
    // 1. Completely ignore the browser. Find the REAL Admin in the database!
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) return res.status(500).json({ error: 'No Admin account found in DB!' });

    // 2. Force create the letter using the Admin's true ID
    const newLetter = new Letter({
      senderRef: adminUser._id,
      receiverRef: reporterId,
      content: message, // Sending exactly what you typed!
      type: 'standard',
      status: 'delivered',
      deliveredAt: new Date()
    });
    await newLetter.save();
    
    // 3. Mark the report as resolved
    await Report.findByIdAndUpdate(req.params.id, { status: 'resolved' });
    
    res.json({ message: 'God Mode Verdict Delivered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error sending verdict' });
  }
});
// ============================================
// --- THE FELLOWSHIP & FRIEND REQUESTS SYSTEM ---
// ============================================

// 1. Fetch a user's friends list
router.get('/:id/friends', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('friends', 'name email role reputationScore xp rank noteStatus noteStatusPrivacy noteStatusExpiresAt noteStatusMood');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const formattedFriends = (user.friends || []).map(f => {
      const noteInfo = getVisibleNoteStatus(f, req.params.id);
      const fObj = f.toObject ? f.toObject() : f;
      return {
        ...fObj,
        noteStatus: noteInfo.noteStatus,
        noteStatusPrivacy: noteInfo.noteStatusPrivacy,
        noteStatusExpiresAt: noteInfo.noteStatusExpiresAt,
        noteStatusMood: noteInfo.noteStatusMood,
        isNoteExpired: noteInfo.isNoteExpired
      };
    });

    res.json(formattedFriends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching friends' });
  }
});

// 2. Fetch pending incoming and outgoing friend requests
router.get('/:id/friend-requests', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('friendRequestsReceived.from', 'name email role reputationScore xp rank noteStatus noteStatusPrivacy noteStatusExpiresAt noteStatusMood')
      .populate('friendRequestsSent.to', 'name email role reputationScore xp rank noteStatus noteStatusPrivacy noteStatusExpiresAt noteStatusMood');
      
    if (!user) return res.status(404).json({ message: 'User not found' });

    const incoming = (user.friendRequestsReceived || []).filter(r => r.from != null);
    const outgoing = (user.friendRequestsSent || []).filter(r => r.to != null);

    res.json({ incoming, outgoing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching friend requests' });
  }
});

// 3. Send a friend request via Email or User ID Code
router.post('/:id/friends/request', async (req, res) => {
  try {
    const friendCode = (req.body.friendCode || '').trim();
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!friendCode) {
      return res.status(400).json({ message: 'Please provide a valid scroll address or ID code.' });
    }

    // Search by email or MongoDB ObjectId
    let friend = await User.findOne({ email: friendCode });
    if (!friend && mongoose.Types.ObjectId.isValid(friendCode)) {
      friend = await User.findById(friendCode);
    }

    if (!friend) {
      return res.status(404).json({ message: 'No traveller found with that code or scroll address.' });
    }

    // Cannot send request to oneself
    if (friend._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Thou cannot send a friend request to thyself!' });
    }

    // Check if already friends
    const alreadyFriends = user.friends.some(f => f.toString() === friend._id.toString());
    if (alreadyFriends) {
      return res.status(400).json({ message: 'This traveller is already in thy fellowship.' });
    }

    // Check if user already sent a request to this person
    const alreadySent = (user.friendRequestsSent || []).some(r => r.to && r.to.toString() === friend._id.toString());
    if (alreadySent) {
      return res.status(400).json({ message: 'A friend request is already pending for this traveller.' });
    }

    // Check if this person ALREADY sent a request to user -> If so, auto-accept and unite them!
    const receivedIndex = (user.friendRequestsReceived || []).findIndex(r => r.from && r.from.toString() === friend._id.toString());
    if (receivedIndex !== -1) {
      user.friendRequestsReceived.splice(receivedIndex, 1);
      friend.friendRequestsSent = (friend.friendRequestsSent || []).filter(r => r.to && r.to.toString() !== user._id.toString());
      
      user.friends.push(friend._id);
      friend.friends.push(user._id);

      await user.save();
      await friend.save();

      return res.json({
        message: `Mutual alliance! ${friend.name} had also sent thee a request; ye are now companions.`,
        status: 'accepted',
        friend: { _id: friend._id, name: friend.name, email: friend.email }
      });
    }

    // Push into sender's outgoing and recipient's incoming
    user.friendRequestsSent.push({ to: friend._id, createdAt: new Date() });
    friend.friendRequestsReceived.push({ from: user._id, createdAt: new Date() });

    await user.save();
    await friend.save();

    res.json({
      message: `Friend request dispatched to ${friend.name}! Awaiting their seal of acceptance.`,
      status: 'pending'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error sending friend request' });
  }
});

// Backward compatibility alias for add friend
router.post('/:id/friends/add', async (req, res, next) => {
  req.url = `/${req.params.id}/friends/request`;
  router.handle(req, res, next);
});

// 4. Accept an incoming friend request
router.post('/:id/friends/accept', async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId) return res.status(400).json({ message: 'Requester ID required' });

    const user = await User.findById(req.params.id);
    const requester = await User.findById(requesterId);

    if (!user || !requester) return res.status(404).json({ message: 'Traveller not found' });

    // Remove from user's incoming requests
    user.friendRequestsReceived = (user.friendRequestsReceived || []).filter(
      r => r.from && r.from.toString() !== requester._id.toString()
    );

    // Remove from requester's outgoing requests
    requester.friendRequestsSent = (requester.friendRequestsSent || []).filter(
      r => r.to && r.to.toString() !== user._id.toString()
    );

    // Add to mutual friends if not already present
    if (!user.friends.some(f => f.toString() === requester._id.toString())) {
      user.friends.push(requester._id);
    }
    if (!requester.friends.some(f => f.toString() === user._id.toString())) {
      requester.friends.push(user._id);
    }

    await user.save();
    await requester.save();

    res.json({
      message: `Bond sealed! ${requester.name} is now a companion in thy fellowship.`,
      friend: { _id: requester._id, name: requester.name, email: requester.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error accepting friend request' });
  }
});

// 5. Reject an incoming friend request
router.post('/:id/friends/reject', async (req, res) => {
  try {
    const { requesterId } = req.body;
    if (!requesterId) return res.status(400).json({ message: 'Requester ID required' });

    const user = await User.findById(req.params.id);
    const requester = await User.findById(requesterId);

    if (user) {
      user.friendRequestsReceived = (user.friendRequestsReceived || []).filter(
        r => r.from && r.from.toString() !== requesterId.toString()
      );
      await user.save();
    }

    if (requester) {
      requester.friendRequestsSent = (requester.friendRequestsSent || []).filter(
        r => r.to && r.to.toString() !== req.params.id.toString()
      );
      await requester.save();
    }

    res.json({ message: 'Friend request declined.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error rejecting friend request' });
  }
});

// 6. Cancel a sent friend request (Retract)
router.post('/:id/friends/cancel', async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) return res.status(400).json({ message: 'Recipient ID required' });

    const user = await User.findById(req.params.id);
    const recipient = await User.findById(recipientId);

    if (user) {
      user.friendRequestsSent = (user.friendRequestsSent || []).filter(
        r => r.to && r.to.toString() !== recipientId.toString()
      );
      await user.save();
    }

    if (recipient) {
      recipient.friendRequestsReceived = (recipient.friendRequestsReceived || []).filter(
        r => r.from && r.from.toString() !== req.params.id.toString()
      );
      await recipient.save();
    }

    res.json({ message: 'Friend request retracted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error cancelling friend request' });
  }
});

// 7. Remove companion from fellowship (Unfriend mutually)
router.post('/:id/friends/remove', async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ message: 'Friend ID required' });

    const user = await User.findById(req.params.id);
    const friend = await User.findById(friendId);

    if (user) {
      user.friends = (user.friends || []).filter(f => f.toString() !== friendId.toString());
      await user.save();
    }

    if (friend) {
      friend.friends = (friend.friends || []).filter(f => f.toString() !== req.params.id.toString());
      await friend.save();
    }

    res.json({ message: 'Traveller removed from thy fellowship.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error removing friend' });
  }
});

// Update user GPS location for live map
router.put('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ message: 'Valid lat/lng required' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { location: { type: 'Point', coordinates: [lng, lat] } },
      { new: true }
    ).select('-password');
    res.json({ message: 'Location updated', location: user.location });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating location' });
  }
});

// Feature: Interactive Cartographic Note Status (Upload & Proclaim Status with 1-day lifespan & privacy)
router.put('/:id/note-status', async (req, res) => {
  try {
    const { noteStatus, privacy = 'public', mood = 'quill' } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Traveller not found' });

    const trimmed = (noteStatus || '').trim();
    if (trimmed) {
      user.noteStatus = trimmed.slice(0, 200);
      user.noteStatusPrivacy = ['public', 'friends', 'private'].includes(privacy) ? privacy : 'public';
      user.noteStatusMood = mood || 'quill';
      user.noteStatusCreatedAt = new Date();
      user.noteStatusExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 solar day (24 hours)
    } else {
      user.noteStatus = '';
      user.noteStatusPrivacy = 'public';
      user.noteStatusCreatedAt = null;
      user.noteStatusExpiresAt = null;
      user.noteStatusMood = 'quill';
    }

    await user.save();

    // Update active map users memory if user is on map
    const activeMapUsers = req.app.get('activeMapUsers');
    if (activeMapUsers && activeMapUsers.has(user._id.toString())) {
      const existing = activeMapUsers.get(user._id.toString());
      existing.noteStatus = user.noteStatus;
      existing.noteStatusPrivacy = user.noteStatusPrivacy;
      existing.noteStatusExpiresAt = user.noteStatusExpiresAt;
      existing.noteStatusMood = user.noteStatusMood;
      activeMapUsers.set(user._id.toString(), existing);
    }

    // Broadcast update via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.emit('user-note-updated', {
        userId: user._id.toString(),
        noteStatus: user.noteStatus,
        noteStatusPrivacy: user.noteStatusPrivacy,
        noteStatusExpiresAt: user.noteStatusExpiresAt,
        noteStatusMood: user.noteStatusMood
      });
    }

    res.json({
      message: trimmed ? 'Cartographic Note Status proclaimed across the realm!' : 'Note status cleared from the archives.',
      noteStatus: user.noteStatus,
      noteStatusPrivacy: user.noteStatusPrivacy,
      noteStatusCreatedAt: user.noteStatusCreatedAt,
      noteStatusExpiresAt: user.noteStatusExpiresAt,
      noteStatusMood: user.noteStatusMood
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating note status' });
  }
});

// Fetch active users / mailmen for MapTracker (Only actively connected users)
router.get('/map/active-users', async (req, res) => {
  try {
    const { lat, lng, radius, viewerId } = req.query;
    const activeMapUsers = req.app.get('activeMapUsers');
    const users = activeMapUsers ? Array.from(activeMapUsers.values()) : [];

    const now = new Date();

    const sanitizedUsers = users.map(u => {
      let visibleStatus = u.noteStatus || '';
      const isExpired = u.noteStatusExpiresAt && new Date(u.noteStatusExpiresAt) < now;
      const isOwner = viewerId && String(u.userId || u._id) === String(viewerId);

      if (isExpired) {
        visibleStatus = isOwner ? visibleStatus : '';
      } else if (u.noteStatusPrivacy === 'private' && !isOwner) {
        visibleStatus = '';
      }

      return {
        ...u,
        noteStatus: visibleStatus,
        isNoteExpired: isExpired
      };
    });

    if (lat && lng) {
      const R = 6371000;
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const rad = radius ? parseFloat(radius) : Infinity;

      const filtered = [];
      sanitizedUsers.forEach(u => {
        const uLat = u.lat ?? u.location?.coordinates?.[1];
        const uLng = u.lng ?? u.location?.coordinates?.[0];
        if (typeof uLat !== 'number' || typeof uLng !== 'number' || (uLat === 0 && uLng === 0)) return;

        const dLat = (uLat - userLat) * Math.PI / 180;
        const dLng = (uLng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat/2) ** 2 +
                  Math.cos(userLat * Math.PI / 180) *
                  Math.cos(uLat * Math.PI / 180) *
                  Math.sin(dLng/2) ** 2;
        const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
        if (distance <= rad) {
          filtered.push({ ...u, distanceMeters: distance });
        }
      });
      return res.json(filtered);
    }

    res.json(sanitizedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching map users' });
  }
});

// Feature 25: Toggle Dybbuk Mode for a User
router.put('/:id/dybbuk-mode', async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.dybbukMode = typeof enabled === 'boolean' ? enabled : !user.dybbukMode;
    await user.save();

    res.json({
      message: user.dybbukMode ? '👻 Dybbuk Mode Awakened! Spectral missives shall manifest periodically.' : '👻 Dybbuk Mode Quieted. The astral veil rests.',
      dybbukMode: user.dybbukMode
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating Dybbuk Mode' });
  }
});

// ============================================
// Get user profile by ID (Must remain at bottom)
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const viewerId = req.query.viewerId || req.params.id;
    // Populate friends so the frontend profile instantly has them
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('friends', 'name email role reputationScore xp rank noteStatus noteStatusPrivacy noteStatusExpiresAt noteStatusMood');
      
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isSelf = viewerId && user._id.toString() === viewerId.toString();
    const userObj = user.toObject();

    const noteInfo = getVisibleNoteStatus(user, viewerId);
    userObj.noteStatus = isSelf ? (user.noteStatus || '') : noteInfo.noteStatus;
    userObj.noteStatusPrivacy = user.noteStatusPrivacy || 'public';
    userObj.noteStatusExpiresAt = user.noteStatusExpiresAt;
    userObj.noteStatusCreatedAt = user.noteStatusCreatedAt;
    userObj.noteStatusMood = user.noteStatusMood || 'quill';
    userObj.isNoteExpired = noteInfo.isNoteExpired;

    // Also sanitize noteStatus of friends if populated
    if (userObj.friends && Array.isArray(userObj.friends)) {
      userObj.friends = userObj.friends.map(f => {
        const fNote = getVisibleNoteStatus(f, viewerId);
        return {
          ...f,
          noteStatus: fNote.noteStatus,
          noteStatusPrivacy: fNote.noteStatusPrivacy,
          noteStatusExpiresAt: fNote.noteStatusExpiresAt,
          noteStatusMood: fNote.noteStatusMood,
          isNoteExpired: fNote.isNoteExpired
        };
      });
    }

    res.json(userObj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

module.exports = router;