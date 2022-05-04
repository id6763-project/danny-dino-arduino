import { Button as JFButton } from 'johnny-five';
import { ArduinoBoard } from './board';
import { ComponentState, EventBasedComponent } from './component';
import { logManager } from './log-manager';
import { DigitalPin } from './pin';

export type ButtonState = 'hold' | 'down' | 'press' | 'up' | 'release' | 'n/a';

export interface ButtonOptions {
  id: string;
  name: string;
  pin: DigitalPin;
}

export class Button implements EventBasedComponent<ButtonState> {
  private j5Button: JFButton;
  state: ComponentState<ButtonState>;

  constructor(private options: ButtonOptions) {
    this.state = {
      id: options.id,
      name: options.name,
      type: 'button',
      state: 'hold',
      operations: [
        {
          name: 'Press',
          invoke: `/buttons/${options.id}/press`,
        },
        {
          name: 'Reset',
          invoke: `/buttons/${options.id}/reset`,
        },
      ],
    };
  }

  private initComponent(board?: ArduinoBoard) {
    if (!this.j5Button) {
      if (board) {
        this.j5Button = new JFButton({
          pin: this.options.pin,
          board: board.j5board,
        });
      } else {
        this.j5Button = new JFButton({
          pin: this.options.pin,
        });
      }
      logManager.info('Initialized button.');

      this.on('press', () => (this.state.state = 'press'));
    }
  }

  on(
    event: ButtonState,
    callback: (data: ComponentState<ButtonState>) => void
  ) {
    if (this.j5Button) {
      this.j5Button.on(event, () => {
        logManager.info(`Button event : ${event}`);
        this.state.state = event;
        callback(this.getState());
      });
    }
  }

  bind(board: ArduinoBoard) {
    this.initComponent(board);
  }

  getState() {
    return this.state;
  }
}
