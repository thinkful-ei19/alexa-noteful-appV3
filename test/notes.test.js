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
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(data.length);
        });
    });
  
  });

  describe('GET /api/notes/:id', function() {
    it('should return correct notes', function() {
      let data;
      //1. First, call the database
      return Note.findOne().select('id title content')
        .then(_data => {
          data = _data;
          //2. then call the API
          return chai.request(app).get(`/api/notes/${data.id}`);
        })
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.have.keys('id', 'title', 'content', 'created');

          //3. then compare
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(data.title);
          expect(res.body.content).to.equal(data.content);
        });
    });

    it('should respond with a 404 for an invalid id', function () {
      return chai.request(app)
        .get('/api/notes/ASASASASASASASASASASASAS')
        .catch(err => err.response)
        .catch(res => {
          expect(res).to.have.status(404);
        });
    });
  });

  describe('POST /api/notes', function() {
    it('should create a new note when provided with valid data', function() {
      const newNote = {
        'title': 'New note created!',
        'content': 'Testing post endpoint.',
        'tags': []
      };
      let body;
      //1. First, call the API to test the new document 
      return chai.request(app).post('/api/notes').send(newNote)
        .then(function(res) {
          body = res.body;
          expect(res).to.have.status(201);
          expect(res).to.have.header('location');
          expect(res).to.be.json;

          expect(body).to.be.an('object');
          expect(body).to.have.keys('id', 'title', 'content', 'created');
          //2. then call the database to retrieve the new document
          return Note.findById(body.id);
        })
        //3. then compare the API response to the database results
        .then(data => {
          expect(body.id).to.equal(data.id);
          expect(body.title).to.equal(data.title);
          expect(body.content).to.equal(data.content);
        });
    });

    it('should return an error when missing "title" field', function() {
      const newNote = {
        'content': 'This note has no title!'
      };
      //call the API
      return chai.request(app)
        .post('/api/notes').send(newNote)
        .catch(err => err.response)
        .then(res => {
          expect(res).to.have.status(400);
          expect(res).to.be.json;
          expect(res).to.be.an('object');
          expect(res.body.message).to.equal('Missing `title` in request body');
        });
    });
  
  });

  describe('PUT /api/notes/:id', function() {
    it('should update the note with the given id', function() {
      const updatedNote = {
        'title': 'Updating and testing',
        'content' :'updated existing note content'
      };
      let data;
      // 1. First call the db to get an id
      return Note.findOne().select('id title content')
        .then(_data => {
          data = _data;
          // 2. then call the API with the given id and sending updatedNote
          return chai.request(app).put(`/api/notes/${data.id}`)
            .send(updatedNote);
        })
        .then(function (res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;

          expect(res.body).to.be.an('object');
          expect(res.body).to.include.keys('id', 'title', 'content', 'created');

          // 3. then compare database results to API response
          expect(res.body.id).to.equal(data.id);
          expect(res.body.title).to.equal(updatedNote.title);
          expect(res.body.content).to.equal(updatedNote.content);
        });
    });

    
  });

});