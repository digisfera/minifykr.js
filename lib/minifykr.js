var elementtree = require('./elementtree_modified'),
  etOps = require('./elementtree_operations'),
  exec = require('child_process').exec,
  _ = require('underscore'),
  fs = require('fs'),
  assert = require('assert'),
  mkdirp = require('mkdirp'),
  path = require('path');

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


function concatenate(root, inputFileDir) {
    var newRoot = etOps.copy(root);

    var processedChildren = root.getchildren().map(function(e) {
      return concatenateAux(e, inputFileDir);
    });
    newRoot.extend(_.flatten(processedChildren));

    return newRoot;


    function concatenateAux(e, inputFileDir) {

      if(e.tag !== "include") { return e; }
      else {
        var includedFile = e.get('url');
        includedFile = path.join(inputFileDir, includedFile);

        //Get the root element of the included file
        var includedFileData = fs.readFileSync(includedFile, 'utf-8');

        var tree = new ElementTree();
        try {
            tree.parse(includedFileData);
        } catch(exception) {
            throw "Error parsing file " + includedFile + ": " + exception;
        }
        var includedRoot = tree.getroot();

        return includedRoot.getchildren().map(function(e) {
          return concatenateAux(e, path.dirname(includedFile));
        });
      }
    }
}

function rootNodeToXML(root) {
  var minTree = new ElementTree(root);
  return minTree.write({ encoding: 'utf-8', xml_declaration: false });
}

function minifyKr(inputData, inputFileDir, outputFileDir, callback) {
    var tree = new ElementTree();
    tree.parse(inputData);
    var root = tree.getroot();

    root = concatenate(root, inputFileDir);
    root = minify(root);

    callback(null, rootNodeToXML(root));
}


 function minifyKrFile(inputFile, outputFile, encrypt, callback) {
  inputFile = inputFile || "main.xml";
  if(encrypt === undefined) { encrypt = true; }

  if(!outputFile) {
    var inputFileComponents = inputFile.split('.');
    inputFileComponents.splice(inputFileComponents.length-1, 0, 'min');
    outputFile = inputFileComponents.join('.');
  }

  var inputData;
  try { inputData = fs.readFileSync(inputFile, 'utf-8'); }
  catch (e) { return callback(e, null); }

  var outputFileDir = path.dirname(outputFile);

  minifyKr(inputData, path.dirname(inputFile), outputFileDir, function(err, minified) {
    if(err) { return callback(err, null); }

    mkdirp.sync(path.dirname(outputFile));
    fs.writeFileSync(outputFile, minified);

    if(encrypt) {
      var kencryptBinary = path.join(__dirname, 'kencrypt', 'kencrypt');
      var cmd = kencryptBinary + ' -h5 -in=' + outputFile + ' -out=' + outputFile;
      child = exec(cmd,
      function (err, stdout, stderr) {
        if (err) { return callback({ error: err, output: stdout }, null); }
        else { callback(null, true); }
      });
    }
    else { callback(null, true); }
  });
}

exports.data = minifyKr;
exports.file = minifyKrFile;