import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    weight: { type: Number, required: true },
    calories: { type: Number, default: 0 },
    bmi: { type: Number, required: true },
    notes: { type: String, maxlength: 500 },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: { type: String, required: true, enum: ["male", "female", "other"] },
    height: { type: Number, required: true, min: 50, max: 300 },
    weight: { type: Number, required: true, min: 20, max: 500 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: { type: String, required: true, minlength: 8 },
    bmi: {
      type: Number,
      default: function () {
        return this.weight / ((this.height / 100) * (this.height / 100));
      },
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    progress: [progressSchema],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate BMI
userSchema.pre("save", function (next) {
  if (this.isModified("weight") || this.isModified("height")) {
    this.bmi = this.weight / ((this.height / 100) * (this.height / 100));
  }
  next();
});

// Instance method: BMI category
userSchema.methods.getBMICategory = function () {
  const bmi = this.bmi;
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

// Instance method: add progress entry
userSchema.methods.addProgress = function (weight, calories, notes) {
  const bmi = weight / ((this.height / 100) * (this.height / 100));
  this.progress.push({
    weight,
    calories: calories || 0,
    bmi,
    notes: notes || "",
  });
  this.weight = weight;
  this.bmi = bmi;
  return this.save();
};

const User = mongoose.model("User", userSchema);
export default User;
