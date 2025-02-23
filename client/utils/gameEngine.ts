import { Chess } from "chess.js";

// Utility function to update piece weight based on evaluation scores
export const updatePieceWeight = async (
    ipfsHash: string,
    weight: number,
    R1: string,
    R2: string,
    source: string,
    destination: string,
    initialFen: string,
    setDel: React.Dispatch<React.SetStateAction<number>>
): Promise<number> => {
    try {
        const chess = new Chess();
        chess.load(initialFen);

        const gameCopy = new Chess(initialFen);
        const moveResult = gameCopy.move({ from: source, to: destination });

        if (!moveResult) {
            throw new Error(`Invalid move: ${source} to ${destination}`);
        }

        if (gameCopy.isCheckmate()) {
            console.log("Checkmate detected! Assigning default delta = 4.");
            setDel((prev) => prev + 4);
            return weight + 4;
        }

        const finalFen = gameCopy.fen();

        const initialEvalResponse = await fetch(
            `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(initialFen)}&depth=10`
        );
        const initialEvalData = await initialEvalResponse.json();
        const initialEval = parseFloat(initialEvalData.evaluation);

        const finalEvalResponse = await fetch(
            `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(finalFen)}&depth=10`
        );
        const finalEvalData = await finalEvalResponse.json();
        const finalEval = parseFloat(finalEvalData.evaluation);

        const evalDifference = finalEval - initialEval;

        const delta = evalDifference * ((1 + (parseInt(R2) - parseInt(R1)) / 600) / (1 + (parseInt(R1) - parseInt(R2)) / 600)) * (1 / 30) * weight;
        setDel((prev) => prev + delta);

        const updatedWeight = weight + delta;

        const storedNFTs = localStorage.getItem("selectedNFTs");
        if (storedNFTs) {
            const nfts = JSON.parse(storedNFTs);
            const updatedNFTs = nfts.map((nft: { ipfsHash: string; weight: number }) =>
                nft.ipfsHash === ipfsHash ? { ...nft, weight: updatedWeight } : nft
            );
            localStorage.setItem("selectedNFTs", JSON.stringify(updatedNFTs));
        }

        return updatedWeight;
    } catch (error) {
        console.error("Error updating piece weight:", error);
        return weight;
    }
};