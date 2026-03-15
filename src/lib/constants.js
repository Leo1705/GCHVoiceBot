// Voice modes (selectable at start, changeable mid-session)
export const VOICE_MODES = [
  { id: "calm_support", label: "Calm Support", description: "Feel heard and emotionally regulated.", icon: "🌿" },
  { id: "anxiety_relief", label: "Anxiety Relief", description: "Grounding and reducing intensity.", icon: "🧘" },
  { id: "relationship_reflection", label: "Relationship Reflection", description: "Explore feelings and boundaries.", icon: "💬" },
  { id: "daily_checkin", label: "Daily Check-In", description: "Short mood and next-step check.", icon: "☀️" },
  { id: "crisis_mode", label: "Crisis Mode", description: "Non-emergency distress support.", icon: "🛟" },
];

// Quick mood/state for "How are you?" selector (remembers-everything style)
export const MOOD_OPTIONS = [
  { id: "winding_down", label: "Winding down?", sub: "Need to decompress", icon: "🌙" },
  { id: "need_vent", label: "Need to vent?", sub: "Get it off your chest", icon: "💨" },
  { id: "quick_check", label: "Quick check-in?", sub: "Short mood & next step", icon: "✓" },
  { id: "heavy", label: "Carrying something heavy?", sub: "Talk it through", icon: "🫂" },
  { id: "not_sure", label: "Not sure yet", sub: "Just want to talk", icon: "✨" },
];

// Voice customization — premade voices only (ElevenLabs free tier). Do not use library voice IDs here.
export const VOICE_PROFILES = [
  { id: "female", label: "Female", gender: "female", tone: "warm", speed: 1, elevenlabsVoiceId: "EXAVITQu4vr4xnSDxMaL" }, // Bella (premade)
  { id: "male", label: "Male", gender: "male", tone: "calm", speed: 1, elevenlabsVoiceId: "TxGEqnHWrfWFTfGW9XjX" },     // Josh (premade)
];

// Escalation levels for upsell
export const ESCALATION_LEVELS = {
  0: "Normal AI support",
  1: "Gentle offer (booking suggestion)",
  2: "Strong recommendation (high distress)",
  3: "Safety escalation (crisis)",
};

// Mock responses per mode — short, natural, one idea at a time (voice-friendly)
export const MOCK_RESPONSES = {
  calm_support: [
    "I hear you. That sounds really hard.",
    "What do you need most right now?",
    "It makes sense you'd feel that way. Thank you for sharing.",
    "Would you like to name one small step you could take?",
    "How are you feeling in your body right now?",
    "That's a lot to carry. You don't have to have answers right now.",
    "What would feel supportive in this moment?",
    "I'm here. Take your time.",
    "I'm glad that helped a little. What would you like to do next?",
  ],
  anxiety_relief: [
    "You're safe right now. I'm right here with you.",
    "Let's try one breath together. Breathe in for four. Hold for four. Now out for four.",
    "Anxiety can feel huge. Name three things you can see in the room. What are they?",
    "How does your body feel after that? We can do another short grounding step if you'd like.",
    "That's your nervous system doing its job. It's not forever.",
    "Where do you feel it most in your body — chest, stomach, shoulders?",
    "One thing at a time. What's the very next small step?",
  ],
  relationship_reflection: [
    "So it sounds like that moment was really frustrating.",
    "What did you want from them in that moment?",
    "What boundary or need do you think is underneath this?",
    "Would it help to try one calm way to say that to them? We can phrase it together.",
    "It's okay to need something different from how things are right now.",
    "What would it look like if they really heard you?",
  ],
  daily_checkin: [
    "How are you feeling from 1 to 10 right now?",
    "What's one thing weighing on you today?",
    "What's one small win you had today?",
    "What's one tiny step you can take next?",
    "How did today compare to yesterday?",
    "What would make the rest of today a little easier?",
  ],
  crisis_mode: [
    "I'm really sorry you're going through this.",
    "Are you in immediate danger right now?",
    "If you can, reach out to someone you trust and stay with them.",
    "Would you like to talk to a human? I can help with that.",
    "I want to make sure you're safe. Can you tell me one thing that would help right now?",
    "You don't have to do this alone. There are people who want to help.",
  ],
};

// Safety response (when unsafe content detected)
export const SAFETY_RESPONSE =
  "I'm really sorry you're feeling this way. I want to make sure you're safe. Are you in immediate danger right now? If you are, please call your local emergency number. If you can, reach out to someone you trust. If you want, I can help you take the next step to get real human support.";

// End-of-session wrap
export const END_SESSION_RESPONSE =
  "Before we end, here's what I'm hearing: you've been carrying a lot. One small next step could be to take a short walk or text one person you trust. If you'd like, you can also book time with a real therapist to go deeper. Do you want to end here, or talk a little more?";

// Upsell offer
export const UPSELL_OFFER =
  "Would you like to talk to a real therapist about this? I can help you book a session now, or we can keep talking here. What would you prefer?";

// Opening greeting when session starts (phone-style: no button)
export const SESSION_GREETING =
  "Hi. I'm here when you're ready. Say what's on your mind.";
