export type TopicState = "open" | "current" | "upcoming" | "locked";
export type LevelState = "done" | "current" | "locked";

export type TopicLessonCounts = { total: number; completed: number; topicCompleted: boolean; contentPreparing: boolean };
export type Topic = { id: string; ord: number; title: string; state: TopicState; lessons?: TopicLessonCounts | null };
export type Level = {
  ord: number;
  code: string;
  title: string;
  summary: string;
  vocabHint: string;
  canDo: string[];
  state: LevelState;
  topics: Topic[];
};

export type UserDirection = {
  directionId: string;
  slug: string;
  title: string;
  kind: "LANGUAGE" | "SUBJECT";
  currentLevelOrd: number | null;
  levelAccess: "SEQUENTIAL" | "OPEN";
  placedBy: string | null;
  levels: Level[];
  currentTopic: (Topic & { levelCode: string }) | null;
  placementInProgress: string | null;
};

export type Overview = { promptDismissed: boolean; directions: UserDirection[] };

export type CatalogLevel = { ord: number; code: string; title: string; summary: string; canDo: string[]; vocabHint: string };
export type CatalogDirection = {
  id: string;
  slug: string;
  kind: "LANGUAGE" | "SUBJECT";
  title: string;
  description: string;
  active: boolean;
  /** Daraja aniqlash testi savollari bormi (yo'q bo'lsa faqat "0 dan boshlash") */
  placementReady?: boolean;
  levels: CatalogLevel[];
};

export type MistakeItem = {
  questionId: string;
  prompt: string;
  options: string[];
  chosenIndex: number;
  correctIndex: number;
  correctSentence: string;
  note: string;
  count: number;
  levelCode: string;
};
export type MistakeGroup = {
  ruleKey: string;
  title: string;
  tipTitle: string;
  tipBody: string;
  remember: string;
  total: number;
  topic: { id: string; title: string; levelCode: string; accessible: boolean };
  items: MistakeItem[];
};

export type PlacementQuestionView = {
  status: "IN_PROGRESS";
  id: string;
  mode: "CLAIMED" | "UNKNOWN";
  directionId: string;
  levelCode: string | null;
  index: number;
  total: number | null;
  question: { id: string; prompt: string; instruction: string; options: string[] };
};

export type PlacementResultView = {
  status: "DONE";
  id: string;
  mode: "CLAIMED" | "UNKNOWN";
  directionId: string;
  claimedCode: string | null;
  claimedOrd: number | null;
  scorePct: number;
  correct: number;
  total: number;
  outcome: "RETEST_LOWER" | "START_ZERO" | "REPEAT_OPEN" | "ADVANCE" | "MASTERED" | "PLACED";
  resultOrd: number;
  resultCode: string | null;
  resultTitle: string | null;
  levels: Array<{ ord: number; code: string; title: string }>;
  perLevel: Array<{ code: string; total: number; correct: number }>;
  wrong: Array<{
    prompt: string;
    options: string[];
    chosenIndex: number;
    correctIndex: number;
    correctSentence: string;
    levelCode: string;
    ruleTitle: string;
  }>;
};

export type LessonItem = {
  lessonId: string;
  title: string;
  pages: number;
  status: "continue" | "start";
  reviewPct: number;
  lastPageIndex: number | null;
  topic: { id: string; title: string; ord: number; lessons: { total: number; completed: number } };
  direction: { id: string; title: string };
  levelCode: string;
};
export type NextLessons = {
  hasDirections: boolean;
  pendingLevel: boolean;
  contentPreparing: boolean;
  allDone: boolean;
  continue: LessonItem | null;
  next: LessonItem[];
};

export type ProgressSummary = {
  directions: Array<{
    directionId: string;
    title: string;
    levelCode: string | null;
    topicsTotal: number;
    topicsCompleted: number;
    lessonsTotal: number;
    lessonsCompleted: number;
    topics: Array<{ id: string; ord: number; title: string; state: TopicState; lessons: TopicLessonCounts | null }>;
  }>;
  totals: { lessonsCompleted: number };
  activity: { days: Array<{ date: string; events: number }>; activeDays7: number; activeDays28: number; streak: number };
};
