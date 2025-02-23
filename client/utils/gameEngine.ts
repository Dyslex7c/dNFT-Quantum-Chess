import { Chess } from "chess.js";

// Utility function to update piece weight based on evaluation scores
export const updatePieceWeight = async (
    ipfsHash: string,
    weight: number,
    R1: string,
    R2: string,
    source: string,
    destination: string,
    initialFen: string // Pass the initial FEN as input
): Promise<number> => {
    try {
        // Fetch the initial evaluation score
        const initialEvalResponse = await fetch(
            `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(initialFen)}&depth=10`
        );
        const initialEvalData = await initialEvalResponse.json();
        const initialEval = parseFloat(initialEvalData.evaluation);

        // Make the move on a copy of the game
        const gameCopy = new Chess(initialFen);
        gameCopy.move({ from: source, to: destination });

        // Convert the final board position to FEN
        const finalFen = gameCopy.fen();

        // Fetch the final evaluation score
        const finalEvalResponse = await fetch(
            `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(finalFen)}&depth=10`
        );
        const finalEvalData = await finalEvalResponse.json();
        const finalEval = parseFloat(finalEvalData.evaluation);

        // Calculate the evaluation difference
        const evalDifference = finalEval - initialEval;

        // Update the weight of the piece
        const delta = evalDifference * ((1+(parseInt(R2)-parseInt(R1))/600)/(1+(parseInt(R1)-parseInt(R2))/600)) * (1/30) * weight;

        const updatedWeight = weight + delta;

        // Update the weight in localStorage
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
        return weight; // Return the original weight if there's an error
    }
};