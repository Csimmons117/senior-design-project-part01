// Common exercise names to highlight in RED
const EXERCISES = [
  // Legs
  "Barbell Squats", "Squats", "Squat",
  "Leg Press", "Leg Extension", "Leg Extensions", "Leg Curl", "Leg Curls",
  "Romanian Deadlifts", "RDLs", "Deadlifts", "Deadlift",
  "Hamstring Curls", "Hamstring Curl",
  "Lunges", "Lunge", "Walking Lunges",
  "Calf Raises", "Calf Raise",
  "Leg Extensiorts", // Common typo

  // Chest
  "Bench Press", "Incline Bench Press", "Decline Bench Press",
  "Chest Press", "Dumbbell Press", "Push-ups", "Push-up", "Pushups",
  "Chest Fly", "Chest Flyes", "Dumbbell Fly",

  // Back
  "Pull-ups", "Pull-up", "Pullups", "Chin-ups", "Chin-up",
  "Lat Pulldown", "Lat Pulldowns",
  "Bent-over Rows", "Bent-over Row", "Barbell Row", "Barbell Rows",
  "Dumbbell Row", "Dumbbell Rows", "Seated Row", "Cable Row",

  // Shoulders
  "Overhead Press", "Shoulder Press", "Military Press",
  "Lateral Raises", "Lateral Raise", "Front Raises", "Front Raise",
  "Face Pulls", "Face Pull", "Shrugs", "Shrug",

  // Arms
  "Bicep Curls", "Bicep Curl", "Hammer Curls", "Hammer Curl",
  "Tricep Extensions", "Tricep Extension", "Tricep Dips",
  "Skull Crushers", "Skull Crusher",
  "Preacher Curls", "Preacher Curl",

  // Core
  "Plank", "Planks", "Side Plank",
  "Crunches", "Crunch", "Sit-ups", "Sit-up",
  "Russian Twists", "Russian Twist",
  "Leg Raises", "Leg Raise", "Hanging Leg Raises",

  // Cardio
  "Running", "Jogging", "Sprints", "Sprint",
  "Cycling", "Rowing", "Jump Rope",
  "Burpees", "Burpee", "Mountain Climbers",

  // Other
  "Hip Thrusts", "Hip Thrust", "Glute Bridge", "Glute Bridges",
  "Box Jumps", "Box Jump", "Step-ups", "Step-up"
];

// Sort by length (longest first) to match longer phrases first
const sortedExercises = [...EXERCISES].sort((a, b) => b.length - a.length);

// Create regex pattern
const exercisePattern = new RegExp(
  `\\b(${sortedExercises.map(e => e.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})\\b`,
  'gi'
);

/**
 * Highlight exercise names in text with red color
 * @param {string} text - The text to process
 * @returns {string} - Text with exercise names wrapped in span tags
 */
export function highlightExercises(text) {
  if (!text) return "";

  return text.replace(exercisePattern, (match) => {
    return `<span class="exercise-name">${match}</span>`;
  });
}

/**
 * Format height for display
 * @param {number} cm - Height in centimeters
 * @returns {string} - Formatted height string
 */
export function formatHeight(cm) {
  if (!cm) return "";
  return `${cm} cm`;
}

/**
 * Format weight for display
 * @param {number} kg - Weight in kilograms
 * @returns {string} - Formatted weight string
 */
export function formatWeight(kg) {
  if (!kg) return "";
  return `${kg} kg`;
}
