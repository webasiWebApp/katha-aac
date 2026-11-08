// Public API of the goals feature. Other features import ONLY from here.
export {
  createGoal,
  updateGoal,
  archiveGoal,
  addProgress,
  listGoals,
  type Goal,
  type GoalProgress,
  type GoalWithProgress,
  type TargetPeriod,
} from './data/goalRepo';
export { GoalsScreen, GoalEditScreen } from './ui/GoalsScreen';
