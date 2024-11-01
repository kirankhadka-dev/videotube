import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //one who is subscribing
      ref: "User",
    },

    channel: {
      type: Schema.Types.ObjectId, // one who is owner of channel i.e User
      ref: "User",
    },
  },

  {
    timestamps: true,
  }
);

const Subscription = new mongoose.model("Subscription", subscriptionSchema);

export { Subscription };
