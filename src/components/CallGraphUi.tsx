import { useRef, useState, useEffect } from "react"
import { Call, Point, SvgNode, Arrow } from "../lib/types"
import styles from "./CallGraphUi.module.css"
import { CallGraph, Hover } from "./CallGraph"
import { GraphController } from "./GraphController"
const ZOOMS: number[] = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6,
  1.7, 1.8, 1.9, 2.0,
]
const MIN_ZOOM_INDEX = 0
const MAX_ZOOM_INDEX = ZOOMS.length - 1

export type Drag = {
  startMouseX: number
  startMouseY: number
  startViewBoxX: number
  startViewBoxY: number
}

// TODO: click on node shows popup of incoming and outgoing calls
// TODO: hover line?
// TODO: quadtree
// TODO: dynamic node width and height
// TODO: fix smoother drag
export const CallGraphUi: React.FC<{
  calls: Call[]
  backgroundColor: string
  width: number
  height: number
  getNodeFillColor?: (hover: Hover, node: SvgNode) => string
  getNodeStrokeColor?: (hover: Hover, node: SvgNode) => string
  getArrowColor?: (hover: Hover, arrow: Arrow) => string
  renderNode?: (node: SvgNode) => React.ReactNode
  showDot?: boolean
  nodeWidth?: number
  nodeHeight?: number
  nodeXGap?: number
  nodeYGap?: number
}> = ({
  calls,
  backgroundColor,
  width,
  height,
  getNodeFillColor,
  getNodeStrokeColor,
  getArrowColor,
  renderNode = (node) => node.id,
  showDot = false,
  nodeWidth,
  nodeHeight,
  nodeXGap,
  nodeYGap,
}) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [mouse, setMouse] = useState<Point | null>(null)
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width,
    height,
  })
  const [zoomIndex, setZoomIndex] = useState<number>(9)

  useEffect(() => {
    zoom(3)
  }, [])

  function zoom(next: number) {
    // Zoom in -> view box decrease width and height
    // Zoom out -> view box increase width and height
    const up = next >= zoomIndex
    const nextZoomIndex = up
      ? Math.min(next, MAX_ZOOM_INDEX)
      : Math.max(next, MIN_ZOOM_INDEX)
    const w = Math.floor(width / ZOOMS[nextZoomIndex])
    const h = Math.floor(height / ZOOMS[nextZoomIndex])
    const center = {
      x: viewBox.x + (viewBox.width >> 1),
      y: viewBox.y + (viewBox.height >> 1),
    }

    setZoomIndex(nextZoomIndex)
    setViewBox({
      x: center.x - (w >> 1),
      y: center.y - (h >> 1),
      width: w,
      height: h,
    })
  }

  function onClickPlus() {
    zoom(zoomIndex + 1)
  }

  function onClickMinus() {
    zoom(zoomIndex - 1)
  }

  function getMouse(
    ref: HTMLDivElement | null,
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): Point | null {
    if (!ref) {
      return null
    }
    const rect = ref.getBoundingClientRect()

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  function onMouseDown(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.preventDefault()
    const mouse = getMouse(ref.current, e)
    if (mouse) {
      setDrag({
        startMouseX: mouse.x,
        startMouseY: mouse.y,
        startViewBoxX: viewBox.x,
        startViewBoxY: viewBox.y,
      })
    }
  }

  function onMouseUp(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.preventDefault()
    setDrag(null)
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.preventDefault()
    const mouse = getMouse(ref.current, e)
    if (mouse) {
      setMouse(mouse)
      if (drag) {
        const dx = mouse.x - drag.startMouseX
        const dy = mouse.y - drag.startMouseY
        setViewBox({
          ...viewBox,
          x: drag.startViewBoxX - dx,
          y: drag.startViewBoxY - dy,
        })
      }
    }
  }

  function onMouseOut(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    e.preventDefault()
    setDrag(null)
  }

  const zoomPercentage = Math.floor((width / viewBox.width) * 100)

  return (
    <div
      style={{
        backgroundColor,
        position: "relative",
        width,
        height,
      }}
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
    >
      <CallGraph
        calls={calls}
        backgroundColor={backgroundColor}
        width={width}
        height={height}
        viewBox={viewBox}
        mouse={mouse}
        isDragging={!!drag}
        showDot={showDot}
        getNodeFillColor={getNodeFillColor}
        getNodeStrokeColor={getNodeStrokeColor}
        getArrowColor={getArrowColor}
        renderNode={renderNode}
        nodeWidth={nodeWidth}
        nodeHeight={nodeHeight}
        nodeXGap={nodeXGap}
        nodeYGap={nodeYGap}
      />
      {drag ? (
        <div
          style={{
            cursor: "grabbing",
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
          }}
          onMouseOut={onMouseOut}
        ></div>
      ) : null}
      <div className={styles.controllers}>
        <GraphController
          onClickPlus={onClickPlus}
          onClickMinus={onClickMinus}
          zoomPercentage={zoomPercentage}
        />
      </div>
    </div>
  )
}
