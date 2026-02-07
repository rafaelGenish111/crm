const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'שם הוא שדה חובה'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'אימייל לא תקין'],
  },
  phone: {
    type: String,
    required: [true, 'טלפון הוא שדה חובה'],
    trim: true,
  },
  source: {
    type: String,
    enum: ['lead_conversion', 'direct', 'referral', 'other'],
    default: 'direct',
  },
  convertedFromLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
  },
  notes: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Student Portal Fields
  username: {
    type: String,
    trim: true,
    sparse: true,
  },
  password: {
    type: String,
    select: false, // לא להחזיר סיסמה ב-default queries
  },
  initialPassword: {
    type: String,
    trim: true,
  },
  passwordChanged: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ convertedFromLead: 1 });
customerSchema.index({ username: 1 }, { unique: true, sparse: true });

// Hash password before saving
customerSchema.pre('save', async function (next) {
  // אם זה עדכון של סיסמה ראשונית, לא להצפין אותה
  if (this.isModified('initialPassword') && this.initialPassword) {
    // שמירת הסיסמה הראשונית כפי שהיא (לא מוצפנת)
    if (typeof next === 'function') {
      return next();
    }
    return;
  }

  // אם זה עדכון של סיסמה רגילה, להצפין אותה
  if (!this.isModified('password') || !this.password) {
    if (typeof next === 'function') {
      return next();
    }
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    if (typeof next === 'function') {
      next();
    }
  } catch (error) {
    if (typeof next === 'function') {
      next(error);
    } else {
      throw error;
    }
  }
});

// Method to compare password
customerSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to compare initial password
customerSchema.methods.compareInitialPassword = function (candidatePassword) {
  return this.initialPassword === candidatePassword;
};

// Method to get customer without sensitive data
customerSchema.methods.toJSON = function () {
  const customerObject = this.toObject();
  delete customerObject.password;
  // לא למחוק את initialPassword כאן - נמחק רק ב-controller אם passwordChanged = true
  return customerObject;
};

module.exports = mongoose.model('Customer', customerSchema);
