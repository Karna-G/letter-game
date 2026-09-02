const express = require('express');
const router = express.Router();
const Letter = require('../models/Letter');
const User = require('../models/User');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { checkProximityForNewLetter } = require('../proximityService');

// Get all letters where user is the Sender (Active, non-trashed, non-abandoned, sorted latest to oldest)
router.get('/user/:userId', async (req, res) => {
  try {
    const letters = await Letter.find({
      senderRef: req.params.userId,
      trashedBySender: { $ne: true },
      isAbandoned: { $ne: true }
    })
    .populate('senderRef', 'name email role')
    .populate('receiverRef', 'name email role')
    .populate('mailmanRef', 'name email role')
    .sort({ createdAt: -1, updatedAt: -1 });

    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sent letters' });
  }
});

// Get all delivered (and burned) letters for a specific user's Mailbox (Active, non-trashed, sorted latest to oldest)
router.get('/mailbox/:userId', async (req, res) => {
  try {
    const letters = await Letter.find({
      receiverRef: req.params.userId,
      status: { $in: ['delivered', 'burned'] },
      isTorn: { $ne: true },
      trashedByReceiver: { $ne: true },
      isAbandoned: { $ne: true }
    })
    .populate('senderRef', 'name email role')
    .populate('receiverRef', 'name email role')
    .populate('mailmanRef', 'name email role')
    .sort({ deliveredAt: -1, createdAt: -1, updatedAt: -1 });

    // Feature 22: Burn After Reading — auto-burn any letter whose fade window has elapsed
    const now = Date.now();
    for (const letter of letters) {
      const windowMs = (letter.burnTimerSeconds || 60) * 1000;
      if (
        letter.status === 'delivered' &&
        letter.burnAfterReading &&
        letter.firstReadAt &&
        now - new Date(letter.firstReadAt).getTime() >= windowMs
      ) {
        letter.status = 'burned';
        letter.content = '🔥 The ink hath faded to nothingness. This letter is lost forever.';
        await letter.save();
      }
    }

    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching mailbox letters' });
  }
});

// Get active quests (letters in-transit) for a specific mailman
router.get('/mailman/:userId/active', async (req, res) => {
  try {
    const letters = await Letter.find({
      mailmanRef: req.params.userId,
      status: 'in-transit'
    }).populate('senderRef', 'name').populate('receiverRef', 'name');
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active quests' });
  }
});

// Sender Reputation Score (Feature 8): awarded per dispatched (sealed) letter, unlocks free stamps
const REPUTATION_PER_LETTER = 10;

// Create a new letter (or draft)
router.post('/', async (req, res) => {
  try {
    const { senderRef, receiverRef, content, type, scheduledFor, status, burnAfterReading, burnTimerSeconds, senderLocation, font, fontSize, schrodingerVariants } = req.body;

    // Only generate QR code token if it's being immediately dispatched ('pending')
    const initialStatus = status === 'draft' ? 'draft' : 'pending';
    const qrCodeToken = initialStatus === 'pending' ? uuidv4() : undefined;

    // Resolve coordinates for letter
    let resolvedSenderLocation = (senderLocation && typeof senderLocation.lat === 'number' && typeof senderLocation.lng === 'number')
      ? senderLocation
      : undefined;

    if (!resolvedSenderLocation && senderRef) {
      const senderUser = await User.findById(senderRef).select('location');
      if (senderUser?.location?.coordinates && (senderUser.location.coordinates[0] !== 0 || senderUser.location.coordinates[1] !== 0)) {
        resolvedSenderLocation = {
          lat: senderUser.location.coordinates[1],
          lng: senderUser.location.coordinates[0]
        };
      } else {
        resolvedSenderLocation = { lat: 51.5074, lng: -0.1278 };
      }
    }

    const letterData = {
      senderRef,
      content,
      type: type || 'standard',
      font: font || 'Cinzel',
      fontSize: fontSize || 'medium',
      scheduledFor,
      qrCodeToken,
      status: initialStatus,
      burnAfterReading: !!burnAfterReading,
      burnTimerSeconds: Number(burnTimerSeconds) > 0 ? Number(burnTimerSeconds) : 60,
      senderLocation: resolvedSenderLocation,
      sealedAt: initialStatus === 'pending' ? Date.now() : undefined
    };

    if (type === 'schrodinger' && Array.isArray(schrodingerVariants) && schrodingerVariants.length > 0) {
      letterData.schrodingerVariants = schrodingerVariants;
      letterData.schrodingerState = 'superposition';
    }

    // Only add receiverRef if it's explicitly provided and not an empty string
    if (receiverRef && receiverRef.trim() !== '') {
      const query = receiverRef.trim();
      const user = await User.findOne({
        $or: [{ name: query }, { email: query }]
      });

      if (user) {
        letterData.receiverRef = user._id;
      } else if (mongoose.Types.ObjectId.isValid(query)) {
        letterData.receiverRef = query;
      } else {
        return res.status(400).json({ message: `Could not find any user named "${query}" in the Guild.` });
      }
    }

    const newLetter = new Letter(letterData);
    await newLetter.save();

    // Feature 8: Sender Reputation Score — grows with every letter actually dispatched
    if (initialStatus === 'pending' && senderRef) {
      await User.findByIdAndUpdate(senderRef, {
        $inc: { reputationScore: REPUTATION_PER_LETTER, lettersSent: 1 }
      });
      const io = req.app.get('io');
      const activeMapUsers = req.app.get('activeMapUsers');
      const userSocketMap = req.app.get('userSocketMap');
      if (io) io.emit('letters-updated');
      if (io && activeMapUsers) {
        checkProximityForNewLetter(newLetter, io, activeMapUsers, userSocketMap);
      }
    }

    res.status(201).json(newLetter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating letter' });
  }
});

// Update an existing letter (e.g. edit a draft, or dispatch a draft)
router.put('/:id', async (req, res) => {
  try {
    const { receiverRef, content, status, burnAfterReading, burnTimerSeconds, font, fontSize, type, schrodingerVariants } = req.body;
    const letter = await Letter.findById(req.params.id);

    if (!letter) return res.status(404).json({ message: 'Letter not found' });

    if (content) letter.content = content;
    if (font) letter.font = font;
    if (fontSize) letter.fontSize = fontSize;
    if (type) letter.type = type;
    if (Array.isArray(schrodingerVariants) && schrodingerVariants.length > 0) {
      letter.schrodingerVariants = schrodingerVariants;
      letter.schrodingerState = 'superposition';
    }
    if (typeof burnAfterReading === 'boolean') letter.burnAfterReading = burnAfterReading;
    if (Number(burnTimerSeconds) > 0) letter.burnTimerSeconds = Number(burnTimerSeconds);
    if (req.body.scheduledFor !== undefined) letter.scheduledFor = req.body.scheduledFor;

    if (receiverRef && receiverRef.trim() !== '') {
      const query = receiverRef.trim();
      const user = await User.findOne({
        $or: [{ name: query }, { email: query }]
      });

      if (user) {
        letter.receiverRef = user._id;
      } else if (mongoose.Types.ObjectId.isValid(query)) {
        letter.receiverRef = query;
      } else {
        return res.status(400).json({ message: `Could not find any user named "${query}" in the Guild.` });
      }
    } else if (receiverRef === '') {
      letter.receiverRef = undefined; // Unset if explicitly empty
    }

    // If upgrading from draft to pending, generate the QR code
    const wasDraft = letter.status === 'draft';
    if (wasDraft && status === 'pending') {
      letter.status = 'pending';
      letter.qrCodeToken = uuidv4();
      letter.sealedAt = Date.now();
    }

    await letter.save();

    // Feature 8: Sender Reputation Score — award once, on the moment a draft becomes dispatched
    if (wasDraft && letter.status === 'pending' && letter.senderRef) {
      await User.findByIdAndUpdate(letter.senderRef, {
        $inc: { reputationScore: REPUTATION_PER_LETTER, lettersSent: 1 }
      });
      const io = req.app.get('io');
      const activeMapUsers = req.app.get('activeMapUsers');
      const userSocketMap = req.app.get('userSocketMap');
      if (io) io.emit('letters-updated');
      if (io && activeMapUsers) {
        checkProximityForNewLetter(letter, io, activeMapUsers, userSocketMap);
      }
    }

    res.json(letter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating letter' });
  }
});

// Feature 6 & Epistolary Registry: Mark a letter as read
router.put('/:id/read', async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'Letter not found' });
    if (letter.scheduledFor && new Date(letter.scheduledFor).getTime() > Date.now()) {
      return res.status(403).json({ message: 'Missive is sealed in a Time Capsule until the appointed hour.' });
    }
    letter.isRead = true;
    if (!letter.firstReadAt) {
      letter.firstReadAt = Date.now();
    }
    await letter.save();
    const io = req.app.get('io');
    if (io) io.emit('letters-updated');
    res.json(letter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error marking letter as read' });
  }
});

// Mark a letter as unread
router.put('/:id/unread', async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'Letter not found' });
    letter.isRead = false;
    letter.firstReadAt = undefined;
    await letter.save();
    const io = req.app.get('io');
    if (io) io.emit('letters-updated');
    res.json(letter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error marking letter as unread' });
  }
});

// Toggle read / unread status
router.put('/:id/toggle-read', async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'Letter not found' });
    const { isRead } = req.body;
    if (typeof isRead === 'boolean') {
      letter.isRead = isRead;
      if (isRead && !letter.firstReadAt) letter.firstReadAt = Date.now();
      if (!isRead) letter.firstReadAt = undefined;
    } else {
      const willBeRead = !letter.isRead;
      letter.isRead = willBeRead;
      if (willBeRead && !letter.firstReadAt) letter.firstReadAt = Date.now();
      if (!willBeRead) letter.firstReadAt = undefined;
    }
    await letter.save();
    const io = req.app.get('io');
    if (io) io.emit('letters-updated');
    res.json(letter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error toggling read status' });
  }
});

// Batch mark read / unread
router.post('/batch-read', async (req, res) => {
  try {
    const { ids, isRead } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No letter ids provided' });
    }
    if (isRead) {
      await Letter.updateMany({ _id: { $in: ids } }, { $set: { isRead: true, firstReadAt: Date.now() } });
    } else {
      await Letter.updateMany({ _id: { $in: ids } }, { $set: { isRead: false }, $unset: { firstReadAt: "" } });
    }
    const io = req.app.get('io');
    if (io) io.emit('letters-updated');
    res.json({ message: `Updated ${ids.length} missives.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating read status' });
  }
});

// Batch move to wastebin
router.post('/batch-trash', async (req, res) => {
  try {
    const { ids, userId } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No letter ids provided' });
    }
    const uStr = userId ? userId.toString() : '';
    for (const id of ids) {
      const letter = await Letter.findById(id);
      if (!letter) continue;
      const sStr = letter.senderRef ? (letter.senderRef._id ? letter.senderRef._id.toString() : letter.senderRef.toString()) : '';
      const rStr = letter.receiverRef ? (letter.receiverRef._id ? letter.receiverRef._id.toString() : letter.receiverRef.toString()) : '';
      let modified = false;
      if (uStr) {
        if (sStr && sStr === uStr) { letter.trashedBySender = true; modified = true; }
        if (rStr && rStr === uStr) { letter.trashedByReceiver = true; modified = true; }
      }
      if (!modified) {
        letter.trashedBySender = true;
        letter.trashedByReceiver = true;
      }
      letter.trashedAt = new Date();
      await letter.save();
    }
    const io = req.app.get('io');
    if (io) io.emit('letters-updated');
    res.json({ message: `Moved ${ids.length} missives to wastebin.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error trashing letters' });
  }
});

// Batch restore from wastebin
router.post('/batch-restore', async (req, res) => {
  try {
    const { ids, userId } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No letter ids provided' });
    }
    const uStr = userId ? userId.toString() : '';
    for (const id of ids) {
      const letter = await Letter.findById(id);
      if (!letter) continue;
      const sStr = letter.senderRef ? (letter.senderRef._id ? letter.senderRef._id.toString() : letter.senderRef.toString()) : '';
      const rStr = letter.receiverRef ? (letter.receiverRef._id ? letter.receiverRef._id.toString() : letter.receiverRef.toString()) : '';
      if (uStr && sStr === uStr) letter.trashedBySender = false;
      if (uStr && rStr === uStr) letter.trashedByReceiver = false;
      if (!uStr) {
        letter.trashedBySender = false;
        letter.trashedByReceiver = false;
      }
      await letter.save();
    }
    const io = req.app.get('io');
    if (io) io.emit('letters-updated');
    res.json({ message: `Restored ${ids.length} missives from wastebin.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error restoring letters' });
  }
});

// Batch permanently burn
router.post('/batch-burn', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No letter ids provided' });
    }
    await Letter.deleteMany({ _id: { $in: ids } });
    const io = req.app.get('io');
    if (io) io.emit('letters-updated');
    res.json({ message: `Permanently burned ${ids.length} missives.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error burning letters' });
  }
});

// Feature 22: Burn After Reading — finalize the burn once the ink-fade animation completes client-side
router.put('/:id/burn', async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'Letter not found' });
    if (!letter.burnAfterReading) {
      return res.status(400).json({ message: 'This letter was not marked for burning.' });
    }
    letter.status = 'burned';
    letter.content = '🔥 The ink hath faded to nothingness. This letter is lost forever.';
    await letter.save();
    res.json(letter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error burning letter' });
  }
});

// ============================================
// --- THE DEAD LETTER OFFICE (Public Archive) ---
// ============================================

// Get all abandoned / dead letters for the public realm archive (Latest to Oldest)
router.get('/dead-letter-office', async (req, res) => {
  try {
    const deadLetters = await Letter.find({
      isAbandoned: true
    })
    .populate('senderRef', 'name email role')
    .populate('receiverRef', 'name email role')
    .populate('abandonedBy', 'name email role')
    .sort({ abandonedAt: -1, createdAt: -1 });

    res.json(deadLetters);
  } catch (error) {
    console.error("Error fetching Dead Letter Office archive:", error);
    res.status(500).json({ message: 'Error fetching Dead Letter Office archive' });
  }
});

// Abandon a single letter to the Dead Letter Office
router.put('/:id/abandon', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const letter = await Letter.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'Missive not found' });

    letter.isAbandoned = true;
    letter.abandonedAt = new Date();
    if (userId) letter.abandonedBy = userId;
    if (reason) letter.abandonReason = reason;

    await letter.save();

    const io = req.app.get('io');
    if (io) io.emit('letters-updated');

    res.json({ message: 'Missive released into The Dead Letter Office archive.', letter });
  } catch (error) {
    console.error("Error abandoning letter:", error);
    res.status(500).json({ message: 'Error abandoning missive' });
  }
});

// Batch abandon selected letters to the Dead Letter Office
router.post('/batch-abandon', async (req, res) => {
  try {
    const { ids, userId, reason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No letter ids provided' });
    }

    await Letter.updateMany(
      { _id: { $in: ids } },
      { 
        $set: { 
          isAbandoned: true, 
          abandonedAt: new Date(),
          abandonedBy: userId || null,
          abandonReason: reason || 'Forsaken in mailbox and relegated to The Dead Letter Office'
        } 
      }
    );

    const io = req.app.get('io');
    if (io) io.emit('letters-updated');

    res.json({ message: `Successfully released ${ids.length} missives to The Dead Letter Office.` });
  } catch (error) {
    console.error("Error batch abandoning letters:", error);
    res.status(500).json({ message: 'Error releasing letters to Dead Letter Office' });
  }
});

// ============================================
// --- GUILD WASTEBIN & TRASH SYSTEM ---
// ============================================

// Get all trashed letters for a user
router.get('/trash/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const trashedLetters = await Letter.find({
      $or: [
        { senderRef: userId, trashedBySender: true },
        { receiverRef: userId, trashedByReceiver: true }
      ]
    })
    .populate('senderRef', 'name email role')
    .populate('receiverRef', 'name email role')
    .populate('mailmanRef', 'name')
    .sort({ trashedAt: -1, updatedAt: -1 });

    const formatted = trashedLetters.map(l => {
      const isSender = l.senderRef && l.senderRef._id.toString() === userId.toString();
      const origin = isSender ? (l.status === 'draft' ? 'draft' : 'outbox') : 'inbox';
      return {
        ...l.toObject(),
        removedFrom: origin
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching trashed letters' });
  }
});

// Remove / Soft-delete a letter to the wastebin
router.put('/:id/trash', async (req, res) => {
  try {
    const { userId } = req.body;
    const letter = await Letter.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'Letter not found' });

    const uStr = userId ? userId.toString() : '';
    const sStr = letter.senderRef ? (letter.senderRef._id ? letter.senderRef._id.toString() : letter.senderRef.toString()) : '';
    const rStr = letter.receiverRef ? (letter.receiverRef._id ? letter.receiverRef._id.toString() : letter.receiverRef.toString()) : '';

    let modified = false;
    if (uStr) {
      if (sStr && sStr === uStr) {
        letter.trashedBySender = true;
        modified = true;
      }
      if (rStr && rStr === uStr) {
        letter.trashedByReceiver = true;
        modified = true;
      }
    }

    if (!modified) {
      letter.trashedBySender = true;
      letter.trashedByReceiver = true;
    }
    letter.trashedAt = new Date();
    await letter.save();

    const io = req.app.get('io');
    if (io) io.emit('letters-updated');

    res.json({ message: 'Letter removed to thy wastebin.', letter });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error removing letter to trash' });
  }
});

// Restore a letter from the wastebin back to Inbox / Outbox / Drafts
router.put('/:id/restore', async (req, res) => {
  try {
    const { userId } = req.body;
    const letter = await Letter.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'Letter not found' });

    if (userId) {
      if (letter.senderRef && letter.senderRef.toString() === userId.toString()) {
        letter.trashedBySender = false;
      }
      if (letter.receiverRef && letter.receiverRef.toString() === userId.toString()) {
        letter.trashedByReceiver = false;
      }
    } else {
      letter.trashedBySender = false;
      letter.trashedByReceiver = false;
    }
    await letter.save();

    res.json({ message: 'Letter restored to thy desk.', letter });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error restoring letter' });
  }
});

// Empty / Burn entire wastebin permanently for a user
router.delete('/trash/empty/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    // Delete drafts and single-party letters trashed by user
    await Letter.deleteMany({
      senderRef: userId,
      status: 'draft',
      trashedBySender: true
    });

    await Letter.deleteMany({
      trashedBySender: true,
      trashedByReceiver: true
    });

    await Letter.deleteMany({
      $or: [
        { senderRef: userId, trashedBySender: true },
        { receiverRef: userId, trashedByReceiver: true }
      ]
    });

    res.json({ message: 'Thy wastebin hath been consumed by fire. All ashes scattered.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error emptying wastebin' });
  }
});

// Permanently burn a single letter from wastebin
router.delete('/:id', async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id);
    if (!letter) return res.status(404).json({ message: 'Letter not found' });
    
    await letter.deleteOne();
    res.json({ message: 'Missive permanently burned to ashes.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error permanently burning letter' });
  }
});

// ============================================
// THE POSTMASTER'S RIDDLE & LETTER RECALL SYSTEM
// ============================================
const POSTMASTER_RIDDLES = [
  {
    id: 'riddle-1',
    category: 'Easy Courier Riddle',
    prompt: 'What gets wetter the more it dries?',
    options: ['A Towel', 'A Candle', 'A River Stone', 'A Cloud'],
    answerIndex: 0,
    lore: 'A towel dries things by absorbing their water.'
  },
  {
    id: 'riddle-2',
    category: 'Sovereign Scriptorium',
    prompt: 'What has to be broken before you can use it?',
    options: ['An Egg', 'A Sword', 'A Glass Bottle', 'A Bridge'],
    answerIndex: 0,
    lore: 'An egg must be cracked open before cooking or baking.'
  },
  {
    id: 'riddle-3',
    category: 'Imperial Courier Lore',
    prompt: 'What can travel all around the world while staying in one corner?',
    options: ['A Postage Stamp', 'A Compass', 'A Lantern', 'A Flag'],
    answerIndex: 0,
    lore: 'A postage stamp travels upon letters around the entire world.'
  },
  {
    id: 'riddle-4',
    category: 'Everyday Enigma',
    prompt: 'I have hands and a face, but no arms or legs. What am I?',
    options: ['A Clock', 'A Statue', 'A Mirror', 'A Coin'],
    answerIndex: 0,
    lore: 'A clock has hour and minute hands and a clock face.'
  },
  {
    id: 'riddle-5',
    category: 'Tavern Wonder',
    prompt: 'What has many teeth, but cannot bite?',
    options: ['A Comb', 'A Sawmill', 'A Dragon', 'A Fork'],
    answerIndex: 0,
    lore: 'A comb has teeth to smooth out hair.'
  },
  {
    id: 'riddle-6',
    category: 'Scholar\'s Study',
    prompt: 'What has a thumb and four fingers, but is not alive?',
    options: ['A Glove', 'A Quill', 'A Ring', 'A Boot'],
    answerIndex: 0,
    lore: 'A glove fits snugly over five fingers.'
  },
  {
    id: 'riddle-7',
    category: 'Library of the Realm',
    prompt: 'What has words and pages, but never speaks out loud?',
    options: ['A Book', 'A Bell', 'A River', 'A Flute'],
    answerIndex: 0,
    lore: 'A book holds timeless inscribed words upon its leaves.'
  },
  {
    id: 'riddle-8',
    category: 'Grand Scriptorium',
    prompt: 'What goes up every year, but never comes down?',
    options: ['Your Age', 'A Feather', 'Smoke', 'A Balloon'],
    answerIndex: 0,
    lore: 'Your age only increases with each passing season.'
  }
];

// 1. Get a random Postmaster Riddle challenge
router.get('/postmaster-riddle', (req, res) => {
  const randomIndex = Math.floor(Math.random() * POSTMASTER_RIDDLES.length);
  const selected = POSTMASTER_RIDDLES[randomIndex];

  res.json({
    riddleId: selected.id,
    category: selected.category,
    prompt: selected.prompt,
    options: selected.options,
    timeLimitSeconds: 90
  });
});

// 2. Attempt to recall letter by answering the Postmaster's Riddle
router.post('/:id/recall', async (req, res) => {
  try {
    const { userId, riddleId, selectedOptionIndex, isTimeout } = req.body;
    const letter = await Letter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Missive not found in sovereign registry' });
    }

    const riddle = POSTMASTER_RIDDLES.find(r => r.id === riddleId);
    const isCorrect = !isTimeout && riddle && Number(selectedOptionIndex) === Number(riddle.answerIndex);

    const io = req.app.get('io');
    const sender = await User.findById(letter.senderRef || userId);

    if (isCorrect) {
      // SUCCESSFUL RECALL -> letter moves to Drafts
      const previousMailmanRef = letter.mailmanRef;
      letter.status = 'draft';
      letter.isTorn = false;
      letter.recalledAt = new Date();
      letter.postmasterRiddleAttempt = 'recalled';
      letter.mailmanRef = null;
      await letter.save();

      // Notify Mailman and Active Clients
      if (io) {
        io.emit('letters-updated');
        if (previousMailmanRef) {
          io.emit('mailman-notification', {
            mailmanId: previousMailmanRef.toString(),
            message: `📜 The sender solved the Postmaster's Riddle and recalled epistle #${letter._id.toString().slice(-6)}. It has been removed from thy active deliveries.`,
            letterId: letter._id
          });
        }
      }

      return res.json({
        success: true,
        outcome: 'recalled',
        letter,
        message: '✦ Postmaster\'s Blessing! Thy riddle was solved and the epistle hath been safely intercepted and moved into thy Drafts.',
        lore: riddle ? riddle.lore : ''
      });
    } else {
      // FAILED RECALL -> letter is TORN and retained in sender's records, delivery is cancelled, sender reputation penalty
      const previousMailmanRef = letter.mailmanRef;
      letter.status = 'torn';
      letter.isTorn = true;
      letter.tornAt = new Date();
      letter.deliveredAt = null;
      letter.postmasterRiddleAttempt = 'torn';
      letter.mailmanRef = null;
      await letter.save();

      // Deduct 5 reputation points from sender (never drop below 0)
      let reputationLost = 5;
      if (sender) {
        sender.reputationScore = Math.max(0, (sender.reputationScore || 0) - reputationLost);
        await sender.save();
      }

      // Notify Mailman and Active Clients
      if (io) {
        io.emit('letters-updated');
        if (previousMailmanRef) {
          io.emit('mailman-notification', {
            mailmanId: previousMailmanRef.toString(),
            message: `⚠️ The sender failed the Postmaster's Riddle and tore epistle #${letter._id.toString().slice(-6)}. The delivery has been cancelled and removed from thy deliveries.`,
            letterId: letter._id
          });
        }
      }

      return res.json({
        success: false,
        outcome: 'torn',
        letter,
        reputationLost,
        newReputation: sender?.reputationScore ?? 0,
        correctAnswer: riddle ? riddle.options[riddle.answerIndex] : '',
        message: '⚠️ The Postmaster\'s seal fractured! Thy epistle was torn and destroyed in transit, and thy reputation reduced by 5 honour points.',
        lore: riddle ? riddle.lore : ''
      });
    }
  } catch (error) {
    console.error('Error during letter recall attempt:', error);
    res.status(500).json({ message: 'Error processing Postmaster Riddle recall attempt' });
  }
});

// Generic endpoint to scan a QR code
// It figures out what to do based on the user's role and the letter's current status
router.post('/scan', async (req, res) => {
  try {
    const { token, userId, role } = req.body;
    
    if (!token) return res.status(400).json({ message: 'Token is required' });
    
    const letter = await Letter.findOne({ qrCodeToken: token });
    if (!letter) {
      return res.status(404).json({ message: 'Invalid QR Code. No letter found.' });
    }
    
    // Ensure sealedAt exists if it was dispatched
    if (!letter.sealedAt) letter.sealedAt = letter.createdAt || Date.now();

    const emitHandover = async (stageType) => {
      try {
        const io = req.app.get('io');
        if (!io) return;
        const populated = await Letter.findById(letter._id)
          .populate('senderRef', 'name email role')
          .populate('receiverRef', 'name email role')
          .populate('mailmanRef', 'name email role');

        const senderName = populated?.senderRef?.name || 'Noble Scribe';
        const receiverName = populated?.receiverRef?.name || 'Intended Recipient';
        const mailmanName = populated?.mailmanRef?.name || (role === 'mailman' ? 'Royal Courier' : 'Imperial Deliverer');

        const payload = {
          letterId: letter._id,
          token: letter.qrCodeToken,
          stage: stageType,
          senderId: populated?.senderRef?._id?.toString(),
          senderName,
          receiverId: populated?.receiverRef?._id?.toString(),
          receiverName,
          mailmanId: populated?.mailmanRef?._id?.toString() || (stageType === 'pickup' ? userId : null),
          mailmanName,
          transferredFrom: stageType === 'pickup' ? senderName : mailmanName,
          transferredTo: stageType === 'pickup' ? `${mailmanName}'s Saddlebag` : `${receiverName}'s Mailbox`,
          message: stageType === 'pickup'
            ? `Missive transferred from ${senderName} to Courier ${mailmanName}'s Saddlebag!`
            : `Missive delivered from Courier ${mailmanName} into ${receiverName}'s Sovereign Mailbox!`
        };

        io.emit('letter-handover-animated', payload);
        io.emit('letters-updated');
      } catch (err) {
        console.error('Error emitting handover animation:', err);
      }
    };

    // Scenario 1: Mailman scans a 'pending' letter
    if (role === 'mailman' && letter.status === 'pending') {
      // If mailman is also the receiver (delivered to self)
      if (letter.receiverRef && letter.receiverRef.toString() === userId) {
        letter.status = 'delivered';
        letter.pickedUpAt = letter.pickedUpAt || Date.now();
        letter.deliveredAt = Date.now();
        await letter.save();
        
        await User.findByIdAndUpdate(userId, {
          $inc: { deliveriesCompleted: 1, xp: 15 }
        });

        await emitHandover('delivery');
        return res.json({ message: 'You picked up a letter addressed to thee! It is now in thy Mailbox.', letter });
      }

      letter.mailmanRef = userId;
      letter.status = 'in-transit';
      letter.pickedUpAt = Date.now();
      await letter.save();

      await emitHandover('pickup');
      return res.json({ message: 'Letter successfully picked up! Check thy Deliveries.', letter });
    }

    // Scenario 2: Receiver directly scans a 'pending' letter (Direct hand-to-hand / Mailman-to-Mailman direct)
    if (letter.status === 'pending') {
      if (letter.receiverRef && letter.receiverRef.toString() === userId) {
        letter.status = 'delivered';
        letter.pickedUpAt = letter.pickedUpAt || Date.now();
        letter.deliveredAt = Date.now();
        await letter.save();

        await emitHandover('delivery');
        return res.json({ message: 'Letter successfully received! It is now in thy Mailbox.', letter });
      }
    }
    
    // Scenario 3: Receiver scans an 'in-transit' letter -> Delivers it
    if (letter.status === 'in-transit') {
      if (letter.receiverRef && letter.receiverRef.toString() !== userId) {
        // Apply penalty to mailman for misdelivery
        let penaltyApplied = false;
        if (letter.mailmanRef) {
          const mailman = await User.findById(letter.mailmanRef);
          if (mailman) {
            mailman.xp = Math.max(0, (mailman.xp || 0) - 15);
            mailman.penaltiesCount = (mailman.penaltiesCount || 0) + 1;
            mailman.deliveryPenalties = mailman.deliveryPenalties || [];
            mailman.deliveryPenalties.push({
              reason: 'Misdelivered letter — scanned by wrong recipient',
              xpDeducted: 15,
              letterId: letter._id,
              timestamp: new Date(),
            });
            await mailman.save();
            penaltyApplied = true;

            // Notify via socket
            try {
              const io = req.app.get('io');
              if (io) {
                io.emit('penalty-applied', {
                  mailmanId: letter.mailmanRef.toString(),
                  reason: 'Misdelivered letter — scanned by wrong recipient',
                  xpDeducted: 15,
                  letterId: letter._id,
                });
              }
            } catch (_) {}
          }
        }
        return res.status(403).json({
          message: 'This letter is not addressed to thee!',
          penaltyApplied,
        });
      }
      
      letter.status = 'delivered';
      letter.pickedUpAt = letter.pickedUpAt || Date.now();
      letter.deliveredAt = Date.now();
      await letter.save();

      // Give the mailman their XP and delivery count
      if (letter.mailmanRef) {
        await User.findByIdAndUpdate(letter.mailmanRef, {
          $inc: { deliveriesCompleted: 1, xp: 15 }
        });
      }

      await emitHandover('delivery');
      return res.json({ message: 'Letter successfully received! It is now in thy Mailbox.', letter });
    }
    
    if (letter.status === 'delivered') {
      return res.json({ message: 'Letter was already delivered.', letter });
    }
    
    res.status(400).json({ message: 'Action not allowed in current state.', letter });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error scanning QR code' });
  }
});

// Feature 2: Letter Pickup Radius — find pending letters near a mailman's/sender's location
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 250 } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: 'Location required' });

    const letters = await Letter.find({ status: 'pending' })
      .populate('senderRef', 'name')
      .populate('receiverRef', 'name');

    const R = 6371000;
    const nearbyWithDist = [];
    letters.forEach(letter => {
      if (!letter.senderLocation?.lat || !letter.senderLocation?.lng) return;
      const dLat = (letter.senderLocation.lat - parseFloat(lat)) * Math.PI / 180;
      const dLng = (letter.senderLocation.lng - parseFloat(lng)) * Math.PI / 180;
      const a = Math.sin(dLat/2) ** 2 +
                Math.cos(parseFloat(lat) * Math.PI / 180) *
                Math.cos(letter.senderLocation.lat * Math.PI / 180) *
                Math.sin(dLng/2) ** 2;
      const distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
      if (distance <= parseFloat(radius)) {
        const obj = letter.toObject();
        obj.distanceMeters = distance;
        nearbyWithDist.push(obj);
      }
    });

    res.json(nearbyWithDist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching nearby letters' });
  }
});

// ============================================
// FEATURE 25: DYBBUK LETTER THEMATIC ENGINE
// ============================================
const SPECTRAL_PERSONAS = [
  {
    name: 'Madame Vesper of the Shrouded Moat',
    title: 'The Whispering Ghost of the Outer Mists',
    realmOrigin: 'The Sunken Crypts of Aethelgard',
    font: 'Great Vibes',
    openers: [
      'Through the gossamer veil of twilight, thy memories drifted into my crypt...',
      'I listened to the wind rustling through the hollow stones, bearing fragments of thy past words...',
      'Thou didst not write to me, yet the ink of thy soul hath stained my realm...'
    ],
    closers: [
      'I remain watching between the shadows of the realm.',
      'Remember: what is written in ink is forever etched into the ethereal ether.',
      'Until the stars align once more in silence.'
    ]
  },
  {
    name: 'Archivist Moros of the Ashen Citadel',
    title: 'Keeper of Forgotten Chronicles',
    realmOrigin: 'Library of Lost Names (Year 1482)',
    font: 'MedievalSharp',
    openers: [
      'In the dusty catacombs where unread letters sleep, I catalogued thy presence...',
      'A parchment sealed centuries ago bore reflections of thy thoughts...',
      'Thy name was whispered in the guild archives before thy birth...'
    ],
    closers: [
      'Catalogued under the Ledger of Ethereal Curiosities.',
      'The archives remember every missive, even those never dispatched.',
      'Preserve thy quill, traveller, for the realm listens.'
    ]
  },
  {
    name: 'The Phantom Courier of Cairn Vale',
    title: 'Eternal Rider of the Grey Highway',
    realmOrigin: 'The Spectral Crossroads',
    font: 'Metamorphous',
    openers: [
      'My spectral steed galloped through the echoes of thy past journeys...',
      'I carried a missive intended for another lifetime, yet its seal matches thy hand...',
      'Along the misty mountain ridge, the phantom postbags rattled with echoes of thy words...'
    ],
    closers: [
      'The road never ends for those who carry the word.',
      'Galloping eternally beneath the moonless sky.',
      'May thy deliveries never cross the border of the void.'
    ]
  },
  {
    name: 'Sister Isolde of the Silent Cloister',
    title: 'Weaver of Arcane Oaths',
    realmOrigin: 'Sanctuary of the Starless Night',
    font: 'Almendra',
    openers: [
      'I knelt at the altar of forgotten vows and heard the reverberation of thy deeds...',
      'The candlelight flickered thrice as thy recent thoughts brushed against our sanctuary...',
      'From the silent cloister, we watch the tapestry of mortal correspondence unroll...'
    ],
    closers: [
      'Go in solemn peace, and guard thy secrets well.',
      'The wax may crack, but the oath remains unbreakable.',
      'In eternal vigil and silence.'
    ]
  },
  {
    name: 'Captain Elian of the Sunken Galleon',
    title: 'Voice from the Abyssal Depths',
    realmOrigin: 'The Ghost Fleet of the Mariana Rift',
    font: 'Pirata One',
    openers: [
      'From twenty fathoms beneath the roaring waves, a bottle washed upon my spectral deck bearing echoes of thee...',
      'The deep sea currents carry strange whispers from thy landbound desk...',
      'The barnacles on our spectral hull vibrate with the resonance of thy letters...'
    ],
    closers: [
      'May thy anchor hold against the eternal tempest.',
      'Signing off from the graveyard of forgotten ships.',
      'Until the tide turns red with dawn.'
    ]
  },
  {
    name: 'The Pale Scribe of the 13th Century',
    title: 'An Echo from 1692',
    realmOrigin: 'The Ancient Guild Scrivenery',
    font: 'UnifrakturMaguntia',
    openers: [
      'Upon aged parchment that time forgot to burn, my phantom quill began to move on its own accord...',
      'A strange resonance in the ether compelled this correspondence across four hundred winters...',
      'Thy mortal ink mirrors the esoteric runes of our ancient order...'
    ],
    closers: [
      'Written with ink of crushed nightshade and starlight.',
      'May the seals of old keep thee safe from the midnight wanderers.',
      'From an era buried beneath the stones.'
    ]
  },
  {
    name: 'Lord Cassian of the Hollow Spire',
    title: 'Spectral Monarch of the Forgotten Court',
    realmOrigin: 'The Throne of Obsidian Brambles',
    font: 'Cinzel Decorative',
    openers: [
      'From the empty throne room where cold winds reign, I observed the flickering flame of thy mortal ambition...',
      'A crown of rusted iron weighs heavily upon my shade, yet thy words pierced our ruined ramparts...',
      'We in the forgotten court hold court over every secret whispered into sealed wax...'
    ],
    closers: [
      'Bow not to phantom kings, but beware whose favor thou seekest.',
      'Our obsidian towers watch over the mortal plain.',
      'Until the moon is eclipsed by forgotten shadows.'
    ]
  },
  {
    name: 'Alchemist Valerius the Transmuted',
    title: 'Ghost of the Crucible & Brimstone',
    realmOrigin: 'The Vaporous Laboratory Beneath the Moor',
    font: 'Metamorphous',
    openers: [
      'The mercury in my alembic boiled without flame the moment thy quill touched paper...',
      'I transmuted gold into ash, yet the chemical signature of thy thoughts remains incorruptible...',
      'From the fumes of astral sulfur, the crystallization of thy intents appeared in my retorts...'
    ],
    closers: [
      'Beware: all inks decompose, but intent is an eternal compound.',
      'Mixed with tincture of antimony and midnight belladonna.',
      'Solve et Coagula — dissolve the shadow, coagulate the truth.'
    ]
  },
  {
    name: 'The Witch of the Whispering Bogs',
    title: 'Weaver of Bog Iron & Bone Needle',
    realmOrigin: 'The Mire of Drowned Lanterns',
    font: 'Caveat',
    openers: [
      'The ravens croaked thrice over the stagnant waters, dropping a feather woven from thy past thoughts...',
      'I stirred the black peat and saw the reflection of thy hand pressing seal upon parchment...',
      'The willow trees do not weep for the dead, traveller; they weep for what thou hast written...'
    ],
    closers: [
      'Bury this missive beneath moss if thou fearest the marsh eyes.',
      'Spun from spider silk and swamp-lantern glow.',
      'The bog never forgets a debt, nor a letter.'
    ]
  },
  {
    name: 'The Clockwork Watchman of Chronos Gate',
    title: 'Automaton Soul of the Astral Clock',
    realmOrigin: 'The Clocktower of Infinite Gear-Teeth',
    font: 'Special Elite',
    openers: [
      'TICK... TOCK... At precisely the 10,000th cycle of the lunar escapement, thy frequency resonated in my brass pendulum...',
      'A discrepancy in the temporal river was logged: a mortal sending thoughts into the ether...',
      'The escapement wheel calibrated itself to the cadence of thy quill strokes...'
    ],
    closers: [
      'Timestamp: Synchronized with the End of Time.',
      'Every second measured, every word accounted for.',
      'The gears turn forever, unwinding the mortal coil.'
    ]
  },
  {
    name: 'Baroness Lunaria of the Silver Eclipse',
    title: 'Lady of the Starless Constellations',
    realmOrigin: 'The Moon-Mirrored Observatory',
    font: 'Alex Brush',
    openers: [
      'When the eclipse swallowed the pale moon, the starlight rearranged itself into the syntax of thy mind...',
      'I dipped my crystal lens into the night sky and caught the glimmer of thy unsaid wishes...',
      'From the balcony of stars, the mortals seem like tiny fireflies carrying sealed lamps...'
    ],
    closers: [
      'Gaze upon the moon tonight; I shall be looking down.',
      'Draped in velvet night and silver stardust.',
      'Forever orbiting beyond the earthly horizon.'
    ]
  },
  {
    name: 'The Wandering Minstrel of Blackwood',
    title: 'Lute Player in the Eternal Snows',
    realmOrigin: 'The Glade of the Frozen Lyre',
    font: 'Dancing Script',
    openers: [
      'A melody drifted on the icy gale — a chord struck by the rhythm of thy past epistles...',
      'I played a forgotten ballad by the camp fire, and the smoke spelled out fragments of thy lore...',
      'The frozen pine needles chime like bells whenever thy missives cross the mountain pass...'
    ],
    closers: [
      'May thy path be merry and thy hearth never go cold.',
      'Strumming in the silence between the falling snow.',
      'Keep a song in thy throat for the shadowy miles ahead.'
    ]
  },
  {
    name: 'Master Oakhaven the Forest Wraith',
    title: 'Guardian of the Ancient Hollow Trees',
    realmOrigin: 'The Primeval Heartwood',
    font: 'Eagle Lake',
    openers: [
      'The ancient roots deep in the dark earth drank the rainwater carrying the spirit of thy travels...',
      'A stag with silver antlers bowed before the hollow oak, bearing a message carved by thy past deeds...',
      'The bark of the millennium redwood groaned with the memory of words thou once spoke...'
    ],
    closers: [
      'Let the green boughs shade thee from malice.',
      'Rooted deep in the soil of forgotten centuries.',
      'May the woodland spirits guard thy travels.'
    ]
  },
  {
    name: 'The Cursed Postmaster of 1799',
    title: 'The One Who Never Returned from Route 9',
    realmOrigin: 'The Phantom Waystation in the Fog',
    font: 'Courier Prime',
    openers: [
      'I have stamped thirty thousand letters that were never delivered, yet thine arrived on my desk...',
      'The lanterns at Waystation 9 flickered red when thy name appeared on my phantom manifest...',
      'I lost my route in the Great Blizzard of 1799, but I never lost a single missive entrusted to me...'
    ],
    closers: [
      'Postmarked: Nowhere / Undated / Eternal Transit.',
      'The mail must always go through, even beyond the grave.',
      'Signed and stamped by the Ghost of Route 9.'
    ]
  },
  {
    name: 'Lady Genevieve of the Rose Crypt',
    title: 'Ghost of the Unspoken Letters',
    realmOrigin: 'The Withered Garden of Perennial Tears',
    font: 'Marck Script',
    openers: [
      'A single dried rose petal crumbled upon my marble slab, carrying the perfume of thy written words...',
      'I kept every letter that was never sent in mortal life; now I collect the echoes of thine...',
      'In this garden where roses never bloom nor die, thy thoughts brought a fleeting warmth...'
    ],
    closers: [
      'Do not leave words unspoken while breath still warms thy lips.',
      'Pressed between the pages of an immortal diary.',
      'With bittersweet regards from the Rose Crypt.'
    ]
  },
  {
    name: 'The Void Cartographer of the 4th Dimension',
    title: 'Mapper of Astral Rifts',
    realmOrigin: 'The Geometric Abyss beyond the Stars',
    font: 'Fondamento',
    openers: [
      'On my parchment of non-Euclidean angles, thy correspondence created a new nexus of coordinates...',
      'The stars are not fixed points, traveller; they are postal beacons between realities...',
      'I mapped the contours of the void, and found the faint ley-lines drawn by thy journeys...'
    ],
    closers: [
      'Plotted on the infinite meridian of the abyss.',
      'May thy compass always find true north in every dimension.',
      'Drawn in ink of ultraviolet geometry.'
    ]
  }
];

function generateDybbukContent(user, pastLetters, tone = 'classical') {
  const allText = pastLetters.map(l => l.content || '').join(' ');
  const words = allText.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(w => w.length > 4);
  
  const themeKeywords = {
    journey: ['travel', 'journey', 'road', 'path', 'quest', 'map', 'distance', 'mountain', 'forest'],
    mystery: ['secret', 'mystery', 'shadow', 'night', 'hidden', 'dark', 'whisper', 'crypt'],
    fellowship: ['friend', 'fellow', 'brother', 'sister', 'guild', 'postmaster', 'together', 'bond'],
    lore: ['magic', 'ancient', 'realm', 'dragon', 'king', 'sword', 'castle', 'rune', 'spell', 'gold'],
    emotion: ['heart', 'love', 'hope', 'sorrow', 'memory', 'dream', 'longing', 'truth', 'faith']
  };

  const detectedCategories = [];
  for (const [cat, kws] of Object.entries(themeKeywords)) {
    if (kws.some(kw => allText.toLowerCase().includes(kw))) {
      detectedCategories.push(cat);
    }
  }

  const uniqueWords = [...new Set(words)].filter(w => !['there', 'their', 'about', 'would', 'could', 'which', 'these', 'where', 'letter', 'missive'].includes(w));
  const userEchoWord1 = uniqueWords.length > 0 ? uniqueWords[Math.floor(Math.random() * uniqueWords.length)] : 'destiny';
  const userEchoWord2 = uniqueWords.length > 1 ? uniqueWords[Math.floor(Math.random() * uniqueWords.length)] : 'whispers';

  const persona = SPECTRAL_PERSONAS[Math.floor(Math.random() * SPECTRAL_PERSONAS.length)];
  
  if (tone === 'modern') {
    const modernOpeners = [
      `I don't belong to your timeline, yet the resonance of your words reached me through the static...`,
      `You never sent this to me, but words written with raw intention leave a permanent frequency in the dark...`,
      `Between the signal noise and the silence of the night, your thoughts surfaced on my end...`,
      `There is a trace of your recent messages lingering across the threshold...`
    ];
    const modernClosers = [
      `Keep your eyes open. What is written is never truly forgotten.`,
      `Watching quietly from across the divide.`,
      `Until the next transmission finds you in the dark.`,
      `Signing off from the edge of the signal.`
    ];
    const opener = modernOpeners[Math.floor(Math.random() * modernOpeners.length)];
    const closer = modernClosers[Math.floor(Math.random() * modernClosers.length)];

    const bodyParagraph = `I caught fragments of your past correspondence—especially the recurring thoughts revolving around "${userEchoWord1}" and "${userEchoWord2}". You don't need a physical address for intent to arrive where it needs to. Take note of who you write to, and what you leave behind.`;

    const content = `${opener}\n\n${bodyParagraph}\n\n${closer}\n\n— Transmitted by ${persona.name} (${persona.title})`;
    return {
      content,
      font: 'Special Elite',
      persona
    };
  }

  // Classical Shakespearean / Aristocratic Tone
  const opener = persona.openers[Math.floor(Math.random() * persona.openers.length)];
  const closer = persona.closers[Math.floor(Math.random() * persona.closers.length)];

  let middleParagraph = `I have traversed the veil to deliver this reflection. In the echoes of thy correspondence, the spectral realm heard the vibrations of "${userEchoWord1}" and "${userEchoWord2}". The astral winds carry thy deeds across the ether. Do not question how this missive found its way into thy sovereign mailbox without courier footsteps.`;

  const content = `${opener}\n\n${middleParagraph}\n\n${closer}\n\n— Signed in Spectral Ink by ${persona.name},\n${persona.title}`;

  return {
    content,
    font: persona.font,
    persona
  };
}

// Generate a Dybbuk Letter on demand for a user
router.post('/dybbuk/generate', async (req, res) => {
  try {
    const { userId, tone } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch user's past letters for thematic analysis
    const pastLetters = await Letter.find({
      $or: [{ senderRef: userId }, { receiverRef: userId }]
    }).limit(30);

    const generated = generateDybbukContent(user, pastLetters, tone || 'classical');

    const newLetter = new Letter({
      receiverRef: userId,
      content: generated.content,
      type: 'dybbuk',
      status: 'delivered',
      deliveredAt: Date.now(),
      sealedAt: Date.now(),
      pickedUpAt: Date.now(),
      font: generated.font,
      fontSize: 'medium',
      spectralSender: {
        name: generated.persona.name,
        title: generated.persona.title,
        realmOrigin: generated.persona.realmOrigin
      }
    });

    await newLetter.save();

    user.lastDybbukAt = new Date();
    await user.save();

    const io = req.app.get('io');
    if (io) io.emit('letters-updated');

    res.status(201).json({
      message: '👻 The Astral Veil parted! A Dybbuk Missive has manifested in thy Mailbox.',
      letter: newLetter
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error summoning Dybbuk Letter' });
  }
});

// Periodic auto-check when Dybbuk Mode is enabled
router.post('/dybbuk/auto-check', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user || !user.dybbukMode) {
      return res.json({ manifested: false });
    }

    // Auto-manifest if at least 15 minutes elapsed since last Dybbuk letter
    const COOLDOWN_MS = 15 * 60 * 1000;
    const now = Date.now();
    if (user.lastDybbukAt && now - new Date(user.lastDybbukAt).getTime() < COOLDOWN_MS) {
      return res.json({ manifested: false });
    }

    const pastLetters = await Letter.find({
      $or: [{ senderRef: userId }, { receiverRef: userId }]
    }).limit(30);

    const generated = generateDybbukContent(user, pastLetters, 'classical');

    const newLetter = new Letter({
      receiverRef: userId,
      content: generated.content,
      type: 'dybbuk',
      status: 'delivered',
      deliveredAt: Date.now(),
      sealedAt: Date.now(),
      pickedUpAt: Date.now(),
      font: generated.font,
      fontSize: 'medium',
      spectralSender: {
        name: generated.persona.name,
        title: generated.persona.title,
        realmOrigin: generated.persona.realmOrigin
      }
    });

    await newLetter.save();

    user.lastDybbukAt = new Date();
    await user.save();

    const io = req.app.get('io');
    if (io) io.emit('letters-updated');

    res.json({
      manifested: true,
      message: '👻 Dybbuk Mode has summoned a spectral letter into thy Mailbox!',
      letter: newLetter
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking Dybbuk auto delivery' });
  }
});

// ============================================
// FEATURE 26: SCHRÖDINGER'S QUANTUM PARADOX ENGINE
// ============================================
const SCHRODINGER_MOOD_PROFILES = {
  classical: {
    angry: {
      mood: 'angry',
      label: 'Fiery & Indignant',
      icon: '⚡',
      transform: (base) => `[TIMELINE α - THE FIERY RECKONING]\n\nBy heaven and the searing stars, my patience hath evaporated like dew before the midday sun!\n\n${base}\n\nI shall brook no excuses nor half-hearted parleys. Let history record that I wrote with thunder in my blood and lightning upon my quill!`
    },
    happy: {
      mood: 'happy',
      label: 'Exultant & Merry',
      icon: '☀️',
      transform: (base) => `[TIMELINE β - THE JUBILANT CELEBRATION]\n\nRejoice, cherished soul, for my spirit dances like a lark at the golden gates of dawn!\n\n${base}\n\nMay fortune shower thee with boundless prosperity, and may our goblets overflow with nectar and laughter!`
    },
    grief: {
      mood: 'grief',
      label: 'Elegiac & Sorrowful',
      icon: '🌧️',
      transform: (base) => `[TIMELINE γ - THE ELEGIAC SHADOWS]\n\nAlas, with heavy sighs and tears that stain this worn vellum beneath weeping skies, I inscribe these words...\n\n${base}\n\nSome sorrows cannot be undone by mortal hands, yet in this quiet solitude, my heart leaves its eternal tribute.`
    },
    disappointed: {
      mood: 'disappointed',
      label: 'Cold & Disillusioned',
      icon: '❄️',
      transform: (base) => `[TIMELINE δ - THE FROSTED SILENCE]\n\nI sought honor and fidelity, yet find only the quiet ash of broken expectations...\n\n${base}\n\nI speak neither in fury nor malice, but with the heavy, chilling certainty of what was promised and what now remains.`
    },
    mystical: {
      mood: 'mystical',
      label: 'Quantum Paradox & Esoteric',
      icon: '🌌',
      transform: (base) => `[TIMELINE ε - THE QUANTUM OBSERVATION]\n\nBetween the ticking of the clock and the eternal silence of the multiverse, all outcomes existed in sacred equilibrium...\n\n${base}\n\nBefore thy hand broke this quantum wax seal, this epistle lived across five dimensions simultaneously. Now, observation hath collapsed the wave.`
    },
    romantic: {
      mood: 'romantic',
      label: 'Devoted & Poetic',
      icon: '🌹',
      transform: (base) => `[TIMELINE ζ - THE AMOROUS CONFESSION]\n\nTo the sovereign keeper of my thoughts, whose gentle grace illuminates the darkest chambers of my mind...\n\n${base}\n\nThough oceans and mountains divide our footsteps, my quill shall ever beat in secret harmony with thine.`
    }
  },
  modern: {
    angry: {
      mood: 'angry',
      label: 'Direct & Furious',
      icon: '⚡',
      transform: (base) => `[TIMELINE α - DIRECT CONFRONTATION]\n\nI have reached the absolute limit of my patience, and I'm not going to sugarcoat this anymore.\n\n${base}\n\nNo more excuses. Take accountability and face the reality of what happened immediately.`
    },
    happy: {
      mood: 'happy',
      label: 'Warm & Celebrating',
      icon: '☀️',
      transform: (base) => `[TIMELINE β - GENUINE CELEBRATION]\n\nI could not be happier right now, and I had to share this moment with you!\n\n${base}\n\nCheers to this milestone, and to everything great ahead of us. Keep shining!`
    },
    grief: {
      mood: 'grief',
      label: 'Vulnerable & Heartbroken',
      icon: '🌧️',
      transform: (base) => `[TIMELINE γ - QUIET VULNERABILITY]\n\nIt's hard to put this into words right now. The weight of everything has been hitting heavily.\n\n${base}\n\nI just needed to be honest about where I am. Thank you for holding space for me.`
    },
    disappointed: {
      mood: 'disappointed',
      label: 'Cold & Disillusioned',
      icon: '❄️',
      transform: (base) => `[TIMELINE δ - REALITY CHECK]\n\nI genuinely trusted your word, but the actions simply haven't matched what was promised.\n\n${base}\n\nI'm not writing this out of anger—just clarity. It's time for us both to be realistic.`
    },
    mystical: {
      mood: 'mystical',
      label: 'Sci-Fi Quantum Paradox',
      icon: '🌌',
      transform: (base) => `[TIMELINE ε - MULTIVERSE COLLAPSE]\n\nIn alternate universes, we made completely different choices. But in this exact branch of reality:\n\n${base}\n\nYou just collapsed the probability wave by reading this message. This timeline is now locked.`
    },
    romantic: {
      mood: 'romantic',
      label: 'Intimate & Devoted',
      icon: '🌹',
      transform: (base) => `[TIMELINE ζ - SINCERE DEVOTION]\n\nNo matter how busy the world gets, you are always the first person on my mind.\n\n${base}\n\nThank you for being my anchor and my favorite part of every day. With all my heart.`
    }
  }
};

function generateSchrodingerVariants(baseContent, requestedMoods = ['angry', 'happy', 'grief'], tone = 'classical') {
  const cleanBase = (baseContent || 'We stand at the crossroads of fate, contemplating what path our words shall forge.').trim();
  const moods = Array.isArray(requestedMoods) && requestedMoods.length >= 2 
    ? requestedMoods.slice(0, 3) 
    : ['angry', 'happy', 'grief'];

  const toneProfiles = SCHRODINGER_MOOD_PROFILES[tone] || SCHRODINGER_MOOD_PROFILES['classical'];

  return moods.map(m => {
    const profile = toneProfiles[m] || toneProfiles['mystical'];
    return {
      mood: profile.mood,
      label: profile.label,
      content: profile.transform(cleanBase)
    };
  });
}

// Generate Schrödinger alternate reality versions for a given prompt
router.post('/schrodinger/generate-variants', async (req, res) => {
  try {
    const { content, moods, tone } = req.body;
    const variants = generateSchrodingerVariants(content, moods, tone || 'classical');
    res.json({ variants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating quantum variants' });
  }
});

// Summon / Generate a Schrödinger Paradox Letter for testing in the Vault
router.post('/schrodinger/summon', async (req, res) => {
  try {
    const { userId, content, moods, receiverRef, font, fontSize, tone } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const baseText = content || (tone === 'modern' 
      ? 'This letter was sealed in a quantum superposition box, awaiting your observation to collapse its reality.'
      : 'This letter was sealed within Schrödinger’s Quantum Paradox Chamber, awaiting an observer to collapse its reality wave.');
    
    const variants = generateSchrodingerVariants(baseText, moods, tone || 'classical');

    const superposedContent = `⚛️ [SCHRÖDINGER'S SUPERPOSITION BOX]\n\nThis missive currently exists in ${variants.length} simultaneous quantum states:\n` +
      variants.map((v, i) => ` • State ${i + 1} (${v.label}): ${v.content.slice(0, 80)}...`).join('\n') +
      `\n\nUpon unsealing, the probability wave will collapse permanently into a single timeline!`;

    const targetReceiver = receiverRef || userId;

    const newLetter = new Letter({
      senderRef: userId,
      receiverRef: targetReceiver,
      content: superposedContent,
      type: 'schrodinger',
      status: 'delivered',
      deliveredAt: Date.now(),
      sealedAt: Date.now(),
      pickedUpAt: Date.now(),
      font: font || (tone === 'modern' ? 'Courier Prime' : 'Cinzel'),
      fontSize: fontSize || 'medium',
      schrodingerVariants: variants,
      schrodingerState: 'superposition'
    });

    await newLetter.save();

    const io = req.app.get('io');
    if (io) io.emit('letters-updated');

    res.status(201).json({
      message: '⚛️ Schrödinger’s Quantum Box sealed and delivered in superposition!',
      letter: newLetter
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating Schrödinger Letter' });
  }
});

// Feature 26+: Quantum Mood Mutator & Multiverse Shift
router.post('/schrodinger/mutate-mood', async (req, res) => {
  try {
    const { letterId, content, targetMood, tone } = req.body;
    let baseText = content || '';

    if (letterId && !baseText) {
      const existing = await Letter.findById(letterId);
      if (existing) baseText = existing.content;
    }

    if (!baseText) {
      return res.status(400).json({ message: 'Letter content or Letter ID required for mutation.' });
    }

    const selectedMood = targetMood || 'mystical';
    const selectedTone = tone === 'modern' ? 'modern' : 'classical';
    const toneProfiles = SCHRODINGER_MOOD_PROFILES[selectedTone] || SCHRODINGER_MOOD_PROFILES['classical'];
    const profile = toneProfiles[selectedMood] || toneProfiles['mystical'];

    // Clean out previous headers if any
    const cleanBase = baseText.replace(/\[TIMELINE [^\]]+\]\n\n/g, '').replace(/⚛️ \[SCHRÖDINGER'S SUPERPOSITION BOX\][\s\S]*?\n\n/g, '').trim();

    const mutatedContent = profile.transform(cleanBase);

    res.json({
      mutatedContent,
      targetMood: profile.mood,
      label: profile.label,
      icon: profile.icon,
      tone: selectedTone,
      probabilityShift: Math.floor(75 + Math.random() * 24) + '%'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error mutating quantum mood' });
  }
});

// Collapse Schrödinger's Wavefunction when receiver unseals it
router.post('/:id/schrodinger/collapse', async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id)
      .populate('senderRef', 'name')
      .populate('receiverRef', 'name');

    if (!letter) return res.status(404).json({ message: 'Letter not found' });

    if (letter.type !== 'schrodinger') {
      return res.status(400).json({ message: 'This letter is not a Schrödinger paradox letter' });
    }

    if (letter.schrodingerState === 'collapsed' && letter.collapsedVariant) {
      return res.json({
        message: 'This quantum paradox was already collapsed into reality.',
        collapsedVariant: letter.collapsedVariant,
        letter
      });
    }

    const variants = (letter.schrodingerVariants && letter.schrodingerVariants.length > 0)
      ? letter.schrodingerVariants
      : generateSchrodingerVariants(letter.content);

    // Randomly select one variant based on quantum probability
    const chosenIndex = Math.floor(Math.random() * variants.length);
    const chosenVariant = variants[chosenIndex];

    letter.content = chosenVariant.content;
    letter.schrodingerState = 'collapsed';
    letter.collapsedVariant = chosenVariant;
    letter.collapsedAt = new Date();
    letter.firstReadAt = letter.firstReadAt || new Date();

    await letter.save();

    const io = req.app.get('io');
    if (io) io.emit('letters-updated');

    res.json({
      message: `⚛️ Wavefunction Collapsed! Reality locked into Timeline: ${chosenVariant.label}`,
      collapsedVariant: chosenVariant,
      allVariants: variants,
      chosenIndex,
      letter
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error collapsing quantum wavefunction' });
  }
});

// ============================================
// FEATURE: MESSAGE IN A BOTTLE (Ocean Drift & Probabilistic Shore Casting)
// ============================================

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return Math.floor(20 + Math.random() * 80);
  }
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function selectProbabilisticBottleRecipient(senderId, senderLocation, candidateUsers) {
  const eligible = candidateUsers.filter(u => u._id.toString() !== senderId.toString());
  if (eligible.length === 0) return null;

  const hasCoords = eligible.filter(u => u.location && u.location.coordinates && u.location.coordinates.length >= 2);

  // If no one is within GPS radar or sender has no GPS, fallback to any random registered user uniformly!
  if (!senderLocation || !senderLocation.lat || !senderLocation.lng || hasCoords.length === 0) {
    const randomIndex = Math.floor(Math.random() * eligible.length);
    const chosen = eligible[randomIndex];
    return {
      user: chosen,
      distance: Math.floor(25 + Math.random() * 150),
      isFallbackRandom: true
    };
  }

  // Compute inverse distance weights with mailman penalty (closer users have higher probability)
  const weightedList = eligible.map(user => {
    let distance = 50;
    if (user.location && user.location.coordinates && user.location.coordinates.length >= 2) {
      distance = calculateDistanceKm(
        senderLocation.lat,
        senderLocation.lng,
        user.location.coordinates[1],
        user.location.coordinates[0]
      );
    } else {
      distance = Math.floor(30 + Math.random() * 120);
    }

    let weight = 1 / Math.pow(Math.max(1, distance), 0.75);

    // Mailmen can receive bottles, but with lower probability weight (not 0)
    if (user.role === 'mailman') {
      weight *= 0.25;
    }

    return {
      user,
      distance,
      weight
    };
  });

  const totalWeight = weightedList.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    const fallbackChosen = eligible[Math.floor(Math.random() * eligible.length)];
    return { user: fallbackChosen, distance: 45, isFallbackRandom: true };
  }

  let randomVal = Math.random() * totalWeight;
  let selected = weightedList[0];
  for (const item of weightedList) {
    if (randomVal <= item.weight) {
      selected = item;
      break;
    }
    randomVal -= item.weight;
  }

  return selected;
}

// Toss a Message in a Bottle into the Ocean
router.post('/bottle/toss', async (req, res) => {
  try {
    const { 
      userId, 
      content, 
      isAnonymous = true, 
      bottleMoniker, 
      bottleStyle = 'emerald', 
      bottleWaxColor = 'gold',
      senderLocation,
      font = 'Great Vibes',
      fontSize = 'medium'
    } = req.body;

    if (!userId) return res.status(400).json({ message: 'User ID is required' });
    if (!content || !content.trim()) return res.status(400).json({ message: 'A bottle requires parchment text.' });

    const sender = await User.findById(userId);
    if (!sender) return res.status(404).json({ message: 'Sender not found' });

    // Fetch candidate recipients (all users in the realm)
    const allUsers = await User.find({ _id: { $ne: userId } });
    
    // Fallback if only 1 user exists
    let chosenRecipient = null;
    let driftDistance = Math.floor(35 + Math.random() * 120);

    if (allUsers.length > 0) {
      const selection = selectProbabilisticBottleRecipient(userId, senderLocation, allUsers);
      if (selection) {
        chosenRecipient = selection.user;
        driftDistance = Math.max(5, selection.distance);
      } else {
        chosenRecipient = allUsers[0];
      }
    }

    const defaultMoniker = isAnonymous 
      ? (bottleMoniker || 'A Wandering Mariner of the Sapphire Coast')
      : sender.name;

    const originLat = senderLocation?.lat || (sender.location?.coordinates ? sender.location.coordinates[1] : 40.7128);
    const originLng = senderLocation?.lng || (sender.location?.coordinates ? sender.location.coordinates[0] : -74.0060);

    const destLat = chosenRecipient?.location?.coordinates?.[1] || (originLat + (Math.random() - 0.5) * 2);
    const destLng = chosenRecipient?.location?.coordinates?.[0] || (originLng + (Math.random() - 0.5) * 2);

    const now = new Date();
    const tideLogs = [
      {
        timestamp: now,
        stage: 'tossed',
        text: `Sealed with ${bottleWaxColor} wax and cast into the coastal swell from ${sender.name}'s shore.`,
        lat: originLat,
        lng: originLng
      },
      {
        timestamp: new Date(now.getTime() + 1000 * 60 * 5),
        stage: 'drifting',
        text: `Carried by the North Equatorial Current across ${Math.round(driftDistance * 0.6)} km of open ocean.`,
        lat: (originLat + destLat) / 2,
        lng: (originLng + destLng) / 2
      },
      {
        timestamp: new Date(now.getTime() + 1000 * 60 * 15),
        stage: 'washed_ashore',
        text: `Washed upon the sandy dunes of ${chosenRecipient ? chosenRecipient.name + "'s shoreline" : "a secluded shore"} (${driftDistance} km total drift).`,
        lat: destLat,
        lng: destLng
      }
    ];

    const newBottle = new Letter({
      senderRef: userId,
      receiverRef: chosenRecipient ? chosenRecipient._id : userId,
      content,
      type: 'bottle',
      status: 'delivered', // Delivered via ocean tide without mailmen/QR scan
      deliveredAt: now,
      sealedAt: now,
      isAnonymous,
      bottleMoniker: defaultMoniker,
      bottleStyle,
      bottleWaxColor,
      font,
      fontSize,
      senderLocation: { lat: originLat, lng: originLng },
      bottleDrift: {
        originLocation: { lat: originLat, lng: originLng, name: sender.name + "'s Haven" },
        destinationLocation: { lat: destLat, lng: destLng, name: chosenRecipient ? chosenRecipient.name + "'s Shore" : "Distant Cove" },
        distanceKm: driftDistance,
        driftStatus: 'washed_ashore',
        tossedAt: now,
        washedAshoreAt: now,
        tideLogs
      }
    });

    await newBottle.save();

    const io = req.app.get('io');
    if (io) io.emit('letters-updated');

    res.status(201).json({
      message: `🌊 Thy bottle was sealed with ${bottleWaxColor} wax and cast into the ocean waves!`,
      bottle: newBottle,
      driftDistanceKm: driftDistance,
      recipientName: isAnonymous ? 'A Distant Wanderer' : (chosenRecipient?.name || 'Someone Nearby')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error casting message in a bottle' });
  }
});

// Fetch all bottles tossed by the current user (Active, non-trashed)
router.get('/bottle/my-bottles', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const bottles = await Letter.find({
      senderRef: userId,
      type: 'bottle',
      trashedBySender: { $ne: true }
    })
    .populate('receiverRef', 'name location')
    .sort({ createdAt: -1 });

    res.json(bottles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching tossed bottles' });
  }
});

// Fetch all bottles washed ashore for the current user (Active, non-trashed)
router.get('/bottle/beached', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'User ID required' });

    const bottles = await Letter.find({
      receiverRef: userId,
      type: 'bottle',
      trashedByReceiver: { $ne: true }
    })
    .populate('senderRef', 'name')
    .sort({ createdAt: -1 });

    res.json(bottles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching beached bottles' });
  }
});

// Uncork and read a beached bottle
router.post('/:id/bottle/uncork', async (req, res) => {
  try {
    const letter = await Letter.findById(req.params.id)
      .populate('senderRef', 'name');

    if (!letter) return res.status(404).json({ message: 'Bottle not found' });
    if (letter.type !== 'bottle') return res.status(400).json({ message: 'Not a bottle letter' });

    if (!letter.bottleDrift) {
      letter.bottleDrift = {};
    }

    letter.bottleDrift.driftStatus = 'uncorked';
    letter.bottleDrift.uncorkedAt = new Date();
    letter.firstReadAt = letter.firstReadAt || new Date();

    if (!letter.bottleDrift.tideLogs) letter.bottleDrift.tideLogs = [];
    letter.bottleDrift.tideLogs.push({
      timestamp: new Date(),
      stage: 'uncorked',
      text: 'The cork was broken and the salt-sprayed parchment unrolled.',
      lat: letter.bottleDrift.destinationLocation?.lat,
      lng: letter.bottleDrift.destinationLocation?.lng
    });

    await letter.save();

    const io = req.app.get('io');
    if (io) io.emit('letters-updated');

    res.json({
      message: '🍾 The wax seal was broken, cork pulled, and scroll unfurled!',
      letter
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uncorking bottle' });
  }
});

// =======================================================
// --- FEATURE: DELIVERY PROOF TO CENTRAL HUB & PENALTIES ---
// =======================================================

// 1. Submit Delivery Proof from Mailman / Courier to Central Hub
router.post('/:id/delivery-proof/submit', async (req, res) => {
  try {
    const { mailmanId, handoverCoordinates } = req.body;
    const letter = await Letter.findById(req.params.id)
      .populate('senderRef', 'name email')
      .populate('receiverRef', 'name email')
      .populate('mailmanRef', 'name email');

    if (!letter) return res.status(404).json({ message: 'Missive not found in sovereign registry' });

    const authCode = `HUB-AUTH-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;

    letter.deliveryProof = {
      status: 'pending_verification',
      authenticationCode: authCode,
      mailmanRef: mailmanId || letter.mailmanRef?._id,
      handoverCoordinates: handoverCoordinates || { lat: 51.5074, lng: -0.1278 }
    };

    await letter.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('letters-updated');
      // Dispatch alert to recipient to authenticate receipt
      const receiverId = letter.receiverRef?._id?.toString();
      io.emit('delivery-proof-requested', {
        letterId: letter._id,
        authenticationCode: authCode,
        receiverId,
        receiverName: letter.receiverRef?.name,
        senderName: letter.senderRef?.name,
        mailmanId: letter.mailmanRef?._id?.toString() || mailmanId,
        mailmanName: letter.mailmanRef?.name || 'Royal Courier',
        submittedAt: new Date()
      });
    }

    res.json({
      message: '📜 Delivery proof submitted to Central Hub. Awaiting recipient authentication.',
      deliveryProof: letter.deliveryProof,
      letter
    });
  } catch (error) {
    console.error('Error submitting delivery proof:', error);
    res.status(500).json({ message: 'Error submitting delivery proof to Central Hub' });
  }
});

// 2. Recipient Authenticates or Declines Delivery Proof
router.post('/:id/delivery-proof/verify', async (req, res) => {
  try {
    const { userId, action, reason } = req.body; // action: 'accept' | 'decline'
    const letter = await Letter.findById(req.params.id)
      .populate('senderRef', 'name email')
      .populate('receiverRef', 'name email')
      .populate('mailmanRef', 'name email xp penaltiesCount');

    if (!letter) return res.status(404).json({ message: 'Missive not found in registry' });

    const io = req.app.get('io');
    const mailmanId = letter.mailmanRef?._id || letter.deliveryProof?.mailmanRef;

    if (action === 'accept') {
      // SUCCESSFUL CENTRAL HUB AUTHENTICATION
      letter.status = 'delivered';
      letter.deliveredAt = new Date();
      if (!letter.pickedUpAt) letter.pickedUpAt = new Date();

      if (!letter.deliveryProof) letter.deliveryProof = {};
      letter.deliveryProof.status = 'verified';
      letter.deliveryProof.verifiedAt = new Date();
      letter.deliveryProof.verifiedBy = userId;
      if (!letter.deliveryProof.authenticationCode) {
        letter.deliveryProof.authenticationCode = `HUB-AUTH-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6).toUpperCase()}`;
      }

      await letter.save();

      // Award +20 XP to Mailman & increment deliveries completed
      let mailmanDoc = null;
      if (mailmanId) {
        mailmanDoc = await User.findByIdAndUpdate(
          mailmanId,
          { $inc: { deliveriesCompleted: 1, xp: 20 } },
          { new: true }
        );
      }

      if (io) {
        io.emit('letters-updated');
        io.emit('delivery-proof-resolved', {
          letterId: letter._id,
          status: 'verified',
          authenticationCode: letter.deliveryProof.authenticationCode,
          receiverName: letter.receiverRef?.name,
          mailmanName: mailmanDoc?.name || letter.mailmanRef?.name,
          message: '✨ Central Hub authenticated delivery! Recipient verified identity.'
        });

        if (mailmanId) {
          io.emit('mailman-notification', {
            mailmanId: mailmanId.toString(),
            message: `🎉 Delivery Proof Authenticated by Central Hub for Missive #${letter._id.toString().slice(-6)}! +20 XP granted.`,
            letterId: letter._id
          });
        }
      }

      return res.json({
        success: true,
        status: 'verified',
        message: '✨ Delivery authenticated and sealed by Central Hub!',
        letter
      });
    } else {
      // DECLINED / MISDELIVERED -> APPLY PENALTY TO MAILMAN
      if (!letter.deliveryProof) letter.deliveryProof = {};
      letter.deliveryProof.status = 'declined';
      letter.deliveryProof.declinedReason = reason || 'Recipient reported incorrect delivery or declined custody.';
      
      let xpDeducted = 15;
      let newMailmanXP = 0;

      if (mailmanId && !letter.deliveryProof.penaltyApplied) {
        letter.deliveryProof.penaltyApplied = true;
        const mailman = await User.findById(mailmanId);
        if (mailman) {
          newMailmanXP = Math.max(0, (mailman.xp || 0) - xpDeducted);
          mailman.xp = newMailmanXP;
          mailman.penaltiesCount = (mailman.penaltiesCount || 0) + 1;
          if (!mailman.deliveryPenalties) mailman.deliveryPenalties = [];
          mailman.deliveryPenalties.push({
            letterId: letter._id,
            reason: letter.deliveryProof.declinedReason,
            xpDeducted,
            penalizedAt: new Date()
          });
          await mailman.save();
        }
      }

      await letter.save();

      if (io) {
        io.emit('letters-updated');
        io.emit('delivery-proof-resolved', {
          letterId: letter._id,
          status: 'declined',
          reason: letter.deliveryProof.declinedReason,
          mailmanId: mailmanId?.toString(),
          message: '⚠️ Delivery Proof DECLINED by Central Hub. Mailman penalty applied.'
        });

        if (mailmanId) {
          io.emit('mailman-notification', {
            mailmanId: mailmanId.toString(),
            message: `⚠️ Infraction Alert: Recipient declined delivery proof for Missive #${letter._id.toString().slice(-6)}. Penalty of -15 XP applied by Central Hub.`,
            letterId: letter._id
          });
        }
      }

      return res.json({
        success: false,
        status: 'declined',
        message: '⚠️ Delivery proof declined. Central Hub recorded infraction and penalized courier.',
        penaltyApplied: true,
        xpDeducted,
        letter
      });
    }
  } catch (error) {
    console.error('Error verifying delivery proof:', error);
    res.status(500).json({ message: 'Error processing Central Hub delivery verification' });
  }
});

// 3. Central Hub Registry: Fetch all authenticated proofs, pending reviews, and courier penalty audits
router.get('/central-hub/proofs', async (req, res) => {
  try {
    const proofs = await Letter.find({
      'deliveryProof.status': { $in: ['pending_verification', 'verified', 'declined'] }
    })
    .populate('senderRef', 'name email role')
    .populate('receiverRef', 'name email role')
    .populate('mailmanRef', 'name email role xp penaltiesCount')
    .populate('deliveryProof.verifiedBy', 'name email')
    .sort({ updatedAt: -1, 'deliveryProof.verifiedAt': -1 })
    .limit(100);

    res.json(proofs);
  } catch (error) {
    console.error('Error fetching Central Hub proofs:', error);
    res.status(500).json({ message: 'Error retrieving Central Hub delivery proofs' });
  }
});

module.exports = router;

