export type EmotionType = 'Happy' | 'Calm' | 'Excited' | 'Sad' | 'Angry' | 'Scared' | 'Tired' | 'Silly';

export enum BehaviorType {
  Meltdown = 'Meltdown / Screaming',
  Crying = 'Crying / In Tears',
  Refusal = 'Refusal / Saying "No"',
  Aggression = 'Hitting / Kicking / Biting',
  ShuttingDown = 'Shutting Down / Withdrawing',
  Bolting = 'Running Away / Bolting',
  Stimming = 'Repetitive Actions / Stimming',
  Clinging = 'Clinging / Seeking Comfort',
  Other = 'Other',
}

export enum Trigger {
  Transitions = 'Transitions / Routine Change',
  Boredom = 'Boredom',
  Illness = 'Illness / Not Feeling Well',
  AttentionSeeking = 'Attention Seeking / Connection',
  Hunger = 'Hunger',
  Tiredness = 'Tiredness',
  SensoryInput = 'Sensory Input / Loud Noise',
  Overstimulation = 'Overstimulation / Crowds',
  SocialDemand = 'Social Demand / Pressure',
  TaskDemand = 'Difficult Task / Frustration',
  Unknown = 'Not Sure / Unknown',
}

export enum Resolution {
  DeepBreathing = 'Deep Breathing',
  QuietSpace = 'Quiet Space',
  Timer = 'Timer',
  SnackDrink = 'Given a Snack / Drink',
  Distraction = 'Distraction',
  PhysicalActivity = 'Physical Activity',
  SensoryTool = 'Sensory Tool',
  TalkItOut = 'Talk It Out',
  Ignored = 'Ignored',
  Other = 'Other',
}

export interface Profile {
  id: string;
  name: string;
  theme: 'light' | 'dark' | 'system';
  createdAt: number;
}

export interface Incident {
  id: string;
  profileId: string;
  timestamp: number;
  intensity: number; // 1-5
  duration?: number; // in minutes
  note?: string;
  location?: string;
  hunger?: boolean;
  screenTimeBefore?: string; // 'None', '<30 mins', '30-60 mins', '1hr+'
  sleepQuality?: number; // 1-5
  behaviors: string[]; // List of behaviors
  triggers: string[];
  resolutions: string[];
  photoUri?: string;
  voiceNoteUri?: string; // local audio recording URI
  reflectionAnswers?: {
    preventNextTime?: string;
    childResponse?: string;
  };
  isSmoothDay?: boolean;
}


// -- LEGACY / UI TYPES (Kept for UI compatibility) --

export interface Monster {
  id: EmotionType;
  name: string;
  imageSource: any;
  color: string;
  sound?: string;
  description?: string;
}

export interface ActivityTag {
  id: string;
  label: string;
  icon: string;
}

export interface MoodLog {
  id: string;
  timestamp: string;
  timestampMs: number;
  monsterId: string;
  note?: string;
  tags?: string[];
}


// Calm Tool Helper Types
export type CalmToolId = 'breathing' | 'candles' | 'grounding' | 'muscle' | 'timer' | 'guided-imagery';

export interface UserSettings {
  userName?: string;
  isPremium: boolean;
  theme: 'light' | 'dark' | 'system';
  enableSound: boolean;
  hapticsEnabled: boolean;
  onboardingCompleted: boolean;
  customizations?: Record<string, { color?: string; accessory?: string }>;
  favoriteCalmTools?: CalmToolId[];
  favoriteTimerLengths?: number[]; // in minutes (e.g., [5, 10, 15])
  timerTheme?: 'blue' | 'sunset' | 'forest';
  lastBackupTimestamp?: number;
}

export interface Stats {
  currentStreak: number;
  totalLogs: number;
  lastLogDate?: string;
  moodDistribution: Record<EmotionType, number>;
}
