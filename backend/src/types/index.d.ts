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