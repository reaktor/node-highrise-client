const assert = require('chai').assert
const Parser = require('../parser')
const fs     = require('fs')

describe('Highrise', () => {
  describe('Parser', () => {
    it('should parse person records', () => {
      readToParser('test/examples/person.xml', new Parser()).then((person) => {
        //console.log(person)
      }).catch((err) => {
        console.log(err.stack)
      })
    })
    it('should parse tags records', () => {
      readToParser('test/examples/tags.xml', new Parser()).then((person) => {
        console.log(person)
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
