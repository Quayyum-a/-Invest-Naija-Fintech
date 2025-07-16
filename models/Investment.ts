import mongoose, { type Document, Schema } from "mongoose"

export interface IInvestment extends Document {
  _id: string
  userId: mongoose.Types.ObjectId
  title: string
  description: string
  category: "stocks" | "bonds" | "real-estate" | "crypto" | "mutual-funds"
  amount: number
  expectedReturn: number
  duration: number // in months
  riskLevel: "low" | "medium" | "high"
  status: "active" | "completed" | "cancelled"
  startDate: Date
  endDate: Date
  currentValue: number
  createdAt: Date
  updatedAt: Date
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Investment title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Investment description is required"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: String,
      enum: ["stocks", "bonds", "real-estate", "crypto", "mutual-funds"],
      required: [true, "Investment category is required"],
    },
    amount: {
      type: Number,
      required: [true, "Investment amount is required"],
      min: [1000, "Minimum investment amount is ₦1,000"],
    },
    expectedReturn: {
      type: Number,
      required: [true, "Expected return is required"],
      min: [0, "Expected return cannot be negative"],
    },
    duration: {
      type: Number,
      required: [true, "Investment duration is required"],
      min: [1, "Minimum duration is 1 month"],
      max: [120, "Maximum duration is 120 months"],
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: [true, "Risk level is required"],
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    currentValue: {
      type: Number,
      default: function () {
        return this.amount
      },
    },
  },
  {
    timestamps: true,
  },
)

// Calculate end date before saving
InvestmentSchema.pre("save", function (next) {
  if (this.isNew) {
    const endDate = new Date(this.startDate)
    endDate.setMonth(endDate.getMonth() + this.duration)
    this.endDate = endDate
  }
  next()
})

export default mongoose.models.Investment || mongoose.model<IInvestment>("Investment", InvestmentSchema)
