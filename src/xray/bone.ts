import {
  EventBasedComponent,
  DigitalPin,
  Led,
  ReedSwitch,
  logManager,
  ComponentState,
  ReedSwitchState,
  LedState,
} from '../core/index';

export type BoneState = {
  isActive: boolean;
  reedSwitch?: ComponentState<ReedSwitchState>;
  greenLed?: ComponentState<LedState>;
  redLed?: ComponentState<LedState>;
  state: 'complete' | 'incomplete';
};

export interface BoneOptions {
  id: string;
  name: string;
  pins: {
    r: DigitalPin;
    g: DigitalPin;
    reedSwitch: DigitalPin;
  };
}
export class Bone implements EventBasedComponent<BoneState> {
  id: string;
  gLed: Led;
  rLed: Led;
  reedSwitch: ReedSwitch;
  state: ComponentState<BoneState>;

  isSubscribed = false;

  constructor(private options: BoneOptions) {
    this.state = {
      id: options.id,
      name: options.name,
      state: {
        isActive: false,
        state: 'incomplete',
      },
      operations: [
        {
          name: 'Activate',
          invoke: `/bones/${options.id}/activate`,
        },
        {
          name: 'Deactivate',
          invoke: `/bones/${options.id}/deactivate`,
        },
        {
          name: 'Red',
          invoke: `/bones/${options.id}/set-to-red`,
        },
        {
          name: 'Green',
          invoke: `/bones/${options.id}/set-to-green`,
        },
      ],
    };
  }

  private initComponent() {
    if (!this.gLed) {
      this.gLed = new Led({
        id: this.state.id + '-green-led',
        name: 'Green LED for ' + this.state.name,
        pin: this.options.pins.g,
      });
      this.rLed = new Led({
        id: this.state.id + '-red-led',
        name: 'Red LED for ' + this.state.name,
        pin: this.options.pins.r,
      });
      this.reedSwitch = new ReedSwitch({
        id: this.state.id + '-reed-switch',
        name: 'Reed Switch for ' + this.state.name,
        pin: this.options.pins.reedSwitch,
      });

      logManager.info('Initialized Bone');
    }
  }

  bind(board) {
    this.initComponent();
    this.gLed.bind(board);
    this.rLed.bind(board);
    this.reedSwitch.bind(board);
  }

  activate() {
    this.state.state.isActive = true;
    this.state.state.state = 'incomplete';
    this.turnRed();
    if (!this.isSubscribed) {
      logManager.info('Subscribing reed switch');
      this.isSubscribed = true;
      this.reedSwitch.on('close', () => {
        logManager.info('Reed Switch Closed');
        console.log(this.state.state);
        if (
          this.state.state.isActive &&
          this.state.state.state === 'incomplete'
        ) {
          this.turnGreen();
          this.callbacks['complete'] = this.callbacks['complete'] || [];
          this.callbacks['complete'].forEach((cb) => cb(this.getState()));
        }
      });
    }
  }

  makeInactive() {
    logManager.info(`Turning ${this.state.name} inactive.`);
    this.initComponent();
    this.state.state.isActive = false;
    this.rLed.turnOff();
    this.gLed.turnOff();
  }

  start() {
    logManager.info(`Starting ${this.state.name}.`);
    this.initComponent();
    this.rLed.turnOn();
    this.gLed.turnOff();
    this.activate();
  }

  turnGreen() {
    logManager.info(`Turning ${this.state.name} green.`);
    this.initComponent();
    this.rLed.turnOff();
    this.gLed.turnOn();
  }

  turnRed() {
    logManager.info(`Turning ${this.state.name} red.`);
    this.initComponent();
    this.gLed.turnOff();
    this.rLed.turnOn();
  }

  getState() {
    let state = {
      ...this.state,
    };

    if (this.reedSwitch) {
      state = {
        ...state,
        state: {
          ...(state.state || {}),
          reedSwitch: this.reedSwitch.getState(),
        },
      };
    }

    if (this.gLed) {
      state = {
        ...state,
        state: {
          ...(state.state || {}),
          greenLed: this.gLed.getState(),
        },
      };
    }

    if (this.rLed) {
      state = {
        ...state,
        state: {
          ...(state.state || {}),
          redLed: this.rLed.getState(),
        },
      };
    }

    return state;
  }

  callbacks = {};

  on(event: string, callback: (state: ComponentState<BoneState>) => void) {
    this.callbacks[event] = this.callbacks[event] || [];
    this.callbacks[event].push(callback);
  }
}
