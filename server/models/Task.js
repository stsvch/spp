import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    filename:     { type: String, required: true },
    mimeType:     { type: String, default: "application/octet-stream" },
    size:         { type: Number, required: true },
    uploadedAt:   { type: Date, default: () => new Date() },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status:      { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },

    assignee:    { type: String, default: "" },

    project:     { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
