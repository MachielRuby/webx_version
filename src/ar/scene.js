import * as THREE from 'three'

export function createScene() {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    20,
  )

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.xr.enabled = true

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
  scene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
  dirLight.position.set(0, 4, 0)
  scene.add(dirLight)

  const ring = new THREE.RingGeometry(0.06, 0.08, 32)
  ring.rotateX(-Math.PI / 2)
  const reticle = new THREE.Mesh(
    ring,
    new THREE.MeshBasicMaterial({ color: 0x00ff88 }),
  )
  reticle.visible = false
  scene.add(reticle)

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize)

  return { scene, camera, renderer, reticle }
}
