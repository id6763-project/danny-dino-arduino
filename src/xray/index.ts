/**
 * Button on the heart. Everytime button is clicked, the destination of the puzzle changes (The user would see a different broken).
 * Components:
 * 1. Proximity Sensor
 * 2. LED Strip
 * 3. Push Button
 *
 * Step 1: (LED Strip on the whole time)
 * Step 2: Wait for Push Heart Button
 * Step 3: Trigger Audio
 * Step 4: LED on bone turns on
 * Step 5: Wait for Person to move peg
 * Step 6: Wait for Proximity sensor on bone to activate
 * Step 7: Trigger Audio + LED turns green
 * Step 8: Wait some time + LED disappears and the next broken bone turns on.
 */

import {
  AnalogRGBLedStrip,
  Button,
  DigitalPin,
  ArduinoBoard,
  InstallationOptions,
  Installation,
  InstallationState,
  color,
  InstallationSetup,
  logManager,
  ComponentState,
} from '../core/index';
import { Bone } from './bone';
import Player from 'play-sound';
import path from 'path';

const dannyTheDinoSetup: InstallationSetup = {
  queryState: '/danny/state',
  steps: [
    {
      id: 1,
      name: 'Introduction',
      operation: 'play:audio',
      value: '/audio/1-introduction.wav',
    },
    {
      id: 2,
      name: 'Light Up LED Strip',
      operation: 'invoke:api',
      value: '/led-strip/turn-on',
    },
    {
      id: 3,
      name: 'Have You Found It',
      operation: 'play:audio',
      value: '/audio/2-have-you-found-it.wav',
    },

    {
      id: 4,
      name: 'Danny is Hurt',
      operation: 'play:audio',
      value: '/audio/3-danny-is-hurt.wav',
    },
    {
      id: 5,
      name: 'Waiting for heart button.',
      operation: 'wait:until',
      value: 'components:#heart-button:state:press',
    },
    {
      id: 6,
      name: 'Instructions',
      operation: 'play:audio',
      value: '/audio/4-instructions.wav',
    },
    {
      id: 7,
      name: 'Activating Random Bone',
      operation: 'invoke:api',
      value: '/bones/activate-next',
    },
    {
      id: 8,
      name: 'Waiting to Complete Task',
      operation: 'wait:until',
      value: 'gameState:complete',
    },
    {
      id: 9,
      name: 'Next steps',
      operation: 'play:audio',
      value: '/audio/6-next-steps.wav',
    },
    {
      id: 10,
      name: 'Help Another Dinosaur',
      operation: 'play:audio',
      value: '/audio/7-one-more.wav',
    },
    {
      id: 11,
      name: 'Good Bye',
      operation: 'invoke:api',
      value: '/danny/stop',
    },
  ],
};

export interface DannyTheDinoState extends InstallationState {
  logs?: string[];
  components: ComponentState<any>[];
  gameState: 'inactive' | 'incomplete' | 'complete';
}

export class DannyTheDino implements Installation<DannyTheDinoState> {
  selectedBone = 0;
  player = new Player();
  currentBone: Bone;
  audioPath = path.join(__dirname, '..', '..', 'audio-files');

  options: InstallationOptions = {
    boardOptions: {
      // port: '/dev/cu.usbmodem14101',
    },
  };

  board: ArduinoBoard;
  ledStrip: AnalogRGBLedStrip;
  heartButton: Button;
  bones: Bone[];
  state: DannyTheDinoState;

  constructor() {
    this.state = {
      id: 1,
      name: 'Danny the Dinosaur',
      description: 'Danny the Dinosaur is sick.',
      status: 'stopped',
      isConnected: false,
      logs: logManager.getLogs(),
      components: [],
      gameState: 'inactive',
    };
  }

  getState() {
    let state = { ...this.state };

    if (this.ledStrip) {
      state = {
        ...state,
        components: [
          ...(state.components ? state.components : []),
          this.ledStrip.getState(),
        ],
      };
    }

    if (this.bones) {
      state = {
        ...state,
        components: [
          ...(state.components ? state.components : []),
          ...this.bones.map((bone) => bone.getState()),
        ],
      };
    }

    if (this.heartButton) {
      state = {
        ...state,
        components: [
          ...(state.components ? state.components : []),
          this.heartButton.getState(),
        ],
      };
    }

    return state;
  }

  getBoard() {
    return this.board;
  }

  getSetup() {
    return dannyTheDinoSetup;
  }

  init() {
    this.board = new ArduinoBoard(this.options.boardOptions);
    this.ledStrip = new AnalogRGBLedStrip({
      id: 'analog-led-strip',
      name: 'RGB LED Strip',
      pins: {
        r: DigitalPin.PIN_3_PWM,
        g: DigitalPin.PIN_5_PWM,
        b: DigitalPin.PIN_6_PWM,
      },
    });
    this.heartButton = new Button({
      id: 'heart-button',
      name: 'Heart Button',
      pin: DigitalPin.PIN_32,
    });
    this.bones = [
      new Bone({
        id: 'bone-1',
        name: 'Bone #1',
        pins: {
          g: DigitalPin.PIN_26,
          r: DigitalPin.PIN_28,
          reedSwitch: DigitalPin.PIN_30,
        },
      }),
      new Bone({
        id: 'bone-2',
        name: 'Bone #2',
        pins: {
          g: DigitalPin.PIN_40,
          r: DigitalPin.PIN_42,
          reedSwitch: DigitalPin.PIN_44,
        },
      }),
      new Bone({
        id: 'bone-3',
        name: 'Bone #3',
        pins: {
          g: DigitalPin.PIN_48,
          r: DigitalPin.PIN_50,
          reedSwitch: DigitalPin.PIN_46,
        },
      }),
    ];

    logManager.info('Initialized all bones');
  }

  async connect() {
    logManager.info('Initializing setup');
    this.init();
    logManager.info('Initialization complete');

    return this.board
      .connect()
      .then(() => {
        logManager.info('Connected to board successfully');
        this.state.isConnected = true;
        this.board.addComponents(
          this.ledStrip,
          this.heartButton,
          ...this.bones
        );

        if (this.ledStrip) {
          this.ledStrip.turnOff();
        }

        if (this.bones) {
          this.bones.forEach((bone) => bone.makeInactive());
        }
      })
      .catch((err) => logManager.error(err));
  }

  public activateNextBone() {
    this.state.gameState = 'incomplete';
    this.bones.forEach((bone) => bone.makeInactive());
    this.selectedBone = (this.selectedBone + 1) % this.bones.length;
    this.currentBone = this.bones[this.selectedBone];
    this.currentBone.start();
    this.currentBone.on('complete', () => (this.state.gameState = 'complete'));
  }

  private makeCurrentBoneActive() {
    const activateNextBone = () => {
      this.currentBone.on('complete', () => {
        this.state.gameState = 'complete';
        this.currentBone.turnGreen();

        this.player.play('./packages/audio-files/7.mp3', (err) => {
          this.player.play('./packages/audio-files/8.mp3', (err) => {
            setTimeout(() => {
              this.currentBone.makeInactive();
            }, 1000);
          });
        });
      });

      this.selectedBone = (this.selectedBone + 1) % this.bones.length;
    };

    activateNextBone();
  }

  async start(updateStatus = true) {
    this.state.status = 'started';
  }

  async stop(updateStatus = true) {
    if (updateStatus) this.state.status = 'stopping';

    if (this.ledStrip) {
      this.ledStrip.turnOff();
    }
    if (this.bones) {
      this.bones.forEach((bone) => bone.makeInactive());
    }

    if (this.heartButton) {
      this.heartButton.state.state = 'n/a';
    }

    if (updateStatus) this.state.status = 'stopped';
  }

  async restart() {
    this.state.status = 'restarting';
    this.stop(false);
    this.start(false);
    this.state.status = 'started';
  }
}

export const danny = new DannyTheDino();
