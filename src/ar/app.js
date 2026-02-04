import * as THREE from 'three'
import { createScene } from './scene.js'
import { createUI } from './ui.js'
import { loadModelById, modelCatalog } from './models.js'
import { getAnchorSpace, getHitPose, startXRSession, tryCreateAnchor } from './xr.js'

export function initApp(mountEl) {
  mountEl.innerHTML = `
    <div id="canvas-container"></div>
    <div id="ui"></div>
  `

  const canvasContainer = mountEl.querySelector('#canvas-container')
  const uiContainer = mountEl.querySelector('#ui')
  const { scene, camera, renderer, reticle } = createScene()
  canvasContainer.appendChild(renderer.domElement)

  const state = {
    session: null,
    referenceSpace: null,
    hitTestSource: null,
    transientHitTestSource: null,
    latestFrame: null,
    latestHitPose: null,
    isPlacing: false,
    preview: null,
    selectedModelId: null,
    anchors: [],
    placed: [],
  }

  const ui = createUI(uiContainer, modelCatalog, {
    onStartXR: () => startXR().catch((err) => ui.setTips(err.message)),
    onSelectModel: (modelId) => selectModel(modelId),
    onConfirm: () => confirmPlacement(),
    onCancel: () => cancelPlacement(),
    onClear: () => clearAll(),
  })

  ui.setTips('请选择模型并进入 AR')

  async function startXR() {
    const { session, referenceSpace, hitTestSource, transientHitTestSource } =
      await startXRSession(renderer, handleSessionEnd)
    state.session = session
    state.referenceSpace = referenceSpace
    state.hitTestSource = hitTestSource
    state.transientHitTestSource = transientHitTestSource
    ui.setArRunning(true)
    ui.setStatus('AR 已连接')
    ui.setTips('移动设备以识别平面，触摸可拖动')
    renderer.setAnimationLoop(onXRFrame)
  }

  function handleSessionEnd() {
    state.session = null
    state.referenceSpace = null
    state.hitTestSource = null
    state.transientHitTestSource = null
    state.latestFrame = null
    state.latestHitPose = null
    ui.setArRunning(false)
    ui.setStatus('未连接')
    ui.setTips('AR 会话已结束')
    renderer.setAnimationLoop(null)
  }

  async function selectModel(modelId) {
    ui.setActiveModel(modelId)
    state.selectedModelId = modelId
    if (!state.session) {
      ui.setTips('请先进入 AR，再放置模型')
      return
    }
    if (state.preview) {
      scene.remove(state.preview)
      state.preview = null
    }
    ui.setTips('移动设备寻找平面，触摸拖动，确认放置')
    const { root } = await loadModelById(modelId)
    root.visible = false
    scene.add(root)
    state.preview = root
    state.isPlacing = true
    ui.setPlacingEnabled(true)
  }

  function updatePreview(pose) {
    if (!state.preview || !pose) return
    const { position, orientation } = pose.transform
    state.preview.visible = true
    state.preview.position.set(position.x, position.y, position.z)
    state.preview.quaternion.set(
      orientation.x,
      orientation.y,
      orientation.z,
      orientation.w,
    )

    if (state.latestFrame) {
      const viewerPose = state.latestFrame.getViewerPose(state.referenceSpace)
      if (viewerPose) {
        const viewerPos = viewerPose.transform.position
        state.preview.lookAt(viewerPos.x, state.preview.position.y, viewerPos.z)
      }
    }
  }

  async function confirmPlacement() {
    if (!state.preview || !state.latestHitPose) return
    const transform = state.latestHitPose.transform
    let anchor = null
    if (state.latestFrame) {
      anchor = await tryCreateAnchor(
        state.latestFrame,
        state.session,
        transform,
        state.referenceSpace,
      )
    }

    if (anchor) {
      const anchorSpace = getAnchorSpace(anchor)
      state.anchors.push({ anchor, space: anchorSpace, object: state.preview })
      ui.setTips('锚点创建成功，模型已空间定位')
    } else {
      state.placed.push({ object: state.preview })
      ui.setTips('锚点不可用，已直接放置')
    }
    state.preview = null
    state.isPlacing = false
    ui.setPlacingEnabled(false)
  }

  function cancelPlacement() {
    if (state.preview) {
      scene.remove(state.preview)
      state.preview = null
    }
    state.isPlacing = false
    ui.setPlacingEnabled(false)
    ui.setTips('已取消放置')
  }

  function clearAll() {
    state.anchors.forEach(({ anchor, object }) => {
      if (anchor?.delete) {
        anchor.delete()
      }
      scene.remove(object)
    })
    state.anchors = []
    state.placed.forEach(({ object }) => scene.remove(object))
    state.placed = []
    if (state.preview) {
      scene.remove(state.preview)
      state.preview = null
      state.isPlacing = false
      ui.setPlacingEnabled(false)
    }
    ui.setTips('已清空所有模型')
  }

  function updateAnchors(frame) {
    if (state.anchors.length === 0) return
    for (const entry of state.anchors) {
      if (!entry.space) continue
      const pose = frame.getPose(entry.space, state.referenceSpace)
      if (!pose) continue
      entry.object.position.set(
        pose.transform.position.x,
        pose.transform.position.y,
        pose.transform.position.z,
      )
      entry.object.quaternion.set(
        pose.transform.orientation.x,
        pose.transform.orientation.y,
        pose.transform.orientation.z,
        pose.transform.orientation.w,
      )
    }
  }

  function updateReticle(pose) {
    if (!pose) {
      reticle.visible = false
      return
    }
    reticle.visible = true
    reticle.position.set(
      pose.transform.position.x,
      pose.transform.position.y,
      pose.transform.position.z,
    )
    reticle.quaternion.set(
      pose.transform.orientation.x,
      pose.transform.orientation.y,
      pose.transform.orientation.z,
      pose.transform.orientation.w,
    )
  }

  function onXRFrame(_time, frame) {
    state.latestFrame = frame
    const pose = getHitPose(
      frame,
      state.referenceSpace,
      state.hitTestSource,
      state.transientHitTestSource,
    )
    state.latestHitPose = pose
    updateReticle(pose)

    if (state.isPlacing) {
      updatePreview(pose)
    }
    updateAnchors(frame)
    renderer.render(scene, camera)
  }
}
