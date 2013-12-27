expect = require('chai').expect
fs = require('fs')
minifykr = require('../lib/minifykr')


describe 'minifykr', ->

  testXMLFile = (fileName, done) ->
     minifykr.file "test/xml/#{fileName}.xml", "test/results/#{fileName}.result.xml", false, true, (err, success) ->
      expect(err).to.be.not.ok;

      compareFiles("#{fileName}.result.xml", "#{fileName}.expected.xml")
      done()   

  compareFiles = (resultFilename, expectedFilename) ->
    result = fs.readFileSync("test/results/#{resultFilename}", {encoding: 'UTF-8'})
    expected = fs.readFileSync("test/xml/#{expectedFilename}", {encoding: 'UTF-8'})
    expect(result).to.equal(expected)

  it 'should remove tails', (done) -> testXMLFile('tail', done);

  it 'should encrypt files', (done) -> 

    minifykr.file 'test/xml/encrypt.xml', 'test/results/encrypt.result.xml', true, true, (err, success) ->
      expect(err).to.be.not.ok;
      result = fs.readFileSync('test/results/encrypt.result.xml', {encoding: 'UTF-8'})
      expect(result.indexOf('<encrypted>')).to.equal(0)
      done()

  it 'should allow including other files', (done) -> testXMLFile('includepaths', done)
  it 'should allow including other files inside nodes', (done) -> testXMLFile('includeinside', done)
  it 'should not minify files when "minify" parameter is "false"', (done) -> testXMLFile('minifyfalse', done)
  it 'should generate new minified file when "minify" parameter is "includemin"', (done) ->
    minifykr.file "test/xml/includemin.xml", "test/results/includemin.result.xml", false, true, (err, success) ->
      #Child files are generated asynchronously. Therefore, we have to wait to be sure that everything worked correctly
      setTimeout((->
        compareFiles("includemin.result.xml", "includemin.expected.xml")
        compareFiles("includemin2.xml", "includemin.expected2.xml")
        done()), 100)

  it 'should place files inside their folders when "minify" parameter is "includemin"', (done) ->
    minifykr.file "test/xml/includeminfolders.xml", "test/results/includeminfolders.result.xml", false, true, (err, success) ->
      #Child files are generated asynchronously. Therefore, we have to wait to be sure that everything worked correctly
      setTimeout((->
        compareFiles("includeminfolders.result.xml", "includeminfolders.expected.xml")
        compareFiles("includeminfolders/includeminfolders2.xml", "includeminfolders/includeminfolders.expected2.xml")
        done()), 100)


  it 'should fail when an unknown "minify" parameter is found', (done) ->
    minifykr.file 'test/xml/minifyinvalid.xml', 'test/results/minifyinvalid.result.xml', false, true, (err, success) ->
      expect(err).to.be.ok
      expect(err.message).to.equal('Invalid value for "minify" parameter: invalidvalue')
      done()

  it 'should not minify when minify paremeter is set to false', (done) ->
    minifykr.file "test/xml/noMinify.xml", "test/results/noMinify.result.xml", false, false, (err, success) ->
      #Child files are generated asynchronously. Therefore, we have to wait to be sure that everything worked correctly
      setTimeout((->
        compareFiles("noMinify.result.xml", "noMinify.expected.xml")
        done()), 100)

  it 'should delete commments when minify paremeter is set to true', (done) ->
    minifykr.file "test/xml/dropcomments.xml", "test/results/dropcomments.result.xml", false, true, (err, success) ->
      #Child files are generated asynchronously. Therefore, we have to wait to be sure that everything worked correctly
      setTimeout((->
        compareFiles("dropcomments.result.xml", "dropcomments.expected.xml")
        done()), 100)

  it 'should preserve comments inside actions when not minifying', (done) ->
    minifykr.file "test/xml/commentInAction.xml", "test/results/commentInAction.result.xml", false, false, (err, success) ->
      #Child files are generated asynchronously. Therefore, we have to wait to be sure that everything worked correctly
      setTimeout((->
        compareFiles("commentInAction.result.xml", "commentInAction.expected.xml")
        done()), 100)

  it 'should delete comments inside actions when minifying', (done) ->
    minifykr.file "test/xml/commentInAction.xml", "test/results/commentInAction.minified.result.xml", false, true, (err, success) ->
      #Child files are generated asynchronously. Therefore, we have to wait to be sure that everything worked correctly
      setTimeout((->
        compareFiles("commentInAction.minified.result.xml", "commentInAction.minified.expected.xml")
        done()), 100)
