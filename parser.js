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

class SubjectDataHandler extends Handler {
  constructor(parent) {
    super()
    this.parent = parent
    this.datas = []
    this.data = {}
  }
  opentag(opts) {
    if (opts.name == 'subject_data') {
      this.data = {}
    }
    this.tagName = opts.name
    return this
  }
  text(opts) {
    switch (this.tagName) {
      case "id":
      case "subject_field_id":
        this.data[this.tagName] = parseInt(opts, 10)
        break
      case "value":
      case "subject_field_label":
        this.data[this.tagName] = opts
        break
    }
    return this
  }
  closetag(name) {
    this.tagName = null
    if (name == "subject_data") {
      this.datas.push(this.data)
    } else if (name == "subject_datas") {
      this.parent.onchildover(this.datas)
      return this.parent
    }
    return this
  }
}

class TagsHandler extends Handler {
  constructor(parent) {
    super()
    this.parent = parent
    this.tags = []
  }
  opentag(opts) {
    this.tagName = opts.name
    return this
  }
  text(opts) {
    switch (this.tagName) {
      case "id":
        this.id = parseInt(opts, 10)
        break
      case "name":
        this.name = opts
        break
    }
    return this
  }
  closetag(name) {
    this.tagName = null
    if (name == "tag") {
      this.tags.push({
        id: this.id,
        name: this.name
      })
    } else if (name == "tags") {
      this.parent.onchildover(this.tags)
      return this.parent
    }
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
  constructor(parent, rootTagName) {
    super()
    this.parent = parent
    this.person = {}
    this.rootTagName = rootTagName || "person"
  }
  opentag(opts) {
    this.tagName = opts.name
    this.numeric = (opts.attributes.type === 'integer')
    this.datetime = (opts.attributes.type === 'datetime')
    this.tagValue = null
    switch (this.tagName) {
      case "contact-data":
        return new ContactDataHandler(this)
      case "subject_datas":
        return new SubjectDataHandler(this)
      case "tags":
        return new TagsHandler(this)
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
      this.tagValue = opts.trim()
    }
    return this
  }
  closetag(tagName) {
    switch (tagName) {
      case "contact-data":
      case "subject-datas":
      case "tags":
        break;
      case this.rootTagName:
        this.parent.onchildover(this.person)
        return this.parent
      default:
        this.person[tagName] = this.tagValue
        break;
    }
    return this
  }
  onchildover(data) {
    if (this.tagName == 'contact-data') {
      this.person.emails = data.emails
      this.person.phones = data.phones
    } else if (this.tagName == 'tags') {
      this.person.tags = data
    } else if (this.tagName == 'subject_datas') {
      this.person.subject_datas = data
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
      case 'party':
        if (opts.attributes.type == 'Person') {
          return new PersonHandler(this, "party")
        } else {
          return this
        }
      default:
        return this
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
