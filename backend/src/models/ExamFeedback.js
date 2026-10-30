const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    attemptId: { type: mongoose.Schema.Types.ObjectId, ref: "Attempt", required: true, unique: true },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: "" },
  },
  { collection: "exam_feedback", timestamps: true },
);

module.exports = mongoose.model("ExamFeedback", schema);
