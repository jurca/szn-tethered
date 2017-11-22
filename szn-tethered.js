'use strict'
;(global => {
  const SznElements = global.SznElements = global.SznElements || {}

  /**
   * @typedef {{width: number, height: number}} ContentDimensions
   */

  /**
   * @typedef {{screenX: number, screenY: number, x: number, y: number, width: number, height: number}} TetherBounds
   */

  const HORIZONTAL_ALIGN = {
    LEFT: 'HORIZONTAL_ALIGN.LEFT',
    RIGHT: 'HORIZONTAL_ALIGN.RIGHT',
  }
  const VERTICAL_ALIGN = {
    TOP: 'VERTICAL_ALIGN.TOP',
    BOTTOM: 'VERTICAL_ALIGN.BOTTOM',
  }
  const MIN_BOTTOM_SPACE = 120 // px
  const OBSERVED_DOM_EVENTS = ['resize', 'scroll', 'wheel', 'touchmove']
  if (Object.freeze) {
    Object.freeze(HORIZONTAL_ALIGN)
    Object.freeze(VERTICAL_ALIGN)
  }

  let transformsSupported = null

  /**
   * The <code>szn-tethered</code> element is used to tether the on-screen position of content to another element
   * located elsewhere in the document (i.e. when such positioning is not feasible through CSS alone).
   */
  SznElements['szn-tethered'] = class SznTethered {
    constructor(rootElement) {
      if (transformsSupported === null) {
        transformsSupported = rootElement.style.hasOwnProperty('transform')
      }

      rootElement.HORIZONTAL_ALIGN = HORIZONTAL_ALIGN
      rootElement.VERTICAL_ALIGN = VERTICAL_ALIGN
      rootElement.setTether = tether => this.setTether(tether)
      rootElement.updatePosition = () => this.updatePosition()
      if (!rootElement.hasOwnProperty('horizontalAlign')) {
        Object.defineProperty(rootElement, 'horizontalAlign', {
          get: () => rootElement._broker.horizontalAlignment,
        })
      }
      if (!rootElement.hasOwnProperty('verticalAlignment')) {
        Object.defineProperty(rootElement, 'verticalAlignment', {
          get: () => rootElement._broker.verticalAlignment,
        })
      }
      if (!rootElement.hasOwnProperty('minBottomSpace')) {
        Object.defineProperty(rootElement, 'minBottomSpace', {
          get: () => rootElement._broker.minBottomSpace,
          set: value => {
            rootElement._broker.minBottomSpace = value
          },
        })
      }

      /**
       * The currently used horizontal alignment of the content to the tethering element.
       *
       * @type {string}
       */
      this.horizontalAlignment = HORIZONTAL_ALIGN.LEFT

      /**
       * The currently used vertical alignment of the content to the tethering element.
       *
       * @type {string}
       */
      this.verticalAlignment = VERTICAL_ALIGN.BOTTOM

      /**
       * The minimum number of pixels that must be available below the current tethering element in the viewport for
       * the content to be tethered to the bottom edge of the tethering element. If there is less space available, the
       * content will be tethered to the top edge of the tethering element.
       *
       * @type {number}
       */
      this.minBottomSpace = MIN_BOTTOM_SPACE

      /**
       * The szn-tethered element itself (the DOM element instance).
       */
      this._root = rootElement

      /**
       * The current tethering element.
       *
       * @type {?Element}
       */
      this._tether = null

      /**
       * Whether or not this szn-tethered element is currently mounted into the document.
       *
       * @type {boolean}
       */
      this._mounted = false

      /**
       * The previously set horizontal alignment of the tethered content to the tether, before updating the alignment
       * data attributes of the szn-tethered element.
       *
       * @type {string}
       */
      this._lastHorizontalAlignment = null

      /**
       * The previously set vertical alignment of the tethered content to the tether, before updating the alignment
       * data attributes of the szn-tethered element.
       *
       * @type {string}
       */
      this._lastVerticalAlignment = null

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

    /**
     * Sets the element to which this element will be tethered.
     *
     * @param {Element} tether The element to which this szn-tethered element should be tethered.
     */
    setTether(tether) {
      this._tether = tether
      this.updatePosition()
    }

    /**
     * Updates the location and alignment of the tethered content to the tethering element. The method may be invoked
     * manually if updating the location of the tethered content is needed for any reason.
     *
     * Note that this method is automatically invoked whenever any of the following events occur on the page: resize,
     * scroll, wheel, touchmove.
     *
     * This method has no effect if the szn-tethered element is unmounted or no tethering element is currently set.
     */
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
        this.horizontalAlignment = HORIZONTAL_ALIGN.RIGHT
      } else {
        this.horizontalAlignment = HORIZONTAL_ALIGN.LEFT
      }
      if (viewportHeight - (tetherBounds.screenY + tetherBounds.height) < this.minBottomSpace) {
        this.verticalAlignment = VERTICAL_ALIGN.TOP
      } else {
        this.verticalAlignment = VERTICAL_ALIGN.BOTTOM
      }

      updateAttributes(this)
      updatePosition(this, tetherBounds)
    }
  }

  /**
   * Updates the position of the szn-tethered element according to the current tethering alignment and the provided
   * bounds of the tethering element.
   *
   * @param {SznElements.SznTethered} instance The szn-tethered element instance.
   * @param {TetherBounds} tetherBounds The bounds (location and size) of the tethering element.
   */
  function updatePosition(instance, tetherBounds) {
    const x = tetherBounds.x + (instance.horizontalAlignment === HORIZONTAL_ALIGN.LEFT ? 0 : tetherBounds.width)
    const y = tetherBounds.y + (instance.verticalAlignment === VERTICAL_ALIGN.TOP ? 0 : tetherBounds.height)

    if (transformsSupported) {
      instance._root.style.transform = `translate(${x}px, ${y}px)`
    } else {
      instance._root.style.left = `${x}px`
      instance._root.style.top = `${y}px`
    }
  }

  /**
   * Updates the attributes on the szn-tethered element reporting the current alignment to the tethering element.
   *
   * @param {SznElements.SznTethered} instance The szn-tethered element instance.
   */
  function updateAttributes(instance) {
    if (instance.horizontalAlignment !== instance._lastHorizontalAlignment) {
      const horizontalAlignment = instance.horizontalAlignment === HORIZONTAL_ALIGN.LEFT ? 'left' : 'right'
      instance._root.setAttribute('data-horizontal-align', horizontalAlignment)
      instance._lastHorizontalAlignment = instance.horizontalAlignment
    }
    if (instance.verticalAlignment !== instance._lastVerticalAlignment) {
      const verticalAlignment = instance.verticalAlignment === VERTICAL_ALIGN.TOP ? 'top' : 'bottom'
      instance._root.setAttribute('data-vertical-align', verticalAlignment)
      instance._lastVerticalAlignment = instance.verticalAlignment
    }
  }

  /**
   * Calculates and returns both the on-screen and on-page location and dimensions of the provided tether element.
   *
   * @param {Element} tether The tethering element.
   * @return {TetherBounds} The on-screen and on-page location and dimensions of the element.
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
   * Returns the dimensions of the content of the provided szn-tethered element.
   *
   * @param {SznElements.SznTethered} instance The instance of the szn-tethered element.
   * @return {ContentDimensions} The dimensions of the tethered content.
   */
  function getContentDimensions(instance) {
    const contentElement = instance._root.firstElementChild
    if (!contentElement) {
      return {
        width: 0,
        height: 0,
      }
    }

    let width
    let height
    if (window.devicePixelRatio > 1) {
      // This is much less performant, so we use in only on HiDPi displays
      const bounds = contentElement.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
    } else {
      width = contentElement.scrollWidth
      height = contentElement.scrollHeight
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
