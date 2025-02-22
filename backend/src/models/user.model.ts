import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        min: 2,
        required: true
    },
    metamaskId: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 700,
        required: true
    }
}, {timestamps: true});

const User = mongoose.model("User", UserSchema);

export default User;