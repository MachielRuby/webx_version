import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader = new GLTFLoader()

export const modelCatalog = [
  {
    id: 'chair',
    name: 'Chair',
    url: 'https://threejs.org/examples/models/gltf/Chair/Chair.gltf',
    scale: 0.4,
  },
  {
    id: 'helmet',
    name: 'Helmet',
    url: 'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf',
    scale: 0.6,
  },
  {
    id: 'duck',
    name: 'Duck',
    url: 'https://threejs.org/examples/models/gltf/Duck/glTF/Duck.gltf',
    scale: 0.5,
  },
]

export async function loadModelById(modelId) {
  const item = modelCatalog.find((model) => model.id === modelId)
  if (!item) {
    throw new Error('模型不存在')
  }
  const gltf = await loader.loadAsync(item.url)
  const root = gltf.scene || gltf.scenes?.[0]
  if (!root) {
    throw new Error('模型加载失败')
  }
  normalizeModel(root, item.scale)
  return { root, item }
}

function normalizeModel(root, scale) {
  if (scale) {
    root.scale.setScalar(scale)
  }
  root.updateWorldMatrix(true, true)
  const box = new THREE.Box3().setFromObject(root)
  const center = new THREE.Vector3()
  box.getCenter(center)
  root.position.x -= center.x
  root.position.z -= center.z
  root.position.y -= box.min.y
}
