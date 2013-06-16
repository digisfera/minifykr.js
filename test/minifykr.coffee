expect = require('chai').expect
fs = require('fs')
minifykr = require('../lib/minifykr')

describe 'minifykr', ->

  it 'should remove tails', (done) ->

    minifykr.file 'test/xml/tail.xml', 'test/results/tail.result.xml', false, null, (err, success) ->

      result = fs.readFileSync('test/results/tail.result.xml', {encoding: 'UTF-8'})
      expected = fs.readFileSync('test/xml/tail.expected.xml', {encoding: 'UTF-8'})
      expect(result).to.equal(expected)
      done()

  it 'should allow including other files', (done) ->

    minifykr.file 'test/xml/includepaths.xml', 'test/results/includepaths.result.xml', false, null, (err, success) ->
      result = fs.readFileSync('test/results/includepaths.result.xml', {encoding: 'UTF-8'})
      expected = fs.readFileSync('test/xml/includepaths.expected.xml', {encoding: 'UTF-8'})
      expect(result).to.equal(expected)
      done()
