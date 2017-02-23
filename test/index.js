const assert = require('chai').assert
const Parser = require('../parser')
const fs     = require('fs')

describe('Highrise', () => {
  describe('Parser', () => {
    it('should parse person records', (done) => {
      readToParser('test/examples/person.xml', new Parser()).then((person) => {
        assert.equal('Partner', person.tags[0].name)
        person.emails.forEach(e => assert.isDefined(e.id))
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
        assert.equal(1, emails[0].attachments.length)
        assert.equal(0, emails[1].attachments.length)
        assert.equal("https://example.highrisehq.com/files/14449", emails[0].attachments[0].url)
        done()
      }).catch((err) => {
        console.log(err.stack)
      })
    })
    it('should parse note records', (done) => {
      readToParser('test/examples/notes.xml', new Parser()).then((notes) => {
        assert.equal(3, notes.length)
        assert.equal(13391, notes[1].attachments[0].id)
        done()
      }).catch((err) => {
        console.log(err.stack)
      })
    })
    it('should parse tag root records', (done) => {
      readToParser('test/examples/tags_root.xml', new Parser()).then((tags) => {
        assert.equal(4, tags.length)
        assert.equal("foobar", tags[0].name)
        assert.equal(9840, tags[3].id)
        done()
      }).catch((err) => {
        console.log(err.stack)
      })
    })
    it('should parse tag responses', (done) => {
      readToParser('test/examples/tag.xml', new Parser()).then((tag) => {
        assert.equal("closed", tag.name)
        assert.equal(19751341, tag.id)
        done()
      }).catch((err) => {
        console.log(err.stack)
      })
    })
    it('should parse user responses', (done) => {
      readToParser('test/examples/user.xml', new Parser()).then((user) => {
        assert.equal("foobarfoobarfoobarfoobarfoobar", user.token)
        assert.equal(true, user.admin)
        assert.equal("Test User", user.name)
        assert.equal(new Date(Date.UTC(2010, 0, 1, 7, 4, 37)).toString(), user['created-at'].toString())
        done()
      }).catch((err) => {
        console.log(err.stack)
      })
    })
    it('should parse custom field definitions', (done) => {
      readToParser('test/examples/custom_fields.xml', new Parser()).then((fields) => {
        assert.equal(2, fields.length)
        assert.strictEqual(1234, fields[0].id)
        assert.equal("Custom field 1", fields[0].label)
        assert.equal("party", fields[1].type)
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
