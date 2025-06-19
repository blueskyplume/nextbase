import { LevelMap } from "@/types";

const LEVEL_MAP: LevelMap = {
  critical: '#F43B2C',
  error: '#D97007',
  warning: '#FFAD42',
};

const TrainStatus = {
  not_started: 'default',
  in_progress: 'processing',
  completed: 'success',
  failed: 'error'
};

const TrainText = {
  not_started: 'notStarted',
  in_progress: 'inProgress',
  completed: 'completed',
  failed: 'failed'
};

type TRAIN_STATUS = 'not_started' | 'in_progress' | 'completed' | 'failed';



export {
  LEVEL_MAP,
  TrainStatus,
  TrainText,
  type TRAIN_STATUS
}