import AdaptiveLabelPositioningBehavior from './AdaptiveLabelPositioningBehavior';
import FixHoverBehavior from './FixHoverBehavior';
import DropOnFlowBehavior from './DropOnFlowBehavior';
import ImportDockingFix from './ImportDockingFix';
import LabelBehavior from './LabelBehavior';
import ResizeBehavior from './ResizeBehavior';
import RemoveElementBehavior from './RemoveElementBehavior';
import SpaceToolBehavior from './SpaceToolBehavior';
import UnclaimIdBehavior from './UnclaimIdBehavior';
import UnsetDefaultFlowBehavior from './UnsetDefaultFlowBehavior';

export default {
  __init__: [
    'adaptiveLabelPositioningBehavior',
    'fixHoverBehavior',
    'dropOnFlowBehavior',
    'importDockingFix',
    'labelBehavior',
    'removeElementBehavior',
    'resizeBehavior',
    'spaceToolBehavior',
    'unclaimIdBehavior',
    'unsetDefaultFlowBehavior',
  ],
  adaptiveLabelPositioningBehavior: [ 'type', AdaptiveLabelPositioningBehavior ],
  fixHoverBehavior: [ 'type', FixHoverBehavior ],
  dropOnFlowBehavior: [ 'type', DropOnFlowBehavior ],
  importDockingFix: [ 'type', ImportDockingFix ],
  labelBehavior: [ 'type', LabelBehavior ],
  resizeBehavior: [ 'type', ResizeBehavior ],
  removeElementBehavior: [ 'type', RemoveElementBehavior ],
  spaceToolBehavior: [ 'type', SpaceToolBehavior ],
  unclaimIdBehavior: [ 'type', UnclaimIdBehavior ],
  unsetDefaultFlowBehavior: [ 'type', UnsetDefaultFlowBehavior ]
};
