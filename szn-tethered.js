'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  /**
   * @typedef {{width: number, height: number}} ContentDimensions
   */

  /**
   * @typedef {{screenX: number, screenY: number, x: number, y: number, width: number, height: number}} TetherBounds
   */

  const HORIZONTAL_POSITION = {
    LEFT: 'HORIZONTAL_POSITION.LEFT',
    RIGHT: 'HORIZONTAL_POSITION.RIGHT',
  }
  const VERTICAL_POSITION = {
    TOP: 'VERTICAL_POSITION.TOP',
    BOTTOM: 'VERTICAL_POSITION.BOTTOM',
  }
  const MIN_BOTTOM_SPACE = 120 // px
  const OBSERVED_DOM_EVENTS = ['resize', 'scroll', 'touchmove']
  if (Object.freeze) {
    Object.freeze(HORIZONTAL_POSITION)
    Object.freeze(VERTICAL_POSITION)
  }

  let transformsSupported = null

  SznElements['szn-tethered'] = class SznTethered {
    constructor(rootElement) {
      if (transformsSupported === null) {
        transformsSupported = rootElement.style.hasOwnProperty('transform')
      }

      rootElement.HORIZONTAL_POSITION = HORIZONTAL_POSITION
      rootElement.updatePosition = () => this.updatePosition()

      this.horizontalPosition = HORIZONTAL_POSITION.LEFT
      this.verticalPosition = VERTICAL_POSITION.BOTTOM
      this._root = rootElement
      this._tether = null
      this._mounted = false
      Object.defineProperty(rootElement, 'horizontalPosition', {
        get: () => {
          return this.horizontalPosition
        },
      })
      Object.defineProperty(rootElement, 'verticalPosition', {
        get: () => {
          return this.verticalPosition
        },
      })
      this._lastHorizontalPosition = null
      this._lastVerticalPosition = null

      updateAttributes(this)
    }

    onMount() {
      for (const eventType of OBSERVED_DOM_EVENTS) {
        addEventListener(eventType, this._root.updatePosition)
      }
      this._mounted = true
      this.updatePosition()
    }

    onUnmount() {
      for (const eventType of OBSERVED_DOM_EVENTS) {
        removeEventListener(eventType, this._root.updatePosition)
      }
      this._mounted = false
    }

    setTether(tether) {
      this._tether = tether
    }

    updatePosition() {
      if (!this._mounted || !this._tether) {
        return
      }

      const tetherBounds = getTetherBounds(this._tether)
      const contentSize = getContentDimensions(this)
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (
        tetherBounds.screenX + contentSize.width > viewportWidth &&
        tetherBounds.screenX + tetherBounds.width - contentSize.width >= 0
      ) {
        this.horizontalPosition = HORIZONTAL_POSITION.RIGHT
      } else {
        this.horizontalPosition = HORIZONTAL_POSITION.LEFT
      }
      if (viewportHeight - tetherBounds.screenY + tetherBounds.height + 1 + contentSize.height < MIN_BOTTOM_SPACE) {
        this.verticalPosition = VERTICAL_POSITION.TOP
      } else {
        this.verticalPosition = VERTICAL_POSITION.BOTTOM
      }

      updateAttributes(this)
      updatePosition(this, tetherBounds)
    }
  }

  /**
   * @param {SznElements.SznTethered} instance
   * @param {TetherBounds} tetherBounds
   */
  function updatePosition(instance, tetherBounds) {
    const x = tetherBounds.x + (instance.horizontalPosition === HORIZONTAL_POSITION.LEFT ? 0 : tetherBounds.width)
    const y = tetherBounds.y + (instance.verticalPosition === VERTICAL_POSITION.TOP ? -1 : tetherBounds.height + 1)

    if (transformsSupported) {
      this._root.style.transform = `translate(${x}px, ${y}px)`
    } else {
      this._root.style.left = `${x}px`
      this._root.style.top = `${y}px`
    }
  }

  /**
   * @param {SznElements.SznTethered} instance
   */
  function updateAttributes(instance) {
    if (instance.horizontalPosition !== instance._lastHorizontalPosition) {
      const horizontalAlignment = instance._lastHorizontalPosition === HORIZONTAL_POSITION.LEFT ? 'left' : 'right'
      instance._root.setAttribute('data-horizontal-align', horizontalAlignment)
      instance._lastHorizontalPosition = instance.horizontalPosition
    }
    if (instance.verticalPosition !== instance._lastVerticalPosition) {
      const verticalAlignment = instance._lastVerticalPosition === VERTICAL_POSITION.TOP ? 'top' : 'bottom'
      instance._root.setAttribute('data-vertical-align', verticalAlignment)
      instance._lastVerticalPosition = instance.verticalPosition
    }
  }

  /**
   * @param {Element} tether
   * @returns {TetherBounds}
   */
  function getTetherBounds(tether) {
    const bounds = tether.getBoundingClientRect()
    const width = bounds.width
    const height = bounds.height

    let x = 0
    let y = 0
    let tetherOffsetContainer = tether
    while (tetherOffsetContainer) {
      x += tetherOffsetContainer.offsetLeft
      y += tetherOffsetContainer.offsetTop
      tetherOffsetContainer = tetherOffsetContainer.offsetParent
    }

    return {
      screenX: bounds.left,
      screenY: bounds.top,
      x,
      y,
      width,
      height,
    }
  }

  /**
   * @param {SznElements.SznTethered} instance
   * @return {ContentDimensions}
   */
  function getContentDimensions(instance) {
    let width
    let height
    if (window.devicePixelRatio > 1) {
      // This is much less performant, so we use in only on HiDPi displays
      const bounds = instance._root.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
    } else {
      width = instance._root.scrollWidth
      height = instance._root.scrollHeight
    }

    return {
      width,
      height,
    }
  }

  if (SznElements.init) {
    SznElements.init()
  }
})(self)
