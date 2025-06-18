import { LevelMap } from "@/types";

const LEVEL_MAP: LevelMap = {
  critical: '#F43B2C',
  error: '#D97007',
  warning: '#FFAD42',
};

type TRAIN_STATUS = 'not_started' | 'in_progress' | 'completed' | 'failed';

export {
  LEVEL_MAP,
  type TRAIN_STATUS
}