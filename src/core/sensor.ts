import { Sensor as JFSensor } from 'johnny-five';
import { ArduinoBoard } from './board';
import { ComponentState, EventBasedComponent } from './component';
import { AnalogPin } from './pin';

export type SensorState = 'change' | 'data';
export type SensorOptions = {
  id: string;
  name: string;
  pin: AnalogPin;
};

export class Sensor implements EventBasedComponent<SensorState> {
  private j5Sensor: JFSensor;
  state: ComponentState<SensorState>;

  constructor(private options: SensorOptions) {}

  private initComponent(board?: ArduinoBoard) {
    if (!this.j5Sensor) {
      if (board) {
        this.j5Sensor = new JFSensor({
          pin: this.options.pin,
          board: board.j5board,
        });
      } else {
        this.j5Sensor = new JFSensor({
          pin: this.options.pin,
        });
      }
    }
  }

  bind(board: ArduinoBoard) {
    this.initComponent(board);
  }

  on(
    event: SensorState,
    callback: (state: ComponentState<SensorState>) => void
  ) {
    this.initComponent(undefined);

    this.j5Sensor.on(event, () => {
      const value = this.j5Sensor.scaleTo(0, 100);
      if (value < 20) {
        callback(this.getState());
      }
    });
  }

  getState() {
    return this.state;
  }
}
