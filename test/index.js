const assert = require('chai').assert
const Parser = require('../parser')
const fs     = require('fs')

describe('Highrise', () => {
  describe('Parser', () => {
    it('should parse person records', (done) => {
      readToParser('test/examples/person.xml', new Parser()).then((person) => {
        assert.equal('Partner', person.tags[0].name)
        done()
      }).catch((err) => {
        console.log(err.stack)
      })
    })
    it('should parse tags records', (done) => {
      readToParser('test/examples/tags.xml', new Parser()).then((persons) => {
        assert.equal(2, persons.length)
        done()
      }).catch((err) => {
        console.log(err.stack)
      })
    })
    it('should parse email records', (done) => {
      readToParser('test/examples/emails.xml', new Parser()).then((emails) => {
        assert.equal(4, emails.length)
        done()
      }).catch((err) => {
        console.log(err.stack)
      })
    })
  })
})

function readToParser(file, parser) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      try {
        parser.write(data)
        resolve(parser.end())
      } catch (e) {
        reject(e)
      }
    })
  })
}
