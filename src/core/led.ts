import { Led as JFLed } from 'johnny-five';
import { ArduinoBoard } from './board';
import { BaseComponent, ComponentState } from './component';
import { DigitalPin } from './pin';

export type LedState = 'on' | 'off';

export interface LedOptions {
  id: string;
  name: string;
  pin: DigitalPin;
}

export class Led implements BaseComponent<LedState> {
  private j5Led: JFLed;
  state: ComponentState<LedState>;

  constructor(private options: LedOptions) {
    this.state = {
      id: options.id,
      name: options.name,
      state: 'off',
    };
  }

  private initComponent(board?: ArduinoBoard) {
    if (!this.j5Led) {
      if (board) {
        this.j5Led = new JFLed({
          pin: this.options.pin,
          board: board.j5board,
        });
      } else {
        this.j5Led = new JFLed({
          pin: this.options.pin,
        });
      }
    }
  }

  getState() {
    return this.state;
  }

  bind(board: ArduinoBoard) {
    this.initComponent(board);
  }

  turnOn() {
    this.initComponent(undefined);

    this.j5Led.on();
    this.state.state = 'on';
  }

  turnOff() {
    this.initComponent(undefined);

    this.j5Led.off();
    this.state.state = 'off';
  }
}
