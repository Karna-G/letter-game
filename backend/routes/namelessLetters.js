const express = require('express');
const router = express.Router();
const NamelessLetter = require('../models/NamelessLetter');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to extract user info from optional Bearer token
function getUserFromReq(req) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return decoded;
  } catch (e) {
    return null;
  }
}

function getUserIdFromReq(req) {
  const u = getUserFromReq(req);
  return u ? (u.id || u._id || null) : null;
}

const POETIC_AUTHOR_ALIASES = [
  'A Wandering Soul',
  'A Cloaked Scribe',
  'A Starlit Solitary',
  'A Nocturnal Thinker',
  'An Enigmatic Dreamer',
  'A Shadowed Poet',
  'A Moonlit Traveler',
  'A Forgotten Pilgrim',
  'A Solitary Quill'
];

const POETIC_THOUGHT_ALIASES = [
  'A Kindred Spirit',
  'A Quiet Passerby',
  'A Gentle Breeze',
  'A Distant Echo',
  'A Nighttime Reader',
  'A Stargazer',
  'A Secret Listener',
  'A Compassionate Wanderer',
  'An Unknown Friend',
  'A Fellow Traveler',
  'A Silent Pilgrim',
  'A Solitary Witness'
];

// Helper to calculate remaining days until 15-day expiration
function getExpiresInDays(letter) {
  const expiryTime = letter.expiresAt ? new Date(letter.expiresAt).getTime() : (new Date(letter.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000);
  const diffMs = expiryTime - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

// In-memory debounce set to prevent duplicate rapid requests (within 4 seconds)
const recentSubmissions = new Map();

// 1. POST /api/nameless-letters - Create a new anonymous letter (15-day lifespan)
router.post('/', async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const {
      topic,
      content,
      isHandwritten,
      handwrittenPages,
      font,
      fontSize,
      inkColor,
      parchmentPaper,
      sealColor,
      sealStamp,
      authorAlias,
      authorAvatarIcon,
      ambientTheme
    } = req.body;

    if (!isHandwritten && (!content || !content.trim())) {
      return res.status(400).json({ message: 'The nameless letter cannot be empty.' });
    }
    if (isHandwritten && (!handwrittenPages || handwrittenPages.length === 0)) {
      return res.status(400).json({ message: 'Handwritten parchment strokes are required.' });
    }

    // Guard against duplicate rapid submissions
    const dedupeKey = userId ? `${userId}:${(content || '').slice(0, 30)}` : `${(content || '').slice(0, 50)}`;
    const lastSub = recentSubmissions.get(dedupeKey);
    if (lastSub && Date.now() - lastSub < 4000) {
      return res.status(429).json({ message: 'Your nameless words have already been released to the sanctuary.' });
    }
    recentSubmissions.set(dedupeKey, Date.now());
    setTimeout(() => recentSubmissions.delete(dedupeKey), 8000);

    const randomAlias = POETIC_AUTHOR_ALIASES[Math.floor(Math.random() * POETIC_AUTHOR_ALIASES.length)];
    const chosenAlias = (authorAlias && authorAlias.trim()) ? authorAlias.trim() : randomAlias;
    const cleanTopic = (topic && topic.trim()) ? topic.trim() : 'Whisper of the Realm';

    const namelessLetter = new NamelessLetter({
      senderRef: userId || undefined,
      topic: cleanTopic,
      authorAlias: chosenAlias,
      authorAvatarIcon: authorAvatarIcon || '🕯️',
      content: content || (isHandwritten ? `[Physical Handwritten Manuscript - ${handwrittenPages?.length || 1} Pages]` : 'Nameless Words'),
      font: font || 'Cinzel',
      fontSize: fontSize || 'medium',
      isHandwritten: !!isHandwritten,
      handwrittenPages: isHandwritten ? (handwrittenPages || []) : [],
      inkColor: inkColor || 'iron-gall',
      parchmentPaper: parchmentPaper || 'vintage-cream',
      sealColor: sealColor || '#7A1E2E',
      sealStamp: sealStamp || 'wax-seal',
      ambientTheme: ambientTheme || 'midnight',
      thoughts: [],
      resonators: [],
      resonances: { fire: 0, rose: 0, withered: 0, neutral: 0 },
      viewsCount: 0,
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    });

    await namelessLetter.save();

    res.status(201).json({
      _id: namelessLetter._id,
      topic: namelessLetter.topic,
      authorAlias: namelessLetter.authorAlias,
      authorAvatarIcon: namelessLetter.authorAvatarIcon,
      content: namelessLetter.content,
      isHandwritten: namelessLetter.isHandwritten,
      font: namelessLetter.font,
      fontSize: namelessLetter.fontSize,
      inkColor: namelessLetter.inkColor,
      parchmentPaper: namelessLetter.parchmentPaper,
      sealColor: namelessLetter.sealColor,
      sealStamp: namelessLetter.sealStamp,
      ambientTheme: namelessLetter.ambientTheme,
      createdAt: namelessLetter.createdAt,
      expiresAt: namelessLetter.expiresAt,
      expiresInDays: 15,
      isMine: true
    });
  } catch (error) {
    console.error('Error creating nameless letter:', error);
    res.status(500).json({ message: 'Failed to release nameless words to the sanctuary.' });
  }
});

// 2. GET /api/nameless-letters - Fetch active (non-expired, <= 15 days) public nameless letters
router.get('/', async (req, res) => {
  try {
    const currentUserId = getUserIdFromReq(req);
    const { filter, search } = req.query;

    // Only fetch letters that have not passed their 15-day expiration
    let query = {
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: { $exists: false }, createdAt: { $gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) } }
      ]
    };

    if (filter === 'handwritten') {
      query.isHandwritten = true;
    } else if (filter === 'mine') {
      if (!currentUserId) {
        return res.json([]);
      }
      query.senderRef = currentUserId;
    }

    let sort = { createdAt: -1 };
    if (filter === 'resonated') {
      sort = { 'resonances.fire': -1, 'resonances.rose': -1, createdAt: -1 };
    }

    const letters = await NamelessLetter.find(query).sort(sort).lean();

    // Sanitize to guarantee 100% anonymity for all users
    const sanitized = letters.map(letter => {
      const isMine = !!(currentUserId && letter.senderRef && String(letter.senderRef) === String(currentUserId));
      
      // Determine if current user already resonated and which emoji they chose
      let myResonance = null;
      if (currentUserId && letter.resonators && Array.isArray(letter.resonators)) {
        const foundRes = letter.resonators.find(r => r.userRef && String(r.userRef) === String(currentUserId));
        if (foundRes) myResonance = foundRes.reaction;
      }

      // Determine if current user already commented
      let hasCommented = false;
      if (currentUserId && letter.thoughts && Array.isArray(letter.thoughts)) {
        hasCommented = letter.thoughts.some(t => t.userRef && String(t.userRef) === String(currentUserId));
      }

      // Ensure backward compatibility for resonance counters
      const cleanResonances = {
        fire: letter.resonances?.fire || letter.resonances?.embers || 0,
        rose: letter.resonances?.rose || letter.resonances?.echoes || 0,
        withered: letter.resonances?.withered || letter.resonances?.solace || 0,
        neutral: letter.resonances?.neutral || letter.resonances?.starlight || 0,
      };

      const { senderRef, resonators, ...publicData } = letter;

      // Sanitize thoughts: remove private userRefs
      const sanitizedThoughts = (letter.thoughts || []).map(t => {
        const { userRef, ...thoughtPublic } = t;
        return thoughtPublic;
      });

      return {
        ...publicData,
        topic: letter.topic || 'Whisper of the Realm',
        resonances: cleanResonances,
        thoughts: sanitizedThoughts,
        thoughtsCount: sanitizedThoughts.length,
        isMine,
        myResonance,
        hasCommented,
        expiresInDays: getExpiresInDays(letter)
      };
    });

    // Client-side text search if provided
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      const filtered = sanitized.filter(l => 
        l.content?.toLowerCase().includes(q) ||
        l.topic?.toLowerCase().includes(q) ||
        l.authorAlias?.toLowerCase().includes(q)
      );
      return res.json(filtered);
    }

    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching nameless letters:', error);
    res.status(500).json({ message: 'Failed to retrieve nameless words.' });
  }
});

// 3. GET /api/nameless-letters/:id - Fetch single nameless letter & increment view
router.get('/:id', async (req, res) => {
  try {
    const currentUserId = getUserIdFromReq(req);
    const letter = await NamelessLetter.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).lean();

    if (!letter) {
      return res.status(404).json({ message: 'Nameless letter not found in the chamber.' });
    }

    const isMine = !!(currentUserId && letter.senderRef && String(letter.senderRef) === String(currentUserId));
    
    let myResonance = null;
    if (currentUserId && letter.resonators && Array.isArray(letter.resonators)) {
      const foundRes = letter.resonators.find(r => r.userRef && String(r.userRef) === String(currentUserId));
      if (foundRes) myResonance = foundRes.reaction;
    }

    let hasCommented = false;
    if (currentUserId && letter.thoughts && Array.isArray(letter.thoughts)) {
      hasCommented = letter.thoughts.some(t => t.userRef && String(t.userRef) === String(currentUserId));
    }

    const cleanResonances = {
      fire: letter.resonances?.fire || letter.resonances?.embers || 0,
      rose: letter.resonances?.rose || letter.resonances?.echoes || 0,
      withered: letter.resonances?.withered || letter.resonances?.solace || 0,
      neutral: letter.resonances?.neutral || letter.resonances?.starlight || 0,
    };

    const { senderRef, resonators, ...publicData } = letter;

    const sanitizedThoughts = (letter.thoughts || []).map(t => {
      const { userRef, ...thoughtPublic } = t;
      return thoughtPublic;
    });

    res.json({
      ...publicData,
      topic: letter.topic || 'Whisper of the Realm',
      resonances: cleanResonances,
      thoughts: sanitizedThoughts,
      thoughtsCount: sanitizedThoughts.length,
      isMine,
      myResonance,
      hasCommented,
      expiresInDays: getExpiresInDays(letter)
    });
  } catch (error) {
    console.error('Error fetching nameless letter:', error);
    res.status(500).json({ message: 'Failed to retrieve letter details.' });
  }
});

// 4. POST /api/nameless-letters/:id/thoughts - Leave an anonymous thought / reflection
// Rule 1: Author cannot comment on their own letter
// Rule 2: Commenter name is auto-generated
// Rule 3: Each user can only comment once per letter
router.post('/:id/thoughts', async (req, res) => {
  try {
    const currentUserId = getUserIdFromReq(req);
    const { content, avatarIcon, inkColor, resonanceBadge } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Your thought cannot be empty.' });
    }

    const letter = await NamelessLetter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Nameless letter not found.' });
    }

    // Rule 1: Author cannot comment on their own letter
    if (currentUserId && letter.senderRef && String(letter.senderRef) === String(currentUserId)) {
      return res.status(403).json({ 
        message: 'You are the author of this letter. You may only read the reflections others inscribed.' 
      });
    }

    // Rule 3: Each user can comment only once
    if (currentUserId && letter.thoughts && Array.isArray(letter.thoughts)) {
      const alreadyCommented = letter.thoughts.some(t => t.userRef && String(t.userRef) === String(currentUserId));
      if (alreadyCommented) {
        return res.status(400).json({ 
          message: 'You have already sealed your single reflection upon this letter.' 
        });
      }
    }

    // Rule 2: Commenter alias is strictly auto-generated
    const randomAlias = POETIC_THOUGHT_ALIASES[Math.floor(Math.random() * POETIC_THOUGHT_ALIASES.length)];

    const newThought = {
      userRef: currentUserId || undefined,
      authorAlias: randomAlias,
      avatarIcon: avatarIcon || '🕯️',
      content: content.trim(),
      inkColor: inkColor || '#D4AF37',
      resonanceBadge: resonanceBadge || '🕯️',
      createdAt: new Date()
    };

    letter.thoughts.push(newThought);
    await letter.save();

    const addedThought = letter.thoughts[letter.thoughts.length - 1];
    
    // Return sanitized thought
    res.status(201).json({
      _id: addedThought._id,
      authorAlias: addedThought.authorAlias,
      avatarIcon: addedThought.avatarIcon,
      content: addedThought.content,
      inkColor: addedThought.inkColor,
      resonanceBadge: addedThought.resonanceBadge,
      createdAt: addedThought.createdAt
    });
  } catch (error) {
    console.error('Error adding thought to nameless letter:', error);
    res.status(500).json({ message: 'Failed to inscribe thought.' });
  }
});

// 5. POST /api/nameless-letters/:id/resonate - Add anonymous resonance reaction
// Rule 1: Author cannot resonate with their own letter
// Rule 2: Each user can only resonate once per letter
router.post('/:id/resonate', async (req, res) => {
  try {
    const currentUserId = getUserIdFromReq(req);
    const { resonanceType } = req.body; // 'fire' | 'rose' | 'withered' | 'neutral'

    const validTypes = ['fire', 'rose', 'withered', 'neutral'];
    const chosenType = validTypes.includes(resonanceType) ? resonanceType : 'fire';

    const letter = await NamelessLetter.findById(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Nameless letter not found.' });
    }

    // Rule 1: Author cannot resonate with their own letter
    if (currentUserId && letter.senderRef && String(letter.senderRef) === String(currentUserId)) {
      return res.status(403).json({ 
        message: 'The author may not resonate with their own letter.' 
      });
    }

    if (!currentUserId) {
      return res.status(401).json({ message: 'You must be logged in to resonate.' });
    }

    // Rule 2: Each user can only resonate once
    if (!letter.resonators) letter.resonators = [];
    const alreadyResonated = letter.resonators.find(r => r.userRef && String(r.userRef) === String(currentUserId));
    if (alreadyResonated) {
      return res.status(400).json({ 
        message: 'You have already resonated with this letter.' 
      });
    }

    // Record the resonance
    letter.resonators.push({ userRef: currentUserId, reaction: chosenType });
    if (!letter.resonances) {
      letter.resonances = { fire: 0, rose: 0, withered: 0, neutral: 0 };
    }
    letter.resonances[chosenType] = (letter.resonances[chosenType] || 0) + 1;

    await letter.save();

    res.json({
      resonances: letter.resonances,
      myResonance: chosenType
    });
  } catch (error) {
    console.error('Error adding resonance:', error);
    res.status(500).json({ message: 'Failed to resonate with letter.' });
  }
});

// 6. DELETE /api/nameless-letters/:id - Admin purge of any nameless letter
router.delete('/:id', async (req, res) => {
  try {
    const decoded = getUserFromReq(req);
    if (!decoded) {
      return res.status(401).json({ message: 'Authentication required to purge nameless letters.' });
    }

    let isAdmin = decoded.role === 'admin';
    if (!isAdmin && decoded.id) {
      const user = await User.findById(decoded.id).select('role');
      if (user && user.role === 'admin') isAdmin = true;
    }

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only an Admin / Guild Master may purge nameless letters from the portal.' });
    }

    const letter = await NamelessLetter.findByIdAndDelete(req.params.id);
    if (!letter) {
      return res.status(404).json({ message: 'Nameless letter not found in the chamber.' });
    }

    res.json({ message: 'Nameless letter purged from the chamber successfully.' });
  } catch (error) {
    console.error('Error purging nameless letter:', error);
    res.status(500).json({ message: 'Failed to purge nameless letter.' });
  }
});

module.exports = router;
