import type { Canvas, FabricObject } from 'fabric';
import CanvasRuler, { RulerOptions } from './ruler';
import GuideLine from './guideline';

function initRuler(canvas: Canvas, options?: RulerOptions) {
  // Ensure options is an object before spreading
  const optionsObj = options && typeof options === 'object' ? options : {};
  const ruler = new CanvasRuler({
    canvas,
    ...optionsObj,
  });

  // Remove guide line if moved outside workspace
  let workspace: FabricObject | undefined = undefined;

  /**
   * 获取workspace
   */
  const getWorkspace = () => {
    workspace = canvas.getObjects().find((item) => item.id === 'workspace');
  };

  /**
   * 判断target是否在object矩形外
   * @param object
   * @param target
   * @returns
   */
  const isRectOut = (object: FabricObject, target: GuideLine): boolean => {
    const { top, height, left, width } = object;

    if (top === undefined || height === undefined || left === undefined || width === undefined) {
      return false;
    }

    // In Fabric.js v6, getBoundingRect() doesn't accept arguments
    const targetRect = target.getBoundingRect();
    const {
      top: targetTop,
      height: targetHeight,
      left: targetLeft,
      width: targetWidth,
    } = targetRect;

    if (
      target.isHorizontal() &&
      (top > targetTop + 1 || top + height < targetTop + targetHeight - 1)
    ) {
      return true;
    } else if (
      !target.isHorizontal() &&
      (left > targetLeft + 1 || left + width < targetLeft + targetWidth - 1)
    ) {
      return true;
    }

    return false;
  };

  canvas.on('guideline:moving', (e) => {
    if (!workspace) {
      getWorkspace();
      return;
    }
    const { target } = e;
    if (isRectOut(workspace, target)) {
      target.moveCursor = 'not-allowed';
    }
  });

  canvas.on('guideline:mouseup', (e) => {
    if (!workspace) {
      getWorkspace();
      return;
    }
    const { target } = e;
    if (isRectOut(workspace, target)) {
      canvas.remove(target);
      canvas.setCursor(canvas.defaultCursor ?? '');
    }
  });
  return ruler;
}

export default initRuler;
