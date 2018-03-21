'use strict';

const express = require('express');
// Create a router instance (aka "mini-app")
const router = express.Router();

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

/* ========== GET/READ ALL ITEM ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm } = req.query;
  let filter = {};
  let projection = {};
  let sort = 'created'; //this is the default sorting

  //change to use $or operator??
  if (searchTerm) {
    filter.$text = { $search: searchTerm};
    projection.score = { $meta: 'textScore'};
    sort = projection;
  }

  //this is the same as above
  // if (searchTerm) {
  //   filter = { $text: { $search: searchTerm}};
  //   projection = { score: { $meta: 'textScore'}};
  //   sort = projection;
  // }
  
  Note.find(filter, projection)
    .sort(sort) //so highest ranking search bubbles to top
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});


/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
  const { id } = req.params;

  //don't trust users
  if(!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }
  Note.findById(id)
    .then(result => {
      if(result) {
        res.json(result);
      } else {
        next(); //404
      }
    })
    .catch(next);
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content } = req.body;

  if(!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  //don't trust users
  // const requiredFields = ['title', 'content'];  
  // for (let i=0; i<requiredFields.length; i++) {
  //   const field = requiredFields[i];
  //   if (!(field in req.body)) {
  //     const message = `Missing \`${field}\` in request body`;
  //     return res.status(400).send(message);
  //   }
  // }

  const newNote = {
    title: title,
    content: content
  };

  Note.create(newNote)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result); //201 == Created
    })
    .catch(next);
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content } = req.body;

  //don't trust users
  if(!title) {
    const err = new Error('Mising `title` in request body');
    err.status = 400;
    return next(err);
  }

  if(!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  const updatedNote = { title, content };
  const options = { new: true };
  //need if statement - no content don't set property ??
  

  Note.findByIdAndUpdate(id, updatedNote, options )
    .then(result => {
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const { id } = req.params;

  Note.findByIdAndRemove(id)
    .then(count => {
      if(count) {
        res.status(204).end(); ///204 = "No Content"
      } else {
        next();
      }
    });
});

module.exports = router;
