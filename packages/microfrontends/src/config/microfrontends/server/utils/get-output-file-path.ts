import path from 'node:path';
import {
  MFE_CONFIG_DEFAULT_FILE_PATH,
  MFE_CONFIG_DEFAULT_FILE_NAME,
} from '../constants';

export function getOutputFilePath(): string {
  return path.join(MFE_CONFIG_DEFAULT_FILE_PATH, MFE_CONFIG_DEFAULT_FILE_NAME);
}
