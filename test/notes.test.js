'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');

const seedNotes = require('../db/seed/notes');

const expect = chai.expect;

describe('Notes API', function() {
  before(function() {
    return mongoose.connect(TEST_MONGODB_URI);
  });

  beforeEach(function () {
    return Note.insertMany(seedNotes)
      .then(() => Note.createIndexes());
  });

  afterEach(function() {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
});