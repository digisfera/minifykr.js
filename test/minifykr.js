var expect = require('chai').expect;
var fs = require('fs');
var minifykr = require('../lib/minifykr');

describe('minifykr', function() {

  it('should remove tails', function(done) {

    minifykr.file('test/xml/tail.xml', 'test/results/tail.result.xml', false, null, function(err, success) {

      var result = fs.readFileSync('test/results/tail.result.xml', {encoding: 'UTF-8'});
      var expected = fs.readFileSync('test/xml/tail.expected.xml', {encoding: 'UTF-8'});
      expect(result).to.equal(expected);
      done();

    });



  });

});