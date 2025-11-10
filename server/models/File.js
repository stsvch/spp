import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true, trim: true },
    mimeType:     { type: String, required: true, trim: true },
    size:         { type: Number, required: true, min: 0 },

    storedName:   { type: String, required: true, unique: true },

    project:      { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    task:         { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

fileSchema.virtual("id").get(function idGetter() {
  return this._id.toString();
});

fileSchema.set("toJSON", { virtuals: true });
fileSchema.set("toObject", { virtuals: true });

export const File = mongoose.model("File", fileSchema);
