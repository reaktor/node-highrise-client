"use strict"
const sax = require('sax')

class Handler {
  constructor() {}
  opentag() {
    return this
  }
  text() {
    return this
  }
  closetag() {
    return this
  }
  onchildover() {
    return this
  }
}

class ContactDataHandler extends Handler {
  constructor(parent) {
    super()
    this.parent = parent
    this.emails = []
    this.phones = []
  }
  opentag(opts) {
    this.tagName = opts.name
    return this
  }
  text(opts) {
    switch (this.tagName) {
      case "address":
      case "number":
      case "location":
        this[this.tagName] = opts
        break
    }
    return this
  }
  closetag(name) {
    this.tagName = null
    switch (name) {
      case "email-address":
        this.emails.push({
          address: this.address,
          location: this.location
        })
        break
      case "phone-number":
        this.phones.push({
          number: this.number,
          location: this.location
        })
        break
      case "contact-data":
        this.parent.onchildover(this)
        return this.parent
    }
    return this
  }
}

class PersonHandler extends Handler {
  constructor(parent) {
    super()
    this.parent = parent
    this.person = {}
  }
  opentag(opts) {
    this.tagName = opts.name
    this.numeric = (opts.attributes.type === 'integer')
    this.datetime = (opts.attributes.type === 'datetime')
    this.tagValue = null

    switch (this.tagName) {
      case "contact-data":
        return new ContactDataHandler(this)
      default:
        return this
    }
  }
  text(opts) {
    if (this.numeric) {
      const value = parseInt(opts, 10)
      if (!isNaN(value)) {
        this.tagValue = value
      }
    } else if (this.datetime) {
      const value = Date.parse(opts)
      if (!isNaN(value)) {
        this.tagValue = new Date(value)
      }
    } else {
      this.tagValue = opts
    }
    return this
  }
  closetag(tagName) {
    switch (tagName) {
      case "contact-data":
      case "subject-datas":
      case "tags":
        break;
      default:
        this.person[tagName] = this.tagValue
        break;
    }
    if (tagName == 'person') {
      return this.parent.onchildover(this.person)
    } else {
      return this
    }
  }
  onchildover(data) {
    if (this.tagName == 'contact-data') {
      this.person.emails = data.emails
      this.person.phones = data.phones
    }
  }
}

class RootHandler extends Handler {
  constructor() {
    super()
  }
  opentag(opts) {
    switch (opts.name) {
      case 'person':
        return new PersonHandler(this)
        break;
      default:
        return this
        break;
    }
  }
  onchildover(data) {
    this.value = data
    return this
  }
  closetag(tagName) {
    return this
  }
}

module.exports = class Parser {
  constructor() {
    this.parser = sax.parser(true)
    this.handler = new RootHandler()

    this.parser.onopentag = this.opentag.bind(this)
    this.parser.ontext = this.text.bind(this)
    this.parser.onclosetag = this.closetag.bind(this)
  }
  text(opts) {
    this.handler = this.handler.text(opts)
  }
  opentag(opts) {
    this.handler = this.handler.opentag(opts)
  }
  closetag(tagName) {
    this.handler = this.handler.closetag(tagName)
  }
  write(data) {
    this.parser.write(data)
  }
  end() {
    this.parser.close()
    return this.handler.value
  }
}
