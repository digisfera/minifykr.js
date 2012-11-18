minifykr.js
========

A script to concatenate and minify XML files in [krpano](http://www.krpano.com) projects. 


## Usage

`node minifykr.js [ --noEncrypt ] [ inputFile ] [ outputFile ]`

- The default value for `inputFile` is `main.xml`

- The default value for `outputFile` is `INPUT_FILE.min.xml`

- When `--noEncrypt` is specified, the output will be encrypted using `kencrypt`. This requires `kencrypt` to be in the PATH


## Features

krpano projects often consist of a large number of XML files, which have to be loaded by the browser. This script minifies the XML code, merging all the files and removing unnecessary code, such as comments or spaces between XML tags.

This script recursively transverses all the files which are included in `inputFile` through &lt;include&gt; tags, minifies their code and writes the result to `outputFile`. Minifying does the following:

- removes comments

- removes characters between tags

- removes text inside tags which are not &lt;data&gt; or &lt;action&gt;


## Related projects

This script uses a modified version of [node-elementtree](https://github.com/racker/node-elementtree) to parse and generate XML. The modification removes the automatic attribute ordering, to keep the order of the `url` and `alturl` attributes.

There's also a [python implementation](https://github.com/manuelcabral/minifykr), which does not keep the attribute order.