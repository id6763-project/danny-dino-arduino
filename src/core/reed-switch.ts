import { Switch as J5Switch, Board as J5Board } from 'johnny-five';
import { ArduinoBoard } from './board';
import { ComponentState, EventBasedComponent } from './component';
import { DigitalPin } from './pin';

export type ReedSwitchState = 'open' | 'close';

export interface ReedSwitchOptions {
  id: string;
  name: string;
  pin: DigitalPin;
}

export class ReedSwitch implements EventBasedComponent<ReedSwitchState> {
  board: J5Board;
  j5switch: J5Switch;
  state: ComponentState<ReedSwitchState>;

  constructor(private options: ReedSwitchOptions) {
    this.state = {
      id: options.id,
      name: options.name,
      state: 'open',
    };
  }

  private initComponent(board?: ArduinoBoard) {
    if (!this.j5switch) {
      if (board) {
        this.j5switch = new J5Switch({
          pin: this.options.pin,
          board: board.j5board,
        });
      } else {
        this.j5switch = new J5Switch(this.options.pin);
      }
    }
  }

  bind(board: ArduinoBoard) {
    this.board = board;
    this.initComponent(board);
  }

  getState() {
    return this.state;
  }

  on(
    eventName: ReedSwitchState,
    callback: (state: ComponentState<ReedSwitchState>) => void
  ) {
    if (this.j5switch) {
      this.j5switch.on(eventName, () => {
        this.state.state = eventName;
        callback(this.getState());
      });
    }
  }
}
