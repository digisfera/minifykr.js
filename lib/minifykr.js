var elementtree = require('./elementtree_modified'),
  etOps = require('./elementtree_operations'),
  exec = require('child_process').exec,
  _ = require('underscore'),
  fs = require('fs');

var ElementTree = elementtree.ElementTree,
  Element = elementtree.Element;


function minify(root) {
  return etOps.map(root, minifyElement);
}

function minifyElement(e) {
  e.tail = null;
  if(e.tag != "data" && e.tag != "action") { e.text = ""; }
  return e;
}


function concatenate(root) {
    var newRoot = etOps.copy(root);

    var processedChildren = root.getchildren().map(concatenateAux);
    newRoot.extend(_.flatten(processedChildren));

    return newRoot;


    function concatenateAux(e) {

      if(e.tag !== "include") { return e; }
      else {
        var includedFile = e.get('url');

        //Get the root element of the included file
        var includedFileData = fs.readFileSync(includedFile, 'utf-8');
        
        var tree = new ElementTree();
        try {
            tree.parse(includedFileData);
        } catch(exception) {
            throw "Error parsing file " + includedFile + ": " + exception;
        }
        var includedRoot = tree.getroot();

        return includedRoot.getchildren().map(concatenateAux);
      }
    }
}


function minifyKr(inputData) {
    var tree = new ElementTree();
    tree.parse(inputData);
    var root = tree.getroot();

    root = concatenate(root);
    root = minify(root);

    var minTree = new ElementTree(root);
    return minTree.write({ encoding: 'utf-8', xml_declaration: false });
}

 function minifyKrFile(inputFile, outputFile, encrypt) {
  inputFile = inputFile || "main.xml";
  if(encrypt === undefined) { encrypt = true; }

  if(!outputFile) {
    var inputFileComponents = inputFile.split('.');
    inputFileComponents.splice(inputFileComponents.length-1, 0, 'min');
    outputFile = inputFileComponents.join('.');
  }

  var inputData;
  try { inputData = fs.readFileSync(inputFile, 'utf-8'); }
  catch (e) { console.log(e.toString()); return; }

  var minified = minifyKr(inputData);
  fs.writeFileSync(outputFile, minified);

  if(encrypt) {
    var cmd = 'kencrypt -h5 -in=' + outputFile + ' -out=' + outputFile;
    child = exec(cmd,
    function (error, stdout, stderr) {
      if (error !== null) {
        console.log('Error encrypting: ' + error);
      }
    });
  }
}

exports.data = minifyKr;
exports.file = minifyKrFile;