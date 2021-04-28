import {
  assign,
  forEach,
  isArray
} from 'min-dash';

import {
  is
} from '../../util/ModelUtil';

import {
  isAny
} from '../modeling/util/ModelingUtil';

import {
  hasPrimaryModifier
} from 'diagram-js/lib/util/Mouse';


/**
 * A provider for BPMN 2.0 elements context pad
 */
export default function ContextPadProvider(
    config, injector, eventBus,
    contextPad, modeling, elementFactory,
    connect, create,
    canvas, rules, translate) {

  config = config || {};

  contextPad.registerProvider(this);

  this._contextPad = contextPad;

  this._modeling = modeling;

  this._elementFactory = elementFactory;
  this._connect = connect;
  this._create = create;
  this._canvas = canvas;
  this._rules = rules;
  this._translate = translate;

  if (config.autoPlace !== false) {
    this._autoPlace = injector.get('autoPlace', false);
  }

  eventBus.on('create.end', 250, function(event) {
    var context = event.context,
        shape = context.shape;

    if (!hasPrimaryModifier(event) || !contextPad.isOpen(shape)) {
      return;
    }

    var entries = contextPad.getEntries(shape);

    if (entries.replace) {
      entries.replace.action.click(event, shape);
    }
  });
}

ContextPadProvider.$inject = [
  'config.contextPad',
  'injector',
  'eventBus',
  'contextPad',
  'modeling',
  'elementFactory',
  'connect',
  'create',
  'canvas',
  'rules',
  'translate'
];


ContextPadProvider.prototype.getContextPadEntries = function(element) {

  var modeling = this._modeling,

      elementFactory = this._elementFactory,
      connect = this._connect,
      create = this._create,
      rules = this._rules,
      autoPlace = this._autoPlace,
      translate = this._translate;

  var actions = {};

  if (element.type === 'label') {
    return actions;
  }

  var businessObject = element.businessObject;

  function startConnect(event, element) {
    connect.start(event, element);
  }


  /**
   * Create an append action
   *
   * @param {string} type
   * @param {string} className
   * @param {string} [title]
   * @param {Object} [options]
   *
   * @return {Object} descriptor
   */
  function appendAction(type, className, title, options) {

    if (typeof title !== 'string') {
      options = title;
      title = translate('Append {type}', { type: type.replace(/^bpmn:/, '') });
    }

    function appendStart(event, element) {

      var shape = elementFactory.createShape(assign({ type: type }, options));
      create.start(event, shape, {
        source: element
      });
    }


    var append = autoPlace ? function(event, element) {
      var shape = elementFactory.createShape(assign({ type: type }, options));

      autoPlace.append(element, shape);
    } : appendStart;


    return {
      group: 'model',
      className: className,
      title: title,
      action: {
        dragstart: appendStart,
        click: append
      }
    };
  }

  if (is(businessObject, 'bpmn:FlowNode')) {

    if (is(businessObject, 'bpmn:EventBasedGateway')) {

      assign(actions, {
        'append.receive-task': appendAction(
          'bpmn:ReceiveTask',
          'bpmn-icon-receive-task',
          translate('Append ReceiveTask')
        )
      });
    } else

    if (!is(businessObject, 'bpmn:EndEvent') &&
        !businessObject.isForCompensation &&
        !isEventType(businessObject, 'bpmn:IntermediateThrowEvent', 'bpmn:LinkEventDefinition')) {

      assign(actions, {
        'append.append-user-task': appendAction(
          'bpmn:UserTask',
          'bpmn-icon-user-task',
          translate('Append User Task')
        ),
        'append.exclusive-gateway': appendAction(
          'bpmn:ExclusiveGateway',
          'bpmn-icon-exclusive-gateway',
          translate('Append Exclusive Gateway')
        ),
        'append.end-event': appendAction(
          'bpmn:EndEvent',
          'bpmn-icon-end-event',
          translate('Append EndEvent')
        ),
      });
    }
  }

  if (
    isAny(businessObject, [
      'bpmn:FlowNode',
      'bpmn:InteractionNode',
    ])
  ) {
    assign(actions, {
      'connect': {
        group: 'connect',
        className: 'bpmn-icon-connect',
        title: translate(
          'Connect using ' +
            (businessObject.isForCompensation
              ? ''
              : 'Sequence/MessageFlow or ') +
            'Association'
        ),
        action: {
          click: startConnect,
          dragstart: startConnect,
        },
      },
    });
  }

  if (is(businessObject, 'bpmn:TextAnnotation')) {
    assign(actions, {
      'connect': {
        group: 'connect',
        className: 'bpmn-icon-connect',
        title: translate('Connect using Association'),
        action: {
          click: startConnect,
          dragstart: startConnect,
        },
      },
    });
  }

  // delete element entry, only show if allowed by rules
  var deleteAllowed = rules.allowed('elements.delete', { elements: [ element ] });

  if (isArray(deleteAllowed)) {

    // was the element returned as a deletion candidate?
    deleteAllowed = deleteAllowed[0] === element;
  }

  if (deleteAllowed) {
    assign(actions, {
      'delete': {
        group: 'edit',
        className: 'bpmn-icon-trash',
        title: translate('Remove'),
        action: {
          click: function() {
            modeling.removeElements([ element ]);
          },
        }
      }
    });
  }

  return actions;
};


// helpers /////////

function isEventType(eventBo, type, definition) {

  var isType = eventBo.$instanceOf(type);
  var isDefinition = false;

  var definitions = eventBo.eventDefinitions || [];
  forEach(definitions, function(def) {
    if (def.$type === definition) {
      isDefinition = true;
    }
  });

  return isType && isDefinition;
}
