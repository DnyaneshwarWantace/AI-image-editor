/*
 * Custom Textbox with modified justify alignment logic
 * Converted to Fabric.js v6
 */
import { Textbox, FabricObject } from 'fabric';

class CustomTextbox extends Textbox {
  constructor(options?: any) {
    super(options);
    (this as any).type = 'textbox';
  }

  _renderChars(
    method: 'fillText' | 'strokeText',
    ctx: CanvasRenderingContext2D,
    line: any[],
    left: number,
    top: number,
    lineIndex: number
  ) {
    // Set proper line offset
    const isJustify = this.textAlign?.indexOf('justify') !== -1;
    let actualStyle: any;
    let nextStyle: any;
    let charsToRender = '';
    let charBox: any;
    let boxWidth = 0;
    let timeToRender: boolean;
    const path = this.path;
    const shortCut =
      !isJustify &&
      this.charSpacing === 0 &&
      this.isEmptyStyles(lineIndex) &&
      !path;
    const isLtr = this.direction === 'ltr';
    const sign = this.direction === 'ltr' ? 1 : -1;
    let drawingLeft: number;
    const currentDirection = ctx.canvas.getAttribute('dir');

    ctx.save();
    if (currentDirection !== this.direction) {
      ctx.canvas.setAttribute('dir', isLtr ? 'ltr' : 'rtl');
      (ctx as any).direction = isLtr ? 'ltr' : 'rtl';
      ctx.textAlign = isLtr ? 'left' : 'right';
    }

    // Check if style changed (simplified for v6)
    const hasStyleChanged = (actual: any, next: any) => {
      if (!actual || !next) return true;
      return (
        actual.fontSize !== next.fontSize ||
        actual.fontFamily !== next.fontFamily ||
        actual.fontWeight !== next.fontWeight ||
        actual.fontStyle !== next.fontStyle ||
        actual.fill !== next.fill
      );
    };

    const lineHeight = this.getHeightOfLine(lineIndex);
    top -= (lineHeight * (this as any)._fontSizeFraction) / this.lineHeight;
    
    if (shortCut) {
      // Shortcut rendering
      (this as any)._renderChar(method, ctx, lineIndex, 0, line.join(''), left, top, lineHeight);
    } else {
      // Full rendering with style support
      for (let i = 0; i < line.length; i++) {
        actualStyle = this._getStyleDeclaration(lineIndex, i);
        nextStyle = this._getStyleDeclaration(lineIndex, i + 1);
        timeToRender = hasStyleChanged(actualStyle, nextStyle);

        if (timeToRender) {
          charsToRender += line[i];
          charBox = (this as any).__charBounds?.[lineIndex]?.[i] || { width: 0, kernedWidth: 0 };
          boxWidth = charBox.width || 0;

          if (isJustify && i < line.length - 1) {
            const charSpacing = this._getWidthOfCharSpacing();
            boxWidth += charSpacing;
          }

          drawingLeft = left + (isLtr ? 0 : -boxWidth);
          (this as any)._renderChar(method, ctx, lineIndex, i, charsToRender, drawingLeft, top, lineHeight);
          left += sign * boxWidth;
          charsToRender = '';
        } else {
          charsToRender += line[i];
        }
      }
    }

    ctx.restore();
  }

  static fromObject(object: any, options?: any): Promise<any> {
    return new Promise((resolve) => {
      (FabricObject as any)._fromObject('Textbox', object, (instance: CustomTextbox) => {
        resolve(instance);
      });
    });
  }
}

export default CustomTextbox;

