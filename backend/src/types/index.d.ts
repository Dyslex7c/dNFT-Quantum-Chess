import { Types } from "mongoose";

export interface PieceProps {
    ipfsHash: string;
    weight: number;
    name: string;
    value: number;
}

export interface RegisterProps {
    userName: string;
    metamaskId: string;
    pieceNFTs: PieceProps[];
}

export interface PieceProps {
    piece: string;
    weight: number;
    ipfsHash: string;
    position: string;
}

interface NFT {
    _id: Types.ObjectId;
    ipfsHash: string;
    value: number;
    weight: number;
    name: string;
}