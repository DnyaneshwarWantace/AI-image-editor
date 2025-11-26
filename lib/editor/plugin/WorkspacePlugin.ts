/*
 * @author Image Editor
 * @date 2022-08-18
 * @lastEditors Image Editor
 * @lastEditTime 2023-06-08
 * @Description Plugin
 */

import { Rect, Point, iMatrix, util } from 'fabric'
import { throttle } from 'lodash-es'
import type { IEditor, IPluginTempl } from '../interface/Editor'
import type { Canvas as FabricCanvas } from 'fabric'

type IPlugin = Pick<
  WorkspacePlugin,
  | 'big'
  | 'small'
  | 'auto'
  | 'one'
  | 'setSize'
  | 'getWorkspace'
  | 'setWorkspaceBg'
  | 'setCenterFromObject'
>

declare module '../interface/Editor' {
  // eslint-disable-next-line typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class WorkspacePlugin implements IPluginTempl {
  static pluginName = 'WorkspacePlugin'
  static events = ['sizeChange']
  static apis = [
    'big',
    'small',
    'auto',
    'one',
    'setSize',
    'getWorkspace',
    'setWorkspaceBg',
    'setCenterFromObject',
  ]
  workspaceEl!: Element
  workspace: null | Rect | undefined
  resizeObserver!: ResizeObserver
  option: any
  zoomRatio: number
  constructor(public canvas: FabricCanvas, public editor: IEditor, options?: any) {
    this.workspace = null
    // Use options if provided, otherwise use defaults
    const initOptions = options && typeof options === 'object' && 'width' in options && 'height' in options
      ? { width: options.width, height: options.height }
      : { width: 300, height: 300 }
    this.init(initOptions)
    this.zoomRatio = 0.85
  }

  init(option: { width: number; height: number }) {
    const workspaceEl = document.querySelector('#workspace') as Element
    if (!workspaceEl) {
      throw new Error('Element #workspace is missing, please check!')
    }
    this.workspaceEl = workspaceEl
    this.workspace = null
    this.option = option
    this._initBackground()
    this._initWorkspace()
    this._initResizeObserve()
    this._bindWheel()
  }

  fitObjectsToWorkspace() {
    const workspace = this.getWorkspace()
    if (!workspace || !workspace.width || !workspace.height) return

    const workspaceWidth = workspace.width
    const workspaceHeight = workspace.height
    const workspaceLeft = workspace.left || 0
    const workspaceTop = workspace.top || 0

    // Get all objects except workspace
    const objects = this.canvas.getObjects().filter((obj: any) => obj.id !== 'workspace')
    if (objects.length === 0) return

    // Disable rendering during batch operations for performance
    this.canvas.renderOnAddRemove = false

    // Calculate bounding box of all objects
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    for (const obj of objects) {
      const bounds = obj.getBoundingRect()
      minX = Math.min(minX, bounds.left)
      minY = Math.min(minY, bounds.top)
      maxX = Math.max(maxX, bounds.left + bounds.width)
      maxY = Math.max(maxY, bounds.top + bounds.height)
    }

    const contentWidth = maxX - minX
    const contentHeight = maxY - minY

    // Calculate scale to fit within workspace
    const padding = 20
    const scale = Math.min(
      (workspaceWidth - padding * 2) / contentWidth,
      (workspaceHeight - padding * 2) / contentHeight,
      1 // Don't scale up, only down
    )

    // Calculate center offset
    const centerX = workspaceLeft + workspaceWidth / 2
    const centerY = workspaceTop + workspaceHeight / 2
    const contentCenterX = minX + contentWidth / 2
    const contentCenterY = minY + contentHeight / 2

    // Apply transformations to all objects in batch
    for (const obj of objects) {
      const relativeX = (obj.left || 0) - contentCenterX
      const relativeY = (obj.top || 0) - contentCenterY

      obj.set({
        scaleX: (obj.scaleX || 1) * scale,
        scaleY: (obj.scaleY || 1) * scale,
        left: centerX + relativeX * scale,
        top: centerY + relativeY * scale,
      })
      obj.setCoords()
    }

    // Re-enable rendering and render once
    this.canvas.renderOnAddRemove = true
    this.canvas.requestRenderAll()
  }

  hookImportAfter() {
    return new Promise((resolve) => {
      const workspace = this.canvas.getObjects().find((item) => (item as any).id === 'workspace')
      if (workspace) {
        // Lock workspace completely - cannot be selected, moved, or edited
        workspace.set({
          selectable: false,
          hasControls: false,
          evented: false,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          hoverCursor: 'default',
        })

        // Move workspace to back to ensure it stays as background
        this.canvas.sendObjectToBack(workspace)

        if (workspace.width && workspace.height) {
          this.setSize(workspace.width, workspace.height)
          this.editor.emit('sizeChange', workspace.width, workspace.height)
        }
      }
      resolve('')
    })
  }

  hookSaveAfter() {
    return new Promise((resolve) => {
      this.auto()
      resolve(true)
    })
  }

  // 初始化背景
  _initBackground() {
    // In Fabric.js v6, set backgroundImage to undefined to clear it
    this.canvas.backgroundImage = undefined
    const workspaceEl = this.workspaceEl as HTMLElement
    const width = workspaceEl.offsetWidth || 800
    const height = workspaceEl.offsetHeight || 600
    // In Fabric.js v6, directly set width and height properties
    if (width > 0 && height > 0) {
      this.canvas.width = width
      this.canvas.height = height
    }
  }

  // 初始化画布
  _initWorkspace() {
    const { width, height } = this.option
    const workspace = new Rect({
      fill: 'rgba(255,255,255,1)',
      width,
      height,
      id: 'workspace',
      strokeWidth: 0,
      selectable: false,
      hasControls: false,
      evented: false,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      hoverCursor: 'default',
    })

    this.canvas.add(workspace)
    this.canvas.sendObjectToBack(workspace)
    this.canvas.renderAll()

    this.workspace = workspace

    // Prevent workspace deletion
    this._preventWorkspaceDeletion()

    // historyClear is a custom method added by fabric-history.ts
    if ((this.canvas as any).historyClear) {
      (this.canvas as any).historyClear()
    }
    this.auto()
  }

  // Prevent workspace from being deleted
  _preventWorkspaceDeletion() {
    this.canvas.on('before:selection:cleared', (e: any) => {
      const workspace = this.getWorkspace()
      if (workspace && e.deselected && e.deselected.includes(workspace)) {
        // Prevent workspace from being removed from canvas
        workspace.set({
          selectable: false,
          evented: false,
        })
      }
    })

    // Override delete behavior to protect workspace
    const originalRemove = this.canvas.remove.bind(this.canvas) as any
    this.canvas.remove = ((...objects: any[]) => {
      const filtered = objects.filter((obj) => (obj as any).id !== 'workspace')
      if (filtered.length > 0) {
        return originalRemove(...filtered)
      }
      return originalRemove()
    }) as any
  }

  // 返回workspace对象
  getWorkspace() {
    return this.canvas.getObjects().find((item) => (item as any).id === 'workspace') as Rect | undefined
  }

  /**
   * 设置画布中心到指定对象中心点上
   * @param {Object} obj 指定的对象
   */
  setCenterFromObject(obj: Rect) {
    const { canvas } = this
    const objCenter = obj.getCenterPoint()
    const viewportTransform = canvas.viewportTransform
    if (canvas.width === undefined || canvas.height === undefined || !viewportTransform) return
    viewportTransform[4] = canvas.width / 2 - objCenter.x * viewportTransform[0]
    viewportTransform[5] = canvas.height / 2 - objCenter.y * viewportTransform[3]
    canvas.setViewportTransform(viewportTransform)
    canvas.renderAll()
  }

  // 初始化监听器
  _initResizeObserve() {
    const resizeObserver = new ResizeObserver(
      throttle(() => {
        this.auto()
      }, 50)
    )
    this.resizeObserver = resizeObserver
    this.resizeObserver.observe(this.workspaceEl)
  }

  setSize(width: number, height: number) {
    this._initBackground()
    this.option.width = width
    this.option.height = height
    // 重新设置workspace
    this.workspace = this.canvas
      .getObjects()
      .find((item) => (item as any).id === 'workspace') as Rect | undefined
    if (!this.workspace) return
    this.workspace.set('width', width)
    this.workspace.set('height', height)
    this.editor.emit('sizeChange', this.workspace.width, this.workspace.height)
    this.auto()
  }

  setZoomAuto(scale: number, cb?: (left: number, top: number) => void) {
    const workspaceEl = this.workspaceEl as HTMLElement
    const width = workspaceEl.offsetWidth || this.canvas.width || 800
    const height = workspaceEl.offsetHeight || this.canvas.height || 600
    // In Fabric.js v6, directly set width and height properties
    if (width > 0 && height > 0) {
      this.canvas.width = width
      this.canvas.height = height
    }
    const center = this.canvas.getCenter()
    // iMatrix is [1, 0, 0, 1, 0, 0] - identity matrix for resetting viewport
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0] as [number, number, number, number, number, number])
    this.canvas.zoomToPoint(new Point(center.left, center.top), scale)
    if (!this.workspace) return
    this.setCenterFromObject(this.workspace)

    // 超出画布不展示
    // In Fabric.js v6, clone() returns a Promise
    this.workspace.clone().then((cloned: Rect) => {
      this.canvas.clipPath = cloned
      this.canvas.requestRenderAll()
    })
    if (cb) cb(this.workspace.left, this.workspace.top)
  }

  _getScale() {
    const workspaceEl = this.workspaceEl as HTMLElement
    const workspace = this.getWorkspace()
    if (!workspace) return 1
    return util.findScaleToFit(workspace, {
      width: workspaceEl.offsetWidth,
      height: workspaceEl.offsetHeight,
    })
  }

  // 放大
  big() {
    let zoomRatio = this.canvas.getZoom()
    zoomRatio += 0.05
    const center = this.canvas.getCenter()
    this.canvas.zoomToPoint(new Point(center.left, center.top), zoomRatio)
  }

  // 缩小
  small() {
    let zoomRatio = this.canvas.getZoom()
    zoomRatio -= 0.05
    const center = this.canvas.getCenter()
    this.canvas.zoomToPoint(
      new Point(center.left, center.top),
      zoomRatio < 0 ? 0.01 : zoomRatio
    )
  }

  // 自动缩放
  auto() {
    const scale = this._getScale()
    this.setZoomAuto(scale * this.zoomRatio)
  }

  // 1:1 放大
  one() {
    this.setZoomAuto(1 * this.zoomRatio)
    this.canvas.requestRenderAll()
  }

  setWorkspaceBg(color: string) {
    const workspace = this.getWorkspace()
    if (!workspace) return
    workspace.set('fill', color)
  }

  _bindWheel() {
    this.canvas.on('mouse:wheel', function (this: FabricCanvas, opt) {
      const delta = opt.e.deltaY
      let zoom = this.getZoom()
      zoom *= 0.999 ** delta
      if (zoom > 20) zoom = 20
      if (zoom < 0.01) zoom = 0.01
      const center = this.getCenter()
      this.zoomToPoint(new Point(center.left, center.top), zoom)
      opt.e.preventDefault()
      opt.e.stopPropagation()
    })
  }

  destroy() {
    this.resizeObserver.disconnect()
    this.canvas.off()
    console.log('plugin destroy')
  }
}

export default WorkspacePlugin
