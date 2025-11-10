import mongoose from "mongoose";
import bcrypt from "bcrypt";

const refreshSchema = new mongoose.Schema({
  tokenId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  login:   { type: String, required: true, unique: true, trim: true },
  password:{ type: String, required: true },
  role:    { type: String, enum: ["admin", "member"], default: "member" },
  refreshTokens: { type: [refreshSchema], default: [] }
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export const User = mongoose.model("User", userSchema);
