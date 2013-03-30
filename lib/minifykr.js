var elementtree = require('./elementtree_modified'),
  etOps = require('./elementtree_operations'),
  exec = require('child_process').exec,
  _ = require('underscore'),
  fs = require('fs'),
  assert = require('assert'),
  mkdirp = require('mkdirp'),
  spritesmith = require('spritesmith'),
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

    var processedChildren = root.getchildren().map(concatenateAux);
    newRoot.extend(_.flatten(processedChildren));

    return newRoot;


    function concatenateAux(e) {

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

        return includedRoot.getchildren().map(concatenateAux);
      }
    }
}

function getURLAttrib(e) {
  var attribs = {};
  if(e.attrib && e.attrib.spriteme != 'false') {
    if(e.attrib.url && e.attrib.url.match(/^.*\.png$/)) { attribs['url'] = e.attrib.url; }
    if(e.attrib.alturl && e.attrib.alturl.match(/^.*\.png$/)) { attribs['alturl'] = e.attrib.alturl; }
    if(e.attrib.appliedto && e.attrib.appliedto.match(/^.*\.png$/)) { attribs['appliedto'] = e.attrib.appliedto; }
  }
  return attribs;
}

function getPNGs(root, inputFileDir) {

    var allImages = [];
    etOps.forEach(root, getElementPNG);
    var images = _.chain(allImages).unique().map(function(val) { return path.join(inputFileDir, val); }).value();
    return images;


    function getElementPNG(e) {
      if(e.tag !== 'plugin' && e.tag !== 'hotspot' && e.tag !== 'style') { return; }
      var urls = getURLAttrib(e);
      allImages = _.union(allImages, _.values(urls));
    }
}

function replaceImagesBySprite(root, spriteFile, coordinates, inputFileDir) {
  var toReplace = _.keys(coordinates);

  return etOps.map(root, function(e) {
    var urlAttribs = getURLAttrib(e);

    if(urlAttribs && _.values(urlAttribs).length > 0) {
      var originalPath = path.join(inputFileDir, _.values(urlAttribs)[0]);
      _.each(urlAttribs, function(value, key) { e.attrib[key] = spriteFile; });
      var imageCoords = coordinates[originalPath];
      assert(imageCoords);

      if(imageCoords) {
        e.attrib.crop = addCrop(e.attrib.crop, imageCoords);
        if(e.attrib.onovercrop) { e.attrib.onovercrop = addCrop(e.attrib.onovercrop, imageCoords); }
        if(e.attrib.ondowncrop) { e.attrib.ondowncrop = addCrop(e.attrib.ondowncrop, imageCoords); }
      }
    }

    if(e.attrib.appliedto) { delete e.attrib.appliedto; }
    if(e.attrib.spriteme) { delete e.attrib.spriteme; }


    return e;
  });
}

function addCrop(cropStr, coords) {
  if(!cropStr) { cropStr = [0,0,coords.width,coords.height].join('|'); }
  var cropVals = cropStr.split('|');
  var cropInt = _.map(cropVals, function(val) { return parseInt(val, 10); });

  assert(cropInt.length === 4);

  cropInt[0] += coords.x;
  cropInt[1] += coords.y;

  var newCrop = cropInt.join('|');
  return newCrop;
}



function rootNodeToXML(root) {
  var minTree = new ElementTree(root);
  return minTree.write({ encoding: 'utf-8', xml_declaration: false });
}

function minifyKr(inputData, inputFileDir, outputFileDir, spriteFile, callback) {
    var tree = new ElementTree();
    tree.parse(inputData);
    var root = tree.getroot();

    root = concatenate(root, inputFileDir);
    root = minify(root);

    if(!spriteFile) { callback(null, rootNodeToXML(root)); }
    else {
      allPNGs = getPNGs(root, inputFileDir);
      spritesmith({'src': allPNGs}, function (err, result) {
        if(err) { callback(err, null); throw err; }

        fs.writeFileSync(spriteFile, result.image, {encoding: 'binary'});

        var spriteRelativeToOutput = path.relative(outputFileDir, spriteFile);
        root = replaceImagesBySprite(root, spriteRelativeToOutput, result.coordinates, inputFileDir);
        callback(null, rootNodeToXML(root));
      });
    }

}


 function minifyKrFile(inputFile, outputFile, encrypt, spriteFile, callback) {
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

  minifyKr(inputData, path.dirname(inputFile), outputFileDir, spriteFile, function(err, minified) {
    if(err) { return callback(err, null); }

    mkdirp.sync(path.dirname(outputFile));
    fs.writeFileSync(outputFile, minified);

    if(encrypt) {
      var cmd = 'kencrypt -h5 -in=' + outputFile + ' -out=' + outputFile;
      child = exec(cmd,
      function (error, stdout, stderr) {
        if (err) { return callback(err, null); }
      });
      callback(null, true);
    }
    else { callback(null, true); }
  });
}

exports.data = minifyKr;
exports.file = minifyKrFile;