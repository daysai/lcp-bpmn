# lcp-bpmn - BPMN 2.0 for the lcp

## Usage

```javascript
const process = '...';
const viewer = new BpmnJS({
  container: 'body'
});

try {
  const { warnings } = await viewer.importProcess(process);
  console.log('rendered');
} catch (err) {
  console.log('error rendering', err);
}
```

### Dynamic Attach/Detach

You may attach or detach the viewer dynamically to any element on the page, too:

```javascript
const viewer = new BpmnJS();

// attach it to some element
viewer.attachTo('#container');

// detach the panel
viewer.detach();
```
