var elementtree = require('./elementtree_modified');

var ElementTree = elementtree.ElementTree,
  Element = elementtree.Element;

function copy(element) {
    var newElement = new Element(element.tag, element.attrib);
    newElement.text = element.text;
    newElement.tail = element.tail;
    return newElement;
}

function forEach(root, fun) {
  fun(root);
  root.getchildren().forEach(function(e) { forEach(e, fun); });
  return root;
}

function map(root, childrenOnly, fun) {

  if(typeof childrenOnly !== 'boolean') {
    fun = childrenOnly;
  }

  childrenOnly = childrenOnly || false;

  var newRoot = copy(root);

  newRoot = fun(newRoot);
  var mappedChildren = root.getchildren().map(function(e) { return map(e, fun); });
  newRoot.extend(mappedChildren);

  return newRoot;
}

exports.copy = copy;
exports.forEach = forEach;
exports.map = map;