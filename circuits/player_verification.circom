pragma circom 2.0.0;

include "circomlib/poseidon.circom";
include "circomlib/comparators.circom";
include "circomlib/multiplier.circom";
include "circomlib/switcher.circom";

template PlayerVerificationCircuit(numMoves, threshold, minRequiredMoves) {
    // Public inputs
    signal input publicAddress[2];
    signal input claimedSkillLevel;
    signal input accountAge; // Number of days since account creation
    
    // Private inputs (witness)
    signal input privateKey; // Private key of the player
    signal input actualMoveCount; // How many moves the player has actually made
    signal input gameplayMoves[numMoves]; // Array of player moves m_i
    signal input boardStates[numMoves]; // Array of board states s_i
    signal input moveOutcomeProbabilities[numMoves]; // P(m_i|θ_claimed, s_i) for each move
    
    // Output signals
    signal output valid; // Final verification result
    signal output calibrationStatus; // Indicates if player is still in calibration
    
    // 1. Verify player knows the private key associated with public address
    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== privateKey;
    
    // This is a simplified check - in practice, use proper ECC operations
    // to verify private key corresponds to public address
    signal calculatedPubX;
    signal calculatedPubY;
    calculatedPubX <-- calculatePubKeyX(privateKey);
    calculatedPubY <-- calculatePubKeyY(privateKey);
    
    // Check public key matches
    calculatedPubX === publicAddress[0];
    calculatedPubY === publicAddress[1];
    
    // 2. Check if user has enough gameplay history
    component enoughMoves = GreaterEqThan(32); // 32-bit comparison
    enoughMoves.in[0] <== actualMoveCount;
    enoughMoves.in[1] <== minRequiredMoves;
    
    // 3. For new users: Calculate a provisional validity based on account age
    component accountAgeCheck = GreaterEqThan(32);
    accountAgeCheck.in[0] <== accountAge;
    accountAgeCheck.in[1] <== 1; // At least 1 day old
    
    // 4. Calculate probability product only for available moves
    component moveSelector[numMoves];
    signal validProbabilities[numMoves];
    
    // Only use probabilities for moves that exist
    for (var i = 0; i < numMoves; i++) {
        component moveExists = LessThan(32);
        moveExists.in[0] <== i;
        moveExists.in[1] <== actualMoveCount;
        
        moveSelector[i] = Switcher();
        moveSelector[i].sel <== moveExists.out;
        moveSelector[i].L <== 1; // Default probability of 1 for non-existent moves
        moveSelector[i].R <== moveOutcomeProbabilities[i];
        validProbabilities[i] <== moveSelector[i].outL + moveSelector[i].outR - moveSelector[i].outL * moveSelector[i].sel;
    }
    
    // Calculate the product of available probabilities
    component multipliers[numMoves-1];
    signal intermediateProbProducts[numMoves];
    
    // Initialize with first probability
    intermediateProbProducts[0] <== validProbabilities[0];
    
    // Calculate the product of probabilities
    for (var i = 0; i < numMoves-1; i++) {
        multipliers[i] = Multiplier();
        multipliers[i].a <== intermediateProbProducts[i];
        multipliers[i].b <== validProbabilities[i+1];
        intermediateProbProducts[i+1] <== multipliers[i].out;
    }
    
    // Final probability product
    signal probabilityProduct;
    probabilityProduct <== intermediateProbProducts[numMoves-1];
    
    // 5. Verify the probability product exceeds threshold (if enough moves)
    component greaterThanThreshold = GreaterThan(64);
    greaterThanThreshold.in[0] <== probabilityProduct;
    greaterThanThreshold.in[1] <== threshold;
    
    // 6. Determine calibration status
    calibrationStatus <== 1 - enoughMoves.out;
    
    // 7. Final verification logic:
    // - If enough moves: verify using probability product
    // - If not enough moves: verify using account age check
    component finalVerificationSwitch = Switcher();
    finalVerificationSwitch.sel <== enoughMoves.out;
    finalVerificationSwitch.L <== accountAgeCheck.out; // New user validation
    finalVerificationSwitch.R <== greaterThanThreshold.out; // Experienced user validation
    
    valid <== finalVerificationSwitch.outL + finalVerificationSwitch.outR - finalVerificationSwitch.outL * finalVerificationSwitch.sel;
    
    // Auxiliary functions (implemented natively)
    function calculatePubKeyX(privateKey) {
        // In a real implementation, this would use elliptic curve operations
        // to derive public key X coordinate from private key
        return privateKey * 2 + 7; // Placeholder
    }
    
    function calculatePubKeyY(privateKey) {
        // Similar placeholder for Y coordinate calculation
        return privateKey * 3 + 11; // Placeholder
    }
}

// Example instantiation for:
// - Game with max 20 moves 
// - Threshold of 0.7 (scaled)
// - Minimum 10 moves required for full verification
component main {public [publicAddress, claimedSkillLevel, accountAge]} = 
    PlayerVerificationCircuit(20, 7000000, 10);