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


function concatenate(root, opts) {
    var newRoot = etOps.copy(root);

    var processedChildren = root.getchildren().map(function(e) {
      return concatenateAux(e, opts);
    });
    newRoot.extend(_.flatten(processedChildren));

    return newRoot;


    function concatenateAux(e, opts) {

      if(e.tag !== "include") {
        return concatenate(e, opts);
      }
      else {

        var minifyType = e.get('minify') || 'true';
        e.delete('minify');

        if(minifyType === 'false') {
          return e;
        }
        else if(minifyType == 'includemin') {
          includedFile = path.join(opts.inputFileDir, e.get('url'));
          outputFilename = path.join(opts.outputFileDir, e.get('url'));

          //This is not so pretty. The whole function should be asynchronous, rather than just leaving the file generation as async and continuing execution
          minifyKrFile(includedFile, outputFilename, opts.encrypt, function(err, outputFile) {
            if(err) { throw "Error minifying file " + includedFile + ": " + err; }
          });

          fileToSet = path.relative(opts.outputFileDir, outputFilename).replace(path.sep, '/');

          e.set('url', fileToSet);
          return e;
        }
        else if(minifyType == 'true') {
          var includedFile = e.get('url');
          includedFile = path.join(opts.inputFileDir, includedFile);

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
            var newOpts = _.clone(opts);
            newOpts.inputFileDir = path.dirname(includedFile);
            return concatenateAux(e, newOpts);
          });
        }
        else {
          throw new Error('Invalid value for "minify" parameter: ' + minifyType);
        }
      }
    }
}

function rootNodeToXML(root) {
  var minTree = new ElementTree(root);
  return minTree.write({ encoding: 'utf-8', xml_declaration: false });
}

function minifyKr(inputData, opts, callback) {
    try {
      var tree = new ElementTree();
      tree.parse(inputData);
      var root = tree.getroot();
  
      root = concatenate(root, opts);
      root = minify(root);
    }
    catch(e) {
      return callback(e)
    }

    callback(null, rootNodeToXML(root));
}

function generateOutputFilename(filename) {
  var fileComponents = filename.split('.');
  fileComponents.splice(fileComponents.length-1, 0, 'min');
  return fileComponents.join('.');
}


 function minifyKrFile(inputFile, outputFile, encrypt, callback) {
  inputFile = inputFile || "main.xml";
  if(encrypt === undefined) { encrypt = true; }

  if(!outputFile) { outputFile = generateOutputFilename(inputFile); }

  var inputData;
  try { inputData = fs.readFileSync(inputFile, 'utf-8'); }
  catch (e) { return callback(e, null); }

  var outputFileDir = path.dirname(outputFile);

  var opts = {
    inputFileDir: path.dirname(inputFile),
    outputFileDir: outputFileDir,
    encrypt: encrypt
  };

  minifyKr(inputData, opts, function(err, minified) {
    if(err) { return callback(err, null); }

    mkdirp.sync(path.dirname(outputFile));
    fs.writeFileSync(outputFile, minified);

    if(encrypt) {
      var kencryptBinary = path.join(__dirname, 'kencrypt', 'kencrypt');
      var cmd = kencryptBinary + ' -h5 -in=' + outputFile + ' -out=' + outputFile;
      child = exec(cmd,
      function (err, stdout, stderr) {
        if (err) { return callback({ error: err, output: stdout }, null); }
        else { callback(null, outputFile); }
      });
    }
    else { callback(null, outputFile); }
  });
}

exports.data = minifyKr;
exports.file = minifyKrFile;