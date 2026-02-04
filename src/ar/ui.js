export function createUI(container, models, handlers) {
  container.innerHTML = `
    <div class="panel">
      <div class="row">
        <button id="enter-ar">进入 AR</button>
        <span id="xr-status">未连接</span>
      </div>
      <div class="model-list">
        ${models
          .map(
            (model) =>
              `<button class="model-item" data-model="${model.id}">${model.name}</button>`,
          )
          .join('')}
      </div>
      <div class="row">
        <button id="confirm">确认放置</button>
        <button id="cancel">取消放置</button>
        <button id="clear">清空</button>
      </div>
      <div class="tips" id="tips"></div>
    </div>
  `

  const enterButton = container.querySelector('#enter-ar')
  const statusEl = container.querySelector('#xr-status')
  const tipsEl = container.querySelector('#tips')
  const confirmButton = container.querySelector('#confirm')
  const cancelButton = container.querySelector('#cancel')
  const clearButton = container.querySelector('#clear')
  const modelButtons = Array.from(container.querySelectorAll('.model-item'))

  enterButton.addEventListener('click', handlers.onStartXR)
  confirmButton.addEventListener('click', handlers.onConfirm)
  cancelButton.addEventListener('click', handlers.onCancel)
  clearButton.addEventListener('click', handlers.onClear)
  modelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      handlers.onSelectModel(button.dataset.model)
    })
  })

  setPlacingEnabled(false)

  function setPlacingEnabled(enabled) {
    confirmButton.disabled = !enabled
    cancelButton.disabled = !enabled
  }

  function setStatus(text) {
    statusEl.textContent = text
  }

  function setTips(text) {
    tipsEl.textContent = text || ''
  }

  function setArRunning(isRunning) {
    enterButton.disabled = isRunning
    enterButton.textContent = isRunning ? 'AR 已启动' : '进入 AR'
  }

  function setActiveModel(modelId) {
    modelButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.model === modelId)
    })
  }

  return {
    setPlacingEnabled,
    setStatus,
    setTips,
    setArRunning,
    setActiveModel,
  }
}
