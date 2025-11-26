import { Canvas, IText, PencilBrush, util } from 'fabric';
import { v4 as uuid } from 'uuid';
import type { IEditor, IPluginTempl } from '../interface/Editor';

type IPlugin = Pick<PathTextPlugin, 'startTextPathDraw' | 'endTextPathDraw'>;

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

type DrawOptions = {
  decimate: number;
  width: number;
  defaultText: string;
  color: string;
  lineColor: string;
  defaultFontSize: number;
};

export default class PathTextPlugin implements IPluginTempl {
  static pluginName = 'PathTextPlugin';
  static apis = ['startTextPathDraw', 'endTextPathDraw'];
  private options?: DrawOptions;
  constructor(public canvas: Canvas, public editor: IEditor) {}

  _beforeHandler = (opt: any) => {
    if (this.options == null) return;
    const path = opt.path as any;
    const getPathSegmentsInfo = (util as any).getPathSegmentsInfo;
    path.segmentsInfo = getPathSegmentsInfo(path.path);
    path.set({ stroke: this.options.lineColor });
    const text = this.options.defaultText;
    const fontSize = this.options.defaultFontSize;
    const textObject = new IText(text, {
      fontFamily: 'arial',
      fontSize: fontSize,
      top: path.top,
      left: path.left,
      fill: this.options.color,
      path: path,
      id: uuid(),
      // Path text elements are not editable directly on canvas
      editable: false,
    });
    this.canvas.add(textObject);
  };
  _createdHandler = (opt: any) => {
    this.canvas.remove(opt.path);
  };
  _bindEvent() {
    this.canvas.on('before:path:created', this._beforeHandler);
    this.canvas.on('path:created', this._createdHandler);
  }
  _unbindEvent() {
    this.canvas.off('before:path:created', this._beforeHandler);
    this.canvas.off('path:created', this._createdHandler);
  }
  startTextPathDraw(options: Partial<DrawOptions> = {}) {
    const defaultOptions = {
      decimate: 8,
      width: 2,
      defaultText: 'Everything goes well',
      color: '#000000',
      lineColor: '#000000',
      defaultFontSize: 20,
    };
    this.options = {
      ...defaultOptions,
      ...(options && typeof options === 'object' ? options : {}),
    };
    this.canvas.isDrawingMode = true;
    const brush = (this.canvas.freeDrawingBrush = new PencilBrush(this.canvas));
    brush.decimate = this.options.decimate;
    brush.width = this.options.width;
    brush.color = this.options.color;
    this._bindEvent();
  }
  endTextPathDraw() {
    this.canvas.isDrawingMode = false;
    this._unbindEvent();
  }
}
