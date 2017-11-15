# szn-tethered

Helper element for visually attaching content to another element. 

## Usage

This element is not meant to be used on its own, it is mean to be helper
element used by other `szn-*` elements.

Example markup (usually constructed by JavaScript):

```html
<link rel="stylesheet" href="szn-tethered.css">

<div id="tether">
    This is the element to which the content should be tethered.
</div>
<szn-tethered id="tethered">
  <div class="tethered-content">
    Any content
  </div>
</szn-tethered>
```

Accompanying CSS:

```css
.tethered-content {
    position: absolute;
    left: 0;
    top: 0;

    width: 200px;
    height: 60px;
}

[data-horizontal-align='right'] .tethered-content {
    left: auto;
    right: 0;
}

[data-vertical-align='top'] .tethered-content {
    top: auto;
    bottom: 0;
}
```

JavaScript to wire everything up:

```javascript
const tether = document.getElementById('tether')
const sznTethered = document.getElementById('tethered')
SznElements.awaitElementReady(sznTethered, () => {
  sznTethered.setTether(tether)
})
```
