import { is } from '../../../util/ModelUtil';

var HIGH_PRIORITY = 1500;

export var LANE_MIN_DIMENSIONS = { width: 300, height: 60 };

export var PARTICIPANT_MIN_DIMENSIONS = { width: 300, height: 150 };

export var TEXT_ANNOTATION_MIN_DIMENSIONS = { width: 50, height: 30 };


/**
 * Set minimum bounds/resize constraints on resize.
 *
 * @param {EventBus} eventBus
 */
export default function ResizeBehavior(eventBus) {
  eventBus.on('resize.start', HIGH_PRIORITY, function(event) {
    var context = event.context,
        shape = context.shape;

    if (is(shape, 'bpmn:TextAnnotation')) {
      context.minDimensions = TEXT_ANNOTATION_MIN_DIMENSIONS;
    }
  });
}

ResizeBehavior.$inject = [ 'eventBus' ];