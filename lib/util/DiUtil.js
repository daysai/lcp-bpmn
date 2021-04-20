import {
  is,
  getBusinessObject
} from './ModelUtil';

import {
  forEach
} from 'min-dash';


export function isExpanded(element) {

  if (is(element, 'bpmn:CallActivity')) {
    return false;
  }

  if (is(element, 'bpmn:Participant')) {
    return !!getBusinessObject(element).processRef;
  }

  return true;
}

export function isInterrupting(element) {
  return element && getBusinessObject(element).isInterrupting !== false;
}

export function hasEventDefinition(element, eventType) {
  var bo = getBusinessObject(element),
      hasEventDefinition = false;

  if (bo.eventDefinitions) {
    forEach(bo.eventDefinitions, function(event) {
      if (is(event, eventType)) {
        hasEventDefinition = true;
      }
    });
  }

  return hasEventDefinition;
}
