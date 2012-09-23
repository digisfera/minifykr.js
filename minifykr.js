var elementtree = require('./changedelementtree'),
  exec = require('child_process').exec,
  fs = require('fs');

var ElementTree = elementtree.ElementTree,
  Element = elementtree.Element;

var argv = require('optimist').boolean('noEncrypt').argv;


function copyElementTag(element) {
    return new Element(element.tag, element.attrib);
}

function removeUnecessary(element) {
    element.tail = null;

    if(element.tag != "data" && element.tag != "action") { element.text = ""; }

    element.getchildren().forEach(function(c) { removeUnecessary(c); });
}

function mergeInto(root, newRoot) {


    root.getchildren().forEach(function(e) {

       if(e.tag == "include") {
            includedFile = e.get('url');

            //Get the root element of the included file
            includedFileData = fs.readFileSync(includedFile, 'utf-8');
            
            tree = new ElementTree();
            try {
                tree.parse(includedFileData);
            } catch(exception) {
                throw "Error parsing file " + includedFile + ": " + exception;
            }
            includedRoot = tree.getroot();

            //Merge the tags of the included file
            mergeInto(includedRoot, newRoot);
        }

        else {
            removeUnecessary(e);
            newRoot.append(e);  // gigantic number ensures that the tags will always be added to the end of the file
        }

    });

    return newRoot;
}

function minifyKr(source) {
    tree = new ElementTree();
    tree.parse(source);
    root = tree.getroot();

    //Copy the root node that we'll copy the elements into
    newRoot = copyElementTag(root);

    mergeInto(root, newRoot);

    minTree = new ElementTree(newRoot);
    return minTree.write({ encoding: 'utf-8', xml_declaration: false });
}



var inputFile = argv._[0] || "main.xml";
var outputFile = argv._[1];

if(!outputFile) {
	var inputFileComponents = inputFile.split('.');
	inputFileComponents.splice(inputFileComponents.length-1, 0, 'min');
	outputFile = inputFileComponents.join('.');
}

try { var inputData = fs.readFileSync(inputFile, 'utf-8'); }
catch (e) { console.log(e.toString()); return; } 

var minified = minifyKr(inputData);
fs.writeFileSync(outputFile, minified);


if(!argv.noEncrypt) {
  cmd = 'kencrypt -h5 -in=' + outputFile + ' -out=' + outputFile;
  child = exec(cmd,
  function (error, stdout, stderr) {
    if (error !== null) {
      console.log('Error encrypting: ' + error);
    }
  });
}