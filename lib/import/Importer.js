import {
  assign
} from 'min-dash';

import BpmnTreeWalker from './BpmnTreeWalker';
import {
  getExternalLabelMid,
  DEFAULT_LABEL_SIZE,
} from '../util/LabelUtil';

/**
 * Import the definitions into a diagram.
 *
 * Errors and warnings are reported through the specified callback.
 *
 * @param  {djs.Diagram} diagram
 * @param  {ModdleElement<Definitions>} definitions
 * @param  {ModdleElement<BPMNDiagram>} [bpmnDiagram] the diagram to be rendered
 * (if not provided, the first one will be rendered)
 *
 * Returns {Promise<ImportBPMNDiagramResult, ImportBPMNDiagramError>}
 */
export function importBpmnDiagram(diagram, definitions, bpmnDiagram) {

  var importer,
      eventBus,
      translate;

  var error,
      warnings = [];

  /**
   * Walk the diagram semantically, importing (=drawing)
   * all elements you encounter.
   *
   * @param {ModdleElement<Definitions>} definitions
   * @param {ModdleElement<BPMNDiagram>} bpmnDiagram
   */
  function render(definitions, bpmnDiagram) {

    var visitor = {

      root: function(element) {
        return importer.add(element);
      },

      element: function(element, parentShape) {
        return importer.add(element, parentShape);
      },

      error: function(message, context) {
        warnings.push({ message: message, context: context });
      }
    };

    var walker = new BpmnTreeWalker(visitor, translate);

    // traverse BPMN 2.0 document model,
    // starting at definitions
    walker.handleDefinitions(definitions, bpmnDiagram);
  }

  return new Promise(function(resolve, reject) {
    try {
      importer = diagram.get('bpmnImporter');
      eventBus = diagram.get('eventBus');
      translate = diagram.get('translate');

      eventBus.fire('import.render.start', { definitions: definitions });

      render(definitions, bpmnDiagram);

      eventBus.fire('import.render.complete', {
        error: error,
        warnings: warnings
      });

      return resolve({ warnings: warnings });
    } catch (e) {

      e.warnings = warnings;
      return reject(e);
    }
  });
}

const BPMS_SHAPE = {
  Process: 'bpmn:Process',
  StartNoneEvent: 'bpmn:StartEvent',
  EndNoneEvent: 'bpmn:EndEvent',
  UserTask: 'bpmn:UserTask',
  ExclusiveGateway: 'bpmn:ExclusiveGateway',
  SequenceFlow: 'bpmn:SequenceFlow',
};

function getExternalLabelBounds(element) {
  const mid = getExternalLabelMid(element);
  const size = DEFAULT_LABEL_SIZE;
  return assign({
    x: mid.x - size.width / 2,
    y: mid.y - size.height / 2
  }, size);
}

function isLabelExternal(elementType) {
  return ['bpmn:StartEvent', 'bpmn:EndEvent', 'bpmn:ExclusiveGateway', 'bpmn:SequenceFlow'].includes(elementType);
}

function addLabel(diagram, element) {
  const canvas = diagram.get('canvas');
  const elementFactory = diagram.get('elementFactory');
  const textRenderer = diagram.get('textRenderer');

  const { name, id, businessObject } = element;
  let bounds = getExternalLabelBounds(element);
  if (name) {
    bounds = textRenderer.getExternalLabelBounds(bounds, name);
  }

  const label = elementFactory.createLabel({
    id: id + '_label',
    labelTarget: element,
    type: 'label',
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: Math.round(bounds.width),
    height: Math.round(bounds.height),
    hidden: false,
    businessObject,
  });
  return canvas.addShape(label, element.parent);
}

export function importBpmnProcess(diagram, process) {
  return new Promise(function(resolve, reject) {
    try {
      const eventBus = diagram.get('eventBus');
      const elementFactory = diagram.get('elementFactory');
      const canvas = diagram.get('canvas');
      const bpmnFactory = diagram.get('bpmnFactory');

      let { id, name, childShapes = '[]' } = process;
      childShapes = JSON.parse(childShapes);

      const elements = [];

      // rootElement
      const rootElement = elementFactory.createRoot({
        id,
        name,
        type: BPMS_SHAPE.Process,
      });
      canvas.setRootElement(rootElement);
      eventBus.fire('bpmnElement.added', { element: rootElement });
      elements.push(rootElement);

      const flows = [];
      childShapes.forEach((cShape) => {
        if (!cShape)
          return;
        const {
          id,
          type,
          name,
          bounds,
          ...others
        } = cShape;

        if (type === 'SequenceFlow') {
          flows.push(cShape);
        } else {

          // shapeElement
          const businessObject = bpmnFactory.create(BPMS_SHAPE[type], { name });
          const element = elementFactory.createShape({
            ...others,
            id,
            type: BPMS_SHAPE[type],
            x: Math.round(bounds.x),
            y: Math.round(bounds.y),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
            hidden: false,
            collapsed: false,
            isFrame: false,
            businessObject,
          });
          canvas.addShape(element, rootElement);

          // External Label
          if (isLabelExternal(BPMS_SHAPE[type]) && name) {
            addLabel(diagram, element);
          }
          eventBus.fire('bpmnElement.added', { element });
          elements.push(element);
        }
      });

      flows.forEach((flow) => {

        // flowElement
        const {
          id,
          type,
          name,
          waypoint,
          sourceRefId,
          targetRefId,
          ...others
        } = flow;
        const waypoints = waypoint.map((p) => ({
          x: Math.round(p.x),
          y: Math.round(p.y),
        }));
        let source;
        let target;
        elements.forEach((diElement) => {
          const { id } = diElement;
          if (id === sourceRefId) {
            source = diElement;
          }
          if (id === targetRefId) {
            target = diElement;
          }
        });
        const businessObject = bpmnFactory.create(BPMS_SHAPE[type], { name });
        const element = elementFactory.createConnection({
          ...others,
          id,
          type: BPMS_SHAPE[type],
          source,
          target,
          waypoints,
          hidden: false,
          businessObject,
        });
        canvas.addConnection(element, rootElement, 0);

        // External Label
        if (isLabelExternal(BPMS_SHAPE[type]) && name) {
          addLabel(diagram, element);
        }
        eventBus.fire('bpmnElement.added', { element });
        elements.push(element);
      });
      return resolve(elements);
    } catch (e) {
      return reject(e);
    }
  });
}
