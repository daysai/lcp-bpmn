import {
  map,
  assign,
  pick
} from 'min-dash';

import { v4 as uuidv4 } from 'uuid';

import { isAny } from './util/ModelingUtil';

const BPMN_ELEMENTS = [
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:UserTask',
  'bpmn:ExclusiveGateway',
  'bpmn:SequenceFlow',
];

function getBpmnProp(key) {
  if (!window.__bpmn__) return null;
  return window.__bpmn__[key];
}

function checkNameAvailable(name) {
  if (!name) return false;

  const elementNames = getBpmnProp('elementNames');
  if (!elementNames || elementNames.length === 0) return true;
  return !elementNames.includes(name);
}

export default function BpmnFactory(moddle) {
  this._model = moddle;
}

BpmnFactory.$inject = [ 'moddle' ];


BpmnFactory.prototype._needsId = function(element) {
  return isAny(element, [
    'bpmn:RootElement',
    'bpmn:FlowElement',
    'bpmn:MessageFlow',
    'bpmn:DataAssociation',
    'bpmn:Artifact',
    'bpmn:Participant',
    'bpmn:Lane',
    'bpmn:LaneSet',
    'bpmn:Process',
    'bpmn:Collaboration',
    'bpmndi:BPMNShape',
    'bpmndi:BPMNEdge',
    'bpmndi:BPMNDiagram',
    'bpmndi:BPMNPlane',
    'bpmn:Property',
    'bpmn:CategoryValue'
  ]);
};

BpmnFactory.prototype._ensureId = function(element) {

  // generate semantic ids for elements
  if (!element.id && this._needsId(element)) {
    element.id = uuidv4().replace(/-/g, '');
  }
};

BpmnFactory.prototype._needsName = function(element) {
  return this._needsId(element) && BPMN_ELEMENTS.includes(element.$type);
};

BpmnFactory.prototype._ensureName = function(element) {

  // generate semantic names for elements
  if (!element.name && this._needsName(element)) {
    const defaultName = element.$type.replace('bpmn:', '');
    let name = defaultName;
    if (!checkNameAvailable(name)) {
      let i = 0;
      let available = false;
      while (!available) {
        i++;
        name = `${defaultName}${i}`;
        if (checkNameAvailable(name)) {
          available = true;
        }
      }
    }
    element.name = name;
  }
};


BpmnFactory.prototype.create = function(type, attrs) {
  var element = this._model.create(type, attrs || {});

  this._ensureId(element);
  this._ensureName(element);

  return element;
};


BpmnFactory.prototype.createDiLabel = function() {
  return this.create('bpmndi:BPMNLabel', {
    bounds: this.createDiBounds()
  });
};


BpmnFactory.prototype.createDiShape = function(semantic, bounds, attrs) {
  return this.create('bpmndi:BPMNShape', assign({
    bpmnElement: semantic,
    bounds: this.createDiBounds(bounds)
  }, attrs));
};


BpmnFactory.prototype.createDiBounds = function(bounds) {
  return this.create('dc:Bounds', bounds);
};


BpmnFactory.prototype.createDiWaypoints = function(waypoints) {
  var self = this;

  return map(waypoints, function(pos) {
    return self.createDiWaypoint(pos);
  });
};

BpmnFactory.prototype.createDiWaypoint = function(point) {
  return this.create('dc:Point', pick(point, [ 'x', 'y' ]));
};


BpmnFactory.prototype.createDiEdge = function(semantic, waypoints, attrs) {
  return this.create('bpmndi:BPMNEdge', assign({
    bpmnElement: semantic
  }, attrs));
};

BpmnFactory.prototype.createDiPlane = function(semantic) {
  return this.create('bpmndi:BPMNPlane', {
    bpmnElement: semantic
  });
};