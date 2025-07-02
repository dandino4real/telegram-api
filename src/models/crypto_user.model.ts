import mongoose, { Schema, Document } from "mongoose";

export interface ICRYPTO_User extends Document {
  telegramId?: string;
  username?: string;
  fullName?: string;
  botType: "crypto";
  country?: string;
  bybitUid?: string;
  blofinUid?: string;
  isApproved: boolean;
  isRejected: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  registeredVia?: 'bybit' | 'blofin' | 'both' | undefined;

  approvedBy?: {
    name: string;
    email: string;
  };
  rejectedBy?: {
    name: string;
    email: string;
  };
}

const UserSchema: Schema = new Schema({
  telegramId: { type: String, required: true , unique:true  },
  username: String,
  fullName: String,
  botType: { type: String, enum: ["crypto"], required: true },
  country: String,
  bybitUid: String,
  blofinUid: String,
  isApproved: { type: Boolean, default: false },
  isRejected: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  registeredVia: { type: String, enum: ['bybit', 'blofin', 'both', undefined] },
  approvedBy: {
    name: String,
    email: String,
  },
  rejectedBy: {
    name: String,
    email: String,
  },
});


export const CryptoUserModel = mongoose.model<ICRYPTO_User>(
  "CryptoUser",
  UserSchema
);
