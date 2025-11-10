import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status:      { type: String, enum: ["todo", "in-progress", "done"], default: "todo" },

    assignee:    { type: String, default: "" },

    project:     { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    attachments: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
      default: [],
    },
  },
  { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
