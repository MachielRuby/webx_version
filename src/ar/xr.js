export async function startXRSession(renderer, onSessionEnd) {
  if (!navigator.xr) {
    throw new Error('当前浏览器不支持 WebXR')
  }

  const session = await navigator.xr.requestSession('immersive-ar', {
    requiredFeatures: ['local'],
    optionalFeatures: ['hit-test', 'anchors'],
  })

  renderer.xr.setReferenceSpaceType('local')
  await renderer.xr.setSession(session)

  const referenceSpace = await session.requestReferenceSpace('local')
  const viewerSpace = await session.requestReferenceSpace('viewer')
  const hitTestSource = await session.requestHitTestSource({ space: viewerSpace })

  let transientHitTestSource = null
  if (session.requestHitTestSourceForTransientInput) {
    transientHitTestSource = await session.requestHitTestSourceForTransientInput({
      profile: 'generic-touchscreen',
    })
  }

  session.addEventListener('end', onSessionEnd)

  return { session, referenceSpace, hitTestSource, transientHitTestSource }
}

export function getHitPose(frame, referenceSpace, hitTestSource, transientHitTestSource) {
  if (transientHitTestSource && frame.getHitTestResultsForTransientInput) {
    const transientResults =
      frame.getHitTestResultsForTransientInput(transientHitTestSource)
    for (const result of transientResults) {
      if (result.results.length > 0) {
        return result.results[0].getPose(referenceSpace)
      }
    }
  }

  if (hitTestSource) {
    const results = frame.getHitTestResults(hitTestSource)
    if (results.length > 0) {
      return results[0].getPose(referenceSpace)
    }
  }

  return null
}

export async function tryCreateAnchor(frame, session, transform, referenceSpace) {
  if (frame?.createAnchor) {
    return frame.createAnchor(transform, referenceSpace)
  }
  if (session?.requestAnchor) {
    return session.requestAnchor(transform, referenceSpace)
  }
  return null
}

export function getAnchorSpace(anchor) {
  return anchor?.anchorSpace || anchor?.createAnchorSpace?.() || null
}
