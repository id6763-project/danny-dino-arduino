import { Pin } from 'johnny-five';
import { ArduinoBoard } from './board';
import { BaseComponent, ComponentState } from './component';
import { logManager } from './log-manager';
import { InstallationOptions } from './installation';
import { AnalogRGBLedStripPin } from './pin';

export interface AnalogRGBLedStripState {
  isPowered: boolean;
  currentColor: Color;
  colorHistory: Color[];
  refreshRate: number;
}

export interface AnalogRGBLedStripOptions extends InstallationOptions {
  id: string;
  name: string;
  pins: {
    r: AnalogRGBLedStripPin;
    g: AnalogRGBLedStripPin;
    b: AnalogRGBLedStripPin;
  };
}

export class Color {
  constructor(public r: number, public g: number, public b: number) {}

  brightness(multiplier = 1) {
    this.r *= multiplier;
    this.g *= multiplier;
    this.b *= multiplier;

    return this;
  }

  brighten(multiplier = 1.25) {
    return this.brightness(multiplier);
  }

  dim(multiplier = 0.5) {
    return this.brightness(multiplier);
  }

  static white = new Color(255, 255, 255);
  static red = new Color(255, 0, 0);
  static green = new Color(0, 255, 0);
  static blue = new Color(0, 0, 255);
  static off = new Color(0, 0, 0);
}

export function color(r: number, g: number, b: number) {
  return new Color(r, g, b);
}

export class AnalogRGBLedStrip
  implements BaseComponent<AnalogRGBLedStripState>
{
  private board: ArduinoBoard;
  animator;

  state: ComponentState<AnalogRGBLedStripState>;

  constructor(private options: AnalogRGBLedStripOptions) {
    this.state = {
      id: options.id,
      name: options.name,
      type: 'analog-led-strip',
      state: {
        currentColor: color(255, 255, 255).dim(),
        colorHistory: [],
        isPowered: false,
        refreshRate: 1000 / 30,
      },
      operations: [
        {
          name: 'Turn On',
          invoke: '/led-strip/turn-on',
        },
        {
          name: 'Turn Off',
          invoke: '/led-strip/turn-off',
        },
      ],
    };
  }

  private initComponent(board?: ArduinoBoard) {
    if (board) {
      this.board.j5board.pinMode(this.options.pins.r, Pin.PWM);
      this.board.j5board.pinMode(this.options.pins.g, Pin.PWM);
      this.board.j5board.pinMode(this.options.pins.b, Pin.PWM);
      logManager.info('Initialized LED strip.');
    } else {
      logManager.error(
        'Could not initialize LED strip since board is not connected.'
      );
    }
  }

  setColor(color: Color) {
    this.state.state.currentColor = color;

    if (this.board) {
      this.board.j5board.analogWrite(
        this.options.pins.r,
        this.state.state.currentColor.r
      );
      this.board.j5board.analogWrite(
        this.options.pins.g,
        this.state.state.currentColor.g
      );
      this.board.j5board.analogWrite(
        this.options.pins.b,
        this.state.state.currentColor.b
      );
      // logManager.info(
      // `Successfully set LED strip color to (${this.state.state.currentColor.r}, ${this.state.state.currentColor.g}, ${this.state.state.currentColor.b}).`
      // );
    } else {
      logManager.error(
        'Could not set color on LED strip since board is not connected.'
      );
    }
  }

  loopColors(duration: number, ...colors: Color[]) {
    const eachTransitionDuration = duration / (colors.length - 1);

    this.setColor(colors[0]);

    const transition = (index: number) => {
      this.fadeTo(colors[index], eachTransitionDuration).then(() => {
        transition((index + 1) % colors.length);
      });
    };

    transition(1);
  }

  fadeTo(toColor: Color, duration: number): Promise<void> {
    return new Promise((res) => {
      const rDistance = toColor.r - this.state.state.currentColor.r;
      const gDistance = toColor.g - this.state.state.currentColor.g;
      const bDistance = toColor.b - this.state.state.currentColor.b;

      const stops = duration / this.state.state.refreshRate;

      const rStep = rDistance / stops;
      const gStep = gDistance / stops;
      const bStep = bDistance / stops;

      if (this.animator) {
        clearInterval(this.animator);
      }

      this.animator = setInterval(() => {
        const { r, g, b } = this.state.state.currentColor;

        this.setColor(color(r + rStep, g + gStep, b + bStep));

        const {
          r: updatedR,
          g: updatedG,
          b: updatedB,
        } = this.state.state.currentColor;

        const isRCompleted =
          rDistance > 0 ? updatedR >= toColor.r : updatedR <= toColor.r;
        const isGCompleted =
          gDistance > 0 ? updatedG >= toColor.g : updatedG <= toColor.g;
        const isBCompleted =
          bDistance > 0 ? updatedB >= toColor.b : updatedR <= toColor.b;

        // console.log(isRCompleted, isGCompleted, isBCompleted);

        if (isRCompleted && isGCompleted && isBCompleted) {
          clearInterval(this.animator);
          res();
        }
      }, this.state.state.refreshRate);
    });
  }

  getState() {
    return this.state || {};
  }

  bind(board: ArduinoBoard) {
    this.board = board;
    this.initComponent(board);
  }

  turnOn() {
    if (this.animator) {
      clearInterval(this.animator);
    }

    this.setColor(color(255, 255, 255));
  }

  turnOff() {
    this.setColor(color(0, 0, 0));
  }
}
