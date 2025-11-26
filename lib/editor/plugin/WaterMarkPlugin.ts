/*
 * @author fan
 * @Description WaterMark Plugin
 * @Date 2022-05-24 15:14:34
 * @lastEditors fan qq.com
 * @lastEditTime 2022-09-05 18:23:13
 */
import { cloneDeep } from 'lodash-es'
import type { Canvas as FabricCanvas } from 'fabric'
import type { IEditor, IPluginTempl } from '../interface/Editor'

type IPlugin = Pick<WaterMarkPlugin, 'drawWaterMark' | 'clearWaterMark' | 'updateDrawState'>

declare module '../interface/Editor' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

enum E {
  leftTop = 'left_top',
  leftBottom = 'left_right',
  rightTop = 'right_top',
  rightBottom = 'right_bottom',
  fill = 'fill',
}

type Position = E.leftTop | E.leftBottom | E.rightTop | E.rightBottom | E.fill // lt 左上 lr 左上 rt 右上  rb 右下 ll 平铺 后续可扩展其他功能
type DrawOps = {
  text: string
  size: number
  fontFamily: string
  color: string
  isRotate: boolean
  position: Position
}

const defaultOptions: DrawOps = {
  text: '',
  size: 20,
  isRotate: false, // 是否倾斜
  fontFamily: '汉体', // 可考虑自定义字体
  color: '#ccc', // 可考虑自定义颜色
  position: E.leftTop,
}

class WaterMarkPlugin implements IPluginTempl {
  static pluginName = 'WaterMarkPlugin'
  static apis = ['drawWaterMark', 'clearWaterMark', 'updateDrawState']
  private hasDraw = false
  private drawOps: DrawOps = defaultOptions
  constructor(public canvas: FabricCanvas, public editor: IEditor) {
    this.init()
  }

  private createCanvas(width: number, height: number) {
    const waterCanvas: HTMLCanvasElement = document.createElement('canvas')
    waterCanvas.width = width
    waterCanvas.height = height
    waterCanvas.style.position = 'fixed'
    waterCanvas.style.opacity = '0'
    waterCanvas.style.zIndex = '-1'
    return waterCanvas
  }

  // 待优化
  private drawing: Record<Position, (...arg: any[]) => void> = {
    [E.leftTop]: (width: number, height: number, cb: (imgString: string) => void) => {
      let waterCanvas: HTMLCanvasElement | null = this.createCanvas(width, height)
      const w = waterCanvas.width || width
      let ctx: CanvasRenderingContext2D | null = waterCanvas.getContext('2d')!
      ctx.fillStyle = this.drawOps.color
      ctx.font = `${this.drawOps.size}px ${this.drawOps.fontFamily}`
      ctx.fillText(this.drawOps.text, 10, this.drawOps.size + 10, w - 20)
      cb && cb(waterCanvas.toDataURL())
      waterCanvas = null
      ctx = null
    },
    [E.rightTop]: (width: number, height: number, cb: (imgString: string) => void) => {
      let waterCanvas: HTMLCanvasElement | null = this.createCanvas(width, height)
      let ctx: CanvasRenderingContext2D | null = waterCanvas.getContext('2d')!
      const w = waterCanvas.width || width
      ctx.fillStyle = this.drawOps.color
      ctx.font = `${this.drawOps.size}px ${this.drawOps.fontFamily}`
      ctx.fillText(
        this.drawOps.text,
        w - ctx.measureText(this.drawOps.text).width - 10,
        this.drawOps.size + 10,
        w - 20
      )
      cb && cb(waterCanvas.toDataURL())
      waterCanvas = null
      ctx = null
    },
    [E.leftBottom]: (width: number, height: number, cb: (imgString: string) => void) => {
      let waterCanvas: HTMLCanvasElement | null = this.createCanvas(width, height)
      let ctx: CanvasRenderingContext2D | null = waterCanvas.getContext('2d')!
      const w = waterCanvas.width || width
      const h = waterCanvas.height || height
      ctx.fillStyle = this.drawOps.color
      ctx.font = `${this.drawOps.size}px ${this.drawOps.fontFamily}`
      ctx.fillText(this.drawOps.text, 10, h - this.drawOps.size, w - 20)
      cb && cb(waterCanvas.toDataURL())
      waterCanvas = null
      ctx = null
    },
    [E.rightBottom]: (width: number, height: number, cb: (imgString: string) => void) => {
      let waterCanvas: HTMLCanvasElement | null = this.createCanvas(width, height)
      let ctx: CanvasRenderingContext2D | null = waterCanvas.getContext('2d')!
      const w = waterCanvas.width || width
      ctx.fillStyle = this.drawOps.color
      ctx.font = `${this.drawOps.size}px ${this.drawOps.fontFamily}`
      ctx.fillText(
        this.drawOps.text,
        w - ctx.measureText(this.drawOps.text).width - 10,
        height - this.drawOps.size,
        width - 20
      )
      cb && cb(waterCanvas.toDataURL())
      waterCanvas = null
      ctx = null
    },
    [E.fill]: (width: number, height: number, cb: (imgString: string) => void) => {
      const angle = -20 // 按逆时针度算
      const a = (angle * Math.PI) / 180
      const font = `${this.drawOps.size}px ${this.drawOps.fontFamily}`
      let waterCanvas: HTMLCanvasElement | null = this.createCanvas(width, height)
      let ctx: CanvasRenderingContext2D | null = waterCanvas.getContext('2d')!
      ctx.font = font
      const textW = ctx.measureText(this.drawOps.text).width + 10
      let patternCanvas: HTMLCanvasElement | null = this.createCanvas(
        this.drawOps.isRotate ? textW * Math.abs(Math.cos(a)) + this.drawOps.size : textW,
        this.drawOps.isRotate
          ? textW * Math.abs(Math.sin(a)) + this.drawOps.size
          : this.drawOps.size + 10
      )
      document.body.appendChild(patternCanvas)
      let ctxPat: CanvasRenderingContext2D | null = patternCanvas.getContext('2d')!
      ctxPat.textAlign = 'left'
      ctxPat.textBaseline = 'top'
      ctxPat.font = font
      ctxPat.fillStyle = `${this.drawOps.color}`
      if (this.drawOps.isRotate) {
        ctxPat.translate(0, textW * Math.abs(Math.sin(a)))
        ctxPat.rotate(a)
        ctxPat.fillText(this.drawOps.text, 0, 0)
      } else {
        ctxPat.fillText(this.drawOps.text, 0, 0)
      }
      ctx.fillStyle = ctx.createPattern(patternCanvas, 'repeat')!
      ctx.fillRect(0, 0, width, height)
      cb && cb(waterCanvas.toDataURL())
      waterCanvas = null
      patternCanvas = null
      ctx = null
      ctxPat = null
    },
  }

  drawWaterMark(ops: DrawOps) {
    this.drawOps = Object.assign(cloneDeep(this.drawOps), ops)
    if (!this.drawOps.text) return
    const workspace = this.canvas.getObjects().find((item: any) => item.id === 'workspace')
    const { width, height, left, top }: any = workspace
    this.drawing[this.drawOps.position](width, height, (imgString: string) => {
      this.canvas.overlayImage = undefined
      this.hasDraw = true
      this.canvas.setOverlayImage(imgString, this.canvas.renderAll.bind(this.canvas), {
        left: left || 0,
        top: top || 0,
        originX: 'left',
        originY: 'top',
      })
    })
  }

  // updateHandDraw 导入json时无法知道是否绘制
  updateDrawState(state: boolean) {
    this.hasDraw = state
  }

  clearWaterMark() {
    if (!this.hasDraw) return
    this.canvas.overlayImage = undefined
    this.canvas.renderAll()
    this.hasDraw = false
    this.drawOps = defaultOptions
  }

  init() {
    this.editor.on('sizeChange', this.drawWaterMark.bind(this))
  }

  destroy() {
    this.editor.off('sizeChange', this.drawWaterMark)
  }
}

export default WaterMarkPlugin
