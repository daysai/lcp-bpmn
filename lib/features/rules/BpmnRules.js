import {
  every,
  find,
  forEach,
} from 'min-dash';

import inherits from 'inherits';

import {
  is,
  getBusinessObject
} from '../../util/ModelUtil';

import {
  getParent,
  isAny
} from '../modeling/util/ModelingUtil';

import {
  isLabel
} from '../../util/LabelUtil';

import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';


/**
 * BPMN specific modeling rule
 */
export default function BpmnRules(eventBus) {
  RuleProvider.call(this, eventBus);
}

inherits(BpmnRules, RuleProvider);

BpmnRules.$inject = [ 'eventBus' ];

BpmnRules.prototype.init = function() {

  this.addRule('connection.start', function(context) {
    var source = context.source;

    return canStartConnection(source);
  });

  this.addRule('connection.create', function(context) {
    var source = context.source,
        target = context.target,
        hints = context.hints || {},
        targetParent = hints.targetParent,
        targetAttach = hints.targetAttach;

    // don't allow incoming connections on
    // newly created boundary events
    // to boundary events
    if (targetAttach) {
      return false;
    }

    // temporarily set target parent for scoping
    // checks to work
    if (targetParent) {
      target.parent = targetParent;
    }

    try {
      return canConnect(source, target);
    } finally {

      // unset temporary target parent
      if (targetParent) {
        target.parent = null;
      }
    }
  });

  this.addRule('connection.reconnect', function(context) {

    var connection = context.connection,
        source = context.source,
        target = context.target;

    return canConnect(source, target, connection);
  });

  this.addRule('connection.updateWaypoints', function(context) {
    return {
      type: context.connection.type
    };
  });

  this.addRule('shape.resize', function(context) {

    var shape = context.shape,
        newBounds = context.newBounds;

    return canResize(shape, newBounds);
  });

  this.addRule('elements.create', function(context) {
    var elements = context.elements,
        position = context.position,
        target = context.target;

    return every(elements, function(element) {
      if (isConnection(element)) {
        return canConnect(element.source, element.target, element);
      }

      if (element.host) {
        return canAttach(element, element.host, null, position);
      }

      return canCreate(element, target, null, position);
    });
  });

  this.addRule('elements.move', function(context) {

    var target = context.target,
        shapes = context.shapes,
        position = context.position;

    return canAttach(shapes, target, null, position) ||
           canReplace(shapes, target, position) ||
           canMove(shapes, target, position) ||
           canInsert(shapes, target, position);
  });

  this.addRule('shape.create', function(context) {
    return canCreate(
      context.shape,
      context.target,
      context.source,
      context.position
    );
  });

  this.addRule('shape.attach', function(context) {

    return canAttach(
      context.shape,
      context.target,
      null,
      context.position
    );
  });

  this.addRule('element.copy', function(context) {
    var element = context.element,
        elements = context.elements;

    return canCopy(elements, element);
  });
};

BpmnRules.prototype.canConnectMessageFlow = canConnectMessageFlow;

BpmnRules.prototype.canConnectSequenceFlow = canConnectSequenceFlow;

BpmnRules.prototype.canConnectDataAssociation = canConnectDataAssociation;

BpmnRules.prototype.canConnectAssociation = canConnectAssociation;

BpmnRules.prototype.canMove = canMove;

BpmnRules.prototype.canAttach = canAttach;

BpmnRules.prototype.canReplace = canReplace;

BpmnRules.prototype.canDrop = canDrop;

BpmnRules.prototype.canInsert = canInsert;

BpmnRules.prototype.canCreate = canCreate;

BpmnRules.prototype.canConnect = canConnect;

BpmnRules.prototype.canResize = canResize;

BpmnRules.prototype.canCopy = canCopy;

/**
 * Utility functions for rule checking
 */

/**
 * Checks if given element can be used for starting connection.
 *
 * @param  {Element} source
 * @return {boolean}
 */
function canStartConnection(element) {
  if (nonExistingOrLabel(element)) {
    return null;
  }

  return isAny(element, [
    'bpmn:FlowNode',
    'bpmn:TextAnnotation'
  ]);
}

function nonExistingOrLabel(element) {
  return !element || isLabel(element);
}

function isSame(a, b) {
  return a === b;
}

function getOrganizationalParent(element) {

  do {
    if (is(element, 'bpmn:Process')) {
      return getBusinessObject(element);
    }
  } while ((element = element.parent));

}

function isTextAnnotation(element) {
  return is(element, 'bpmn:TextAnnotation');
}

function isForCompensation(e) {
  return getBusinessObject(e).isForCompensation;
}

function isSameOrganization(a, b) {
  var parentA = getOrganizationalParent(a),
      parentB = getOrganizationalParent(b);

  return parentA === parentB;
}

function isMessageFlowSource(element) {
  return (
    is(element, 'bpmn:InteractionNode') &&
    (
      !is(element, 'bpmn:Event') || (
        is(element, 'bpmn:ThrowEvent') &&
        hasEventDefinitionOrNone(element, 'bpmn:MessageEventDefinition')
      )
    )
  );
}

function isMessageFlowTarget(element) {
  return (
    is(element, 'bpmn:InteractionNode') &&
    !isForCompensation(element) && (
      !is(element, 'bpmn:Event') || (
        is(element, 'bpmn:CatchEvent') &&
        hasEventDefinitionOrNone(element, 'bpmn:MessageEventDefinition')
      )
    )
  );
}

function getScopeParent(element) {

  var parent = element;

  while ((parent = parent.parent)) {

    if (is(parent, 'bpmn:FlowElementsContainer')) {
      return getBusinessObject(parent);
    }
  }

  return null;
}

function isSameScope(a, b) {
  var scopeParentA = getScopeParent(a),
      scopeParentB = getScopeParent(b);

  return scopeParentA === scopeParentB;
}

function hasEventDefinition(element, eventDefinition) {
  var bo = getBusinessObject(element);

  return !!find(bo.eventDefinitions || [], function(definition) {
    return is(definition, eventDefinition);
  });
}

function hasEventDefinitionOrNone(element, eventDefinition) {
  var bo = getBusinessObject(element);

  return (bo.eventDefinitions || []).every(function(definition) {
    return is(definition, eventDefinition);
  });
}

function isSequenceFlowSource(element) {
  return (
    is(element, 'bpmn:FlowNode') &&
    !is(element, 'bpmn:EndEvent') &&
    !(is(element, 'bpmn:IntermediateThrowEvent') &&
      hasEventDefinition(element, 'bpmn:LinkEventDefinition')
    ) &&
    !isForCompensation(element)
  );
}

function isSequenceFlowTarget(element) {
  return (
    is(element, 'bpmn:FlowNode') &&
    !is(element, 'bpmn:StartEvent') &&
    !isForCompensation(element)
  );
}

function isConnection(element) {
  return element.waypoints;
}

function getParents(element) {

  var parents = [];

  while (element) {
    element = element.parent;

    if (element) {
      parents.push(element);
    }
  }

  return parents;
}

function isParent(possibleParent, element) {
  var allParents = getParents(element);
  return allParents.indexOf(possibleParent) !== -1;
}

function canConnect(source, target, connection) {

  if (nonExistingOrLabel(source) || nonExistingOrLabel(target)) {
    return null;
  }

  if (!is(connection, 'bpmn:DataAssociation')) {

    if (canConnectMessageFlow(source, target)) {
      return { type: 'bpmn:MessageFlow' };
    }

    if (canConnectSequenceFlow(source, target)) {
      return { type: 'bpmn:SequenceFlow' };
    }
  }

  var connectDataAssociation = canConnectDataAssociation(source, target);

  if (connectDataAssociation) {
    return connectDataAssociation;
  }

  if (canConnectAssociation(source, target)) {

    return {
      type: 'bpmn:Association'
    };
  }

  return false;
}

/**
 * Can an element be dropped into the target element
 *
 * @return {boolean}
 */
function canDrop(element, target, position) {

  // can move labels and groups everywhere
  if (isLabel(element) || is(target, 'bpmn:Process')) {
    return true;
  }

  // drop flow elements onto flow element containers
  if (is(element, 'bpmn:FlowElement')) {
    return false;
  }

  if (is(element, 'bpmn:MessageFlow')) {
    return is(target, 'bpmn:Collaboration')
      || element.source.parent == target
      || element.target.parent == target;
  }

  return false;
}

function canAttach(elements, target, source, position) {

  if (!Array.isArray(elements)) {
    elements = [ elements ];
  }

  // only (re-)attach one element at a time
  if (elements.length !== 1) {
    return false;
  }

  var element = elements[0];

  // do not attach labels
  if (isLabel(element)) {
    return false;
  }


  // only allow drop on non compensation activities
  if (!is(target, 'bpmn:Activity') || isForCompensation(target)) {
    return false;
  }

  // only attach to subprocess border
  if (position) {
    return false;
  }

  return 'attach';
}


/**
 * Defines how to replace elements for a given target.
 *
 * Returns an array containing all elements which will be replaced.
 *
 * @example
 *
 *  [{ id: 'IntermediateEvent_2',
 *     type: 'bpmn:StartEvent'
 *   },
 *   { id: 'IntermediateEvent_5',
 *     type: 'bpmn:EndEvent'
 *   }]
 *
 * @param  {Array} elements
 * @param  {Object} target
 *
 * @return {Object} an object containing all elements which have to be replaced
 */
function canReplace(elements, target, position) {

  if (!target) {
    return false;
  }

  var canExecute = {
    replacements: []
  };

  forEach(elements, function(element) {

    if (!is(target, 'bpmn:Transaction')) {
      if (hasEventDefinition(element, 'bpmn:CancelEventDefinition') &&
          element.type !== 'label') {

        if (is(element, 'bpmn:EndEvent') && canDrop(element, target)) {
          canExecute.replacements.push({
            oldElementId: element.id,
            newElementType: 'bpmn:EndEvent'
          });
        }
      }
    }
  });

  return canExecute.replacements.length ? canExecute : false;
}

function canMove(elements, target) {

  // allow default move check to start move operation
  if (!target) {
    return true;
  }

  return elements.every(function(element) {
    return canDrop(element, target);
  });
}

function canCreate(shape, target, source, position) {

  if (!target) {
    return false;
  }

  if (isLabel(shape)) {
    return true;
  }

  if (isSame(source, target)) {
    return false;
  }

  // ensure we do not drop the element
  // into source
  if (source && isParent(source, target)) {
    return false;
  }

  return canDrop(shape, target, position) || canInsert(shape, target, position);
}

function canResize(shape, newBounds) {
  if (is(shape, 'bpmn:Lane')) {
    return !newBounds || (newBounds.width >= 130 && newBounds.height >= 60);
  }

  if (is(shape, 'bpmn:Participant')) {
    return !newBounds || (newBounds.width >= 250 && newBounds.height >= 50);
  }

  if (isTextAnnotation(shape)) {
    return true;
  }

  return false;
}

/**
 * Check, whether one side of the relationship
 * is a text annotation.
 */
function isOneTextAnnotation(source, target) {

  var sourceTextAnnotation = isTextAnnotation(source),
      targetTextAnnotation = isTextAnnotation(target);

  return (
    (sourceTextAnnotation || targetTextAnnotation) &&
    (sourceTextAnnotation !== targetTextAnnotation)
  );
}


function canConnectAssociation(source, target) {

  // do not connect connections
  if (isConnection(source) || isConnection(target)) {
    return false;
  }

  // don't connect parent <-> child
  if (isParent(target, source) || isParent(source, target)) {
    return false;
  }

  // allow connection of associations between <!TextAnnotation> and <TextAnnotation>
  if (isOneTextAnnotation(source, target)) {
    return true;
  }

  // can connect associations where we can connect
  // data associations, too (!)
  return !!canConnectDataAssociation(source, target);
}

function canConnectMessageFlow(source, target) {

  // during connect user might move mouse out of canvas
  if (getRootElement(source) && !getRootElement(target)) {
    return false;
  }

  return (
    isMessageFlowSource(source) &&
    isMessageFlowTarget(target) &&
    !isSameOrganization(source, target)
  );
}

function canConnectSequenceFlow(source, target) {

  return isSequenceFlowSource(source) &&
         isSequenceFlowTarget(target) &&
         isSameScope(source, target);
}


function canConnectDataAssociation(source, target) {
  return false;
}

function canInsert(shape, flow, position) {

  if (!flow) {
    return false;
  }

  if (Array.isArray(shape)) {
    if (shape.length !== 1) {
      return false;
    }

    shape = shape[0];
  }

  if (flow.source === shape ||
      flow.target === shape) {
    return false;
  }

  // return true if we can drop on the
  // underlying flow parent
  //
  // at this point we are not really able to talk
  // about connection rules (yet)

  return (
    isAny(flow, [ 'bpmn:SequenceFlow', 'bpmn:MessageFlow' ]) &&
    !isLabel(flow) &&
    is(shape, 'bpmn:FlowNode') &&
    canDrop(shape, flow.parent, position));
}

function canCopy(elements, element) {
  if (isLabel(element)) {
    return true;
  }

  return true;
}

function getRootElement(element) {
  return getParent(element, 'bpmn:Process') || getParent(element, 'bpmn:Collaboration');
}
