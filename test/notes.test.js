'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
// const chaiSpies = require('chai-spies');
const expect = chai.expect;

const mongoose = require('mongoose');
const express = require('express');

const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');

const seedNotes = require('../db/seed/notes');

chai.use(chaiHttp);
// chai.use(chaiSpies);

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

  describe('GET /api/notes', function() {
    it('should return the correct number of notes', function() {
      //1. Call the database and the API
      const dbPromise = Note.find();
      const apiPromise = chai.request(app).get('/api/notes');
      //2. Wait for both promises to resolve using  'Promise.all'
      return Promise.all([dbPromise, apiPromise])
      //3. then compare database results to API results
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });

    it('should return an empty array for an incorrect query', function() {
      const dbPromise = Note.find( {title: {$regex: /Not Valid/i} });
      const apiPromise = chai.request(app).get('/api/notes/?searchTerm=NotValid');

      return Promise.all([dbPromise, apiPromise])
        .then(([data, res]) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  
  });

});