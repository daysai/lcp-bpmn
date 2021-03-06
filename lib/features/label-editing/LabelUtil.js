import { is } from '../../util/ModelUtil';

function getLabelAttr(semantic) {
  if (
    is(semantic, 'bpmn:FlowElement') ||
    is(semantic, 'bpmn:SequenceFlow') ||
    is(semantic, 'bpmn:MessageFlow')
  ) {
    return 'name';
  }

  if (is(semantic, 'bpmn:TextAnnotation')) {
    return 'text';
  }
}

function getCategoryValue(semantic) {
  var categoryValueRef = semantic['categoryValueRef'];

  if (!categoryValueRef) {
    return '';
  }


  return categoryValueRef.value || '';
}

export function getLabel(element) {
  var semantic = element.businessObject,
      attr = getLabelAttr(semantic);

  if (attr) {

    if (attr === 'categoryValueRef') {

      return getCategoryValue(semantic);
    }

    return semantic[attr] || '';
  }
}


export function setLabel(element, text, isExternal) {
  var semantic = element.businessObject,
      attr = getLabelAttr(semantic);

  if (attr) {

    if (attr === 'categoryValueRef') {
      semantic['categoryValueRef'].value = text;
    } else {
      semantic[attr] = text;
    }

  }

  return element;
}