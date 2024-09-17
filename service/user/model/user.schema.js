const mongoose = require('mongoose');
const CC = require('../../../config/constant_collection');
const timestamp = require('mongoose-timestamp');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  first_name: {
    type: mongoose.Schema.Types.String,
  },
  // middle_name: {
  //   type: mongoose.Schema.Types.String,
  // },
  last_name: {
    type: mongoose.Schema.Types.String,
  },
  email: {
    type: mongoose.Schema.Types.String,
    required: false,
    index: true,
    unique: true,
    sparse: true,
  },
  user_name: {
    type: mongoose.Schema.Types.String,
  },

  profile: {
    type: mongoose.Schema.Types.String,
  },
  password: {
    type: mongoose.Schema.Types.String,
  },
  social_id: {
    type: mongoose.Schema.Types.String,
  },
  sign_up_type: {
    type: mongoose.Schema.Types.String,
  },
  category_id: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: CC.M002_CATEGORY,
    default: [],
  },
  subcategory_id: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: CC.M002A_SUBCATEGORY,
    default: [],
  },
  interest_id: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: CC.M002A_SUBCATEGORY,
    default: [],
  },
  // bio: {
  //   type: mongoose.Schema.Types.String,
  // },

  friends: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: CC.U001_USERS,
    default: [],
    index: true,
  },

  close_friends: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: CC.U001_USERS,
    default: [],
    index: true,
  },
  languages_spoken: {
    type: [mongoose.Schema.Types.String],
    index: true,
  },
  nationalities: {
    type: [mongoose.Schema.Types.String],
    index: true,
  },
  pets: [
    {
      name: mongoose.Schema.Types.String,
      photo: mongoose.Schema.Types.String,
    },
  ],
  // mobile: {
  //   type: mongoose.Schema.Types.String,
  // },
  // post_streak: {
  //   type: mongoose.Schema.Types.Map,
  //   default: {
  //     streak_2: {
  //       completed: false,
  //       count: 0,
  //     },
  //     streak_3: {
  //       completed: false,
  //       count: 0,
  //     },
  //     streak_7: {
  //       completed: false,
  //       count: 0,
  //     },
  //   },
  // },
  // good_fella_award: {
  //   type: mongoose.Schema.Types.Map,
  //   default: {
  //     completed: false,
  //     count: 0,
  //   },
  // },
  // most_liked_weekly_post: {
  //   type: mongoose.Schema.Types.Map,
  //   default: {
  //     completed: false,
  //     count: 0,
  //     post_ids: [],
  //   },
  // },
  // thought_leader_badge: {
  //   type: mongoose.Schema.Types.Map,
  //   default: {
  //     completed: false,
  //     count: 0,
  //     post_ids: [],
  //   },
  // },
  // first_post_badge: {
  //   type: mongoose.Schema.Types.Mixed,
  //   default: {
  //     toShow: false,
  //     isShown: false,
  //   },
  // },
  // tenth_post_badge: {
  //   type: mongoose.Schema.Types.Mixed,
  //   default: {
  //     toShow: false,
  //     isShown: false,
  //   },
  // },
  // twenty_post_badge: {
  //   type: mongoose.Schema.Types.Mixed,
  //   default: {
  //     toShow: false,
  //     isShown: false,
  //   },
  // },
  // fifty_post_badge: {
  //   type: mongoose.Schema.Types.Mixed,
  //   default: {
  //     toShow: false,
  //     isShown: false,
  //   },
  // },
  // hundred_post_badge: {
  //   type: mongoose.Schema.Types.Mixed,
  //   default: {
  //     toShow: false,
  //     isShown: false,
  //   },
  // },
  // invite_badge: {
  //   type: mongoose.Schema.Types.Boolean,
  //   default: false,
  //   index: true,
  // },
  // invite_count: {
  //   type: mongoose.Schema.Types.Number,
  //   default: 0,
  // },
  // gender: {
  //   type: mongoose.Schema.Types.String,
  // },
  token: {
    type: mongoose.Schema.Types.String,
  },
  status: {
    type: mongoose.Schema.Types.String,
    enum: ["Active", "Pending", "In-Active"],
    default: "Active",
    index: true,
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  lastActive: {
    type: mongoose.Schema.Types.Date,
  },
  is_verified: {
    type: mongoose.Schema.Types.Boolean,
    default: false,
    index: true,
  },
  // user_type: {
  //   type: mongoose.Schema.Types.String,
  //   enum: ["sharer", "watcher"],
  //   index: true,
  // },
  // talks_about: {
  //   type: [String],
  //   index: true,
  // },
  social_links: {
    instagram: String,
    linkedin: String,
    twitter: String,
  },
  mobile_number: {
    type: mongoose.Schema.Types.String,
    index: true,
    unique: true,
  },
});

// encrypt password before save
UserSchema.pre('save', function(next) {
  const user = this;
  var SALTING_ROUNDS = Number(process.env.SALT_ROUND);
  if(!user.isModified || !user.isNew) {
    next();
  } else {
    if(user.password){
      bcrypt.hash(user.password, SALTING_ROUNDS, function(err, hash) {
        if (err) {
          console.log('Error hashing password for user', user.first_name);
          next(err);
        } else {
          user.password = hash;
          next();
        }
      });
    }else{
      next();
    }
    
  }
});

UserSchema.plugin(timestamp);
const UserModel = mongoose.model(CC.U001_USERS,UserSchema);
module.exports = UserModel;