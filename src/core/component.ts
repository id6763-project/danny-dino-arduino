import { ArduinoBoard } from './board';

export interface ComponentState<State> {
  id: string;
  name: string;
  type: string;
  state: State;
  operations?: {
    name: string;
    invoke: string;
  }[];
}

export interface BaseComponent<State> {
  getState(): ComponentState<State>;
  bind(board: ArduinoBoard);
}

export interface EventBasedComponent<State> extends BaseComponent<State> {
  on(eventName: string, callback: <D>(data: D) => void);
}

export interface IsResettable {
  reset();
}
