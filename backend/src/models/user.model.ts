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
    },
    pieceNFTs: [
        {
            ipfsHash: {
                type: String,
                required: true
            },
            weight: {
                type: Number,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            value: {
                type: Number,
                required: true,
                default: 0.001
            }
        }
    ]
}, {timestamps: true});

const User = mongoose.model("User", UserSchema);

export default User;