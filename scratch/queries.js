'use strict';

// const mongoose = require('mongoose');

// const { MONGODB_URI } = require('../config');

// const Note = require('../models/note');


//-- GET ALL--//
// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     const searchTerm = 'lady gaga'; //req.params...
//     let filter = {};

//     if (searchTerm) {
//       const re = new RegExp(searchTerm, 'i');
//       filter.title = { $regex: re };
//     }

//     return Note.find(filter)
//       .sort('created')
//       .then(results => {
//         console.log(results); //res.json(results)
//       })
//       .catch(console.error);
//   })
//   .then(() => {
//     return mongoose.disconnect()
//       .then(() => {
//         console.info('Disconnected');
//       });
//   })
//   .catch(err => {
//     console.error(`ERROR: ${err.message}`);
//     console.error(err);
//   });

const mongoose = require('mongoose');

const { MONGODB_URI } = require('../config');
const Note = require('../models/note');

mongoose.connect(MONGODB_URI)
  .then(() => Note.createIndexes())
  .then(() => {
    return Note.find(
      { $text: { $search: 'ways' } },
      { score: { $meta: 'textScore' }}
    ).sort( { score: { $meta: 'textScore' }})
      .then(results => {
        console.log(results);
      });
  })
  .then(() => {
    return mongoose.disconnect()
      .then(() => {
        console.info('Disconnected');
      });
  })
  .catch(err => {
    console.error(`ERROR: ${err.message}`);
    console.error(err);
  });
