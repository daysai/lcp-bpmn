import inherits from 'inherits';

import {
  assign
} from 'min-dash';

import BaseLayouter from 'diagram-js/lib/layout/BaseLayouter';

import {
  repairConnection,
  withoutRedundantPoints
} from 'diagram-js/lib/layout/ManhattanLayout';

import {
  getMid,
  getOrientation
} from 'diagram-js/lib/layout/LayoutUtil';

import { is } from '../../util/ModelUtil';

export default function BpmnLayouter() {}

inherits(BpmnLayouter, BaseLayouter);


BpmnLayouter.prototype.layoutConnection = function(connection, hints) {
  if (!hints) {
    hints = {};
  }

  var source = hints.source || connection.source,
      target = hints.target || connection.target,
      waypoints = hints.waypoints || connection.waypoints,
      connectionStart = hints.connectionStart,
      connectionEnd = hints.connectionEnd;

  var manhattanOptions,
      updatedWaypoints;

  if (!connectionStart) {
    connectionStart = getConnectionDocking(waypoints && waypoints[ 0 ], source);
  }

  if (!connectionEnd) {
    connectionEnd = getConnectionDocking(waypoints && waypoints[ waypoints.length - 1 ], target);
  }

  if (is(connection, 'bpmn:MessageFlow')) {
    manhattanOptions = getMessageFlowManhattanOptions(source, target);
  } else if (is(connection, 'bpmn:SequenceFlow') || isCompensationAssociation(source, target)) {

    // layout all connection between flow elements h:h, except for
    // (1) outgoing of boundary events -> layout based on attach orientation and target orientation
    // (2) incoming/outgoing of gateways -> v:h for outgoing, h:v for incoming
    // (3) loops
    if (source === target) {
      manhattanOptions = {
        preferredLayouts: getLoopPreferredLayout(source, connection)
      };
    } else if (is(source, 'bpmn:Gateway')) {
      manhattanOptions = {
        preferredLayouts: [ 'v:h' ]
      };
    } else if (is(target, 'bpmn:Gateway')) {
      manhattanOptions = {
        preferredLayouts: [ 'h:v' ]
      };
    } else {
      manhattanOptions = {
        preferredLayouts: [ 'h:h' ]
      };
    }
  }

  if (manhattanOptions) {
    manhattanOptions = assign(manhattanOptions, hints);

    updatedWaypoints = withoutRedundantPoints(repairConnection(
      source,
      target,
      connectionStart,
      connectionEnd,
      waypoints,
      manhattanOptions
    ));
  }

  return updatedWaypoints || [ connectionStart, connectionEnd ];
};


// helpers //////////
function getMessageFlowManhattanOptions(source, target) {
  return {
    preferredLayouts: [ 'straight', 'v:v' ],
    preserveDocking: getMessageFlowPreserveDocking(source, target)
  };
}

function getMessageFlowPreserveDocking(source, target) {
  if (is(target, 'bpmn:Event')) {
    return 'target';
  }

  if (is(source, 'bpmn:Event')) {
    return 'source';
  }

  return null;
}

function getConnectionDocking(point, shape) {
  return point ? (point.original || point) : getMid(shape);
}

function isCompensationAssociation(source, target) {
  return is(target, 'bpmn:Activity') &&
    target.businessObject.isForCompensation;
}

function getLoopPreferredLayout(source, connection) {
  var waypoints = connection.waypoints;

  var orientation = waypoints && waypoints.length && getOrientation(waypoints[0], source);

  if (orientation === 'top') {
    return [ 't:r' ];
  } else if (orientation === 'right') {
    return [ 'r:b' ];
  } else if (orientation === 'left') {
    return [ 'l:t' ];
  }

  return [ 'b:l' ];
}
