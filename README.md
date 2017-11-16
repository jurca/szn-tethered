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
  <div class="tethered-content" data-szn-tethered-content>
    Any content
  </div>
  <!--
  The szn-tethered element must have exactly one child element, which will
  hold the tethered content. The child element must have the
  data-szn-tethered-content attribute set.
  -->
</szn-tethered>
```

Accompanying CSS:

```css
.tethered-content {
    /*
       It is recommended to set the dimensions as this element is positioned
       absolutely, but this is not necessary.
    */
    width: 200px;
    height: 60px;
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
