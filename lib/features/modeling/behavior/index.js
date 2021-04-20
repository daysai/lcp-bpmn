import FixHoverBehavior from './FixHoverBehavior';
import DropOnFlowBehavior from './DropOnFlowBehavior';
import LabelBehavior from './LabelBehavior';
import ResizeBehavior from './ResizeBehavior';
import RemoveElementBehavior from './RemoveElementBehavior';
import UnclaimIdBehavior from './UnclaimIdBehavior';
import UnsetDefaultFlowBehavior from './UnsetDefaultFlowBehavior';

export default {
  __init__: [
    'fixHoverBehavior',
    'dropOnFlowBehavior',
    'labelBehavior',
    'removeElementBehavior',
    'resizeBehavior',
    'unclaimIdBehavior',
    'unsetDefaultFlowBehavior',
  ],
  fixHoverBehavior: [ 'type', FixHoverBehavior ],
  dropOnFlowBehavior: [ 'type', DropOnFlowBehavior ],
  labelBehavior: [ 'type', LabelBehavior ],
  resizeBehavior: [ 'type', ResizeBehavior ],
  removeElementBehavior: [ 'type', RemoveElementBehavior ],
  unclaimIdBehavior: [ 'type', UnclaimIdBehavior ],
  unsetDefaultFlowBehavior: [ 'type', UnsetDefaultFlowBehavior ]
};
