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
    if (opts.name == 'tag') {
      return new TagHandler(this)
    } else {
      return this
    }
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
  onchildover(data) {
    this.tags.push(data)
  }
  closetag(name) {
    if (name == "tags") {
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
    this.addresses = []
    this.webAddresses = []
    this.twitterAccounts = []
    this.instantMessengers = []
  }
  opentag(opts) {
    this.tagName = opts.name
    return this
  }
  text(opts) {
    switch (this.tagName) {
      case "address":
      case "id":
      case "number":
      case "location":
      case "city":
      case "country":
      case "state":
      case "street":
      case "zip":
      case "protocol":
      case "username":
      case "url":
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
          id: this.id,
          address: this.address,
          location: this.location
        })
        break
      case "phone-number":
        this.phones.push({
          id: this.id,
          number: this.number,
          location: this.location
        })
        break
      case "address":
        this.addresses.push({
          id: this.id,
          city: this.city,
          country: this.country,
          state: this.state,
          street: this.street,
          zip: this.zip,
          location: this.location
        })
        break
      case "instant-messenger":
        this.instantMessengers.push({
          id: this.id,
          address: this.address,
          protocol: this.protocol,
          location: this.location
        })
        break
      case "twitter-account":
        this.twitterAccounts.push({
          id: this.id,
          location: this.location,
          username: this.username,
          url: this.url
        })
        break
      case "web-address":
        this.webAddresses.push({
          id: this.id,
          url: this.url,
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

class GenericTagHandler extends Handler {
  constructor(parent, rootTagName) {
    super()
    this.parent = parent
    this.data = {}
    this.rootTagName = rootTagName
  }
  opentag(opts) {
    this.tagName = opts.name
    this.type = opts.attributes.type || "text"
    this.tagValue = null
    return this
  }
  text(opts) {
    this.tagValue = parseTextNode(opts, this.type)
    return this
  }
  closetag(tagName) {
    switch (tagName) {
      case this.rootTagName:
        this.parent.onchildover(this.data)
        return this.parent
      default:
        this.data[tagName] = this.tagValue
        break;
    }
    return this
  }
}

class GenericArrayHandler extends GenericTagHandler {
  constructor(parent, rootTagName) {
    super()
    this.parent = parent
    this.data = []
    this.rootTagName = rootTagName
  }
  opentag(opts) {
    this.tagName = opts.name
    this.type = opts.attributes.type || "text"
    this.tagValue = null

    return new GenericTagHandler(this, opts.name)
  }
  closetag(tagName) {
    if (tagName == this.rootTagName) {
        this.parent.onchildover(this.data)
        return this.parent
    }

    return this
  }
  onchildover(data) {
    this.data.push(data)
  }
}

class TagHandler extends GenericTagHandler {
  constructor(parent) {
    super(parent, "tag")
  }
}


class AttachmentAwareHandler extends GenericTagHandler {
  constructor(parent, tag) {
    super(parent, tag)
    this.data.attachments = []
  }
  opentag(opts) {
    if (opts.name == 'attachments') {
      return new GenericArrayHandler(this, 'attachments')
    } else {
      return super.opentag(opts)
    }
  }
  onchildover(data) {
    this.data.attachments = data
  }
  closetag(name) {
    if (name == 'attachments') {
      return this
    } else {
      return super.closetag(name)
    }
  }
}

class NoteHandler extends AttachmentAwareHandler {
  constructor(parent, tagName) {
    super(parent, tagName || "note")
  }
}

class EmailHandler extends AttachmentAwareHandler {
  constructor(parent, tagName) {
    super(parent, tagName || "email")
  }
}

class UserHandler extends GenericTagHandler {
  constructor(parent) {
    super(parent, "user")
  }
}

class PartyHandler extends Handler {
  constructor(parent, rootTagName) {
    super()
    this.parent = parent
    this.party = {}
    this.rootTagName = rootTagName || "person"
  }
  opentag(opts) {
    this.tagName = opts.name
    this.type = opts.attributes.type || "text"
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
    this.tagValue = parseTextNode(opts, this.type)
    return this
  }
  closetag(tagName) {
    switch (tagName) {
      case "contact-data":
      case "subject-datas":
      case "tags":
        break;
      case this.rootTagName:
        this.parent.onchildover(this.party)
        return this.parent
      default:
        this.party[tagName] = this.tagValue
        break;
    }
    return this
  }
  onchildover(data) {
    if (this.tagName == 'contact-data') {
      this.party.emails = data.emails
      this.party.phones = data.phones
      this.party.addresses = data.addresses
      this.party.webAddresses = data.webAddresses
      this.party.twitterAccounts = data.twitterAccounts
      this.party.instantMessengers = data.instantMessengers
    } else if (this.tagName == 'tags') {
      this.party.tags = data
    } else if (this.tagName == 'subject_datas') {
      this.party.subject_datas = data
    }
  }
}

class RecordingsHandler extends Handler {
  constructor(parent) {
    super()
    this.parent = parent;
    this.tagType = undefined;
    this.recordings = { emails: [], notes: [], comments: [] };
  }
  opentag(opts) {
    if (opts.attributes.type == "Email") {
      this.tagType = "emails";
      return new EmailHandler(this, "recording");
    } else if (opts.attributes.type == "Note") {
      this.tagType = "notes";
      return new NoteHandler(this, "recording");
    } else {
      this.tagType = "comments";
      return new GenericTagHandler(this, opts.name);
    }
  }
  closetag(tagName) {
    if (tagName === "recordings") {
      this.parent.onchildover(this.recordings);
      return this.parent;
    }
    return this;
  }
  onchildover(recording) {
    this.recordings[this.tagType].push(recording);
  }
}

class RootHandler extends Handler {
  constructor() {
    super()
  }
  opentag(opts) {
    switch (opts.name) {
      case 'note':
        return new NoteHandler(this)
      case 'email':
        return new EmailHandler(this)
      case 'person':
        return new PartyHandler(this, 'person')
      case 'company':
        return new PartyHandler(this, 'company')
      case 'tags':
        return new TagsHandler(this)
      case 'tag':
        return new TagHandler(this)
      case 'user':
        return new UserHandler(this)
      case 'party':
        return new PartyHandler(this, "party")
      case 'subject-fields':
        return new GenericArrayHandler(this, 'subject-fields')
      case 'recordings':
        return new RecordingsHandler(this)
      default:
        if (opts.attributes.type == 'array') {
          this.value = []
          this.isArray = true
        }
        return this
    }
  }
  onchildover(data) {
    if (this.isArray) {
      this.value.push(data)
    } else {
      this.value = data
    }
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

function parseTextNode(text, type) {
  if (type == 'boolean') {
    return (text === 'true')
  } else if (type == 'integer') {
    const value = parseInt(text, 10)
    if (!isNaN(value)) {
      return value
    }
  } else if (type == 'datetime') {
    const value = Date.parse(text)
    if (!isNaN(value)) {
      return new Date(value)
    }
  } else {
    return text.trim()
  }
}
