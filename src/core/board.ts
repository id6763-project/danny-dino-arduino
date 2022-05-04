import { Board, BoardOption } from 'johnny-five';
import { BaseComponent } from './component';

export class ArduinoBoard {
  j5board: Board;
  components: BaseComponent<any>[];

  constructor(private options: BoardOption) {
    this.j5board = new Board(options);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.j5board.on('ready', () => resolve());
      this.j5board.on('fail', (data) => reject(data.message));
      this.j5board.on('error', (err) => {
        console.log('Error', err);
        reject(err);
      });
    });
  }

  addComponents(...components: BaseComponent<any>[]) {
    this.components = [...(this.components || []), ...components];

    components.forEach((component) => component.bind(this));
  }

  getComponent = <C extends BaseComponent<any>>(name: string): C => {
    return this.components[name] as C;
  };
}
