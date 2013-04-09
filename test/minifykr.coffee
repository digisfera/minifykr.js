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
