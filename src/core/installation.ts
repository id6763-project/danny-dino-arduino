import { BoardOption } from 'johnny-five';
import { ArduinoBoard } from './board';

export interface InstallationOptions {
  boardOptions?: BoardOption;
}
export interface InstallationSetup {
  queryState: string;
  steps: {
    id: number;
    name: string;
    operation: 'play:audio' | 'invoke:api' | 'wait:until';
    value: string;
  }[];
}

export type InstallationStatus =
  | 'starting'
  | 'started'
  | 'stopping'
  | 'stopped'
  | 'restarting';

export interface InstallationState {
  id: number;
  name: string;
  description: string;
  isConnected: boolean;
  status: InstallationStatus;
}

export interface Installation<S extends InstallationState> {
  getSetup(): InstallationSetup;
  getBoard(): ArduinoBoard;
  getState(): S;

  get connect();
  start();
  stop();
  restart();
}
