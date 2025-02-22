pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

// Helper function to calculate modular inverse
function modInverse(a, m) {
    if (a < 0) a = (a % m) + m;
    
    var x = extendedGCDX(a, m);
    
    if (x == 0) {
        return 0;
    } else {
        return (x % m + m) % m;
    }
}

// Extended GCD helper function
function extendedGCDX(a, b) {
    if (a == 0) {
        return 0;
    }
    
    var x1 = extendedGCDX(b % a, a);
    var x = x1 - (b \ a) * x1;
    
    return x;
}

// Calculate public key X coordinate from private key
function calculatePubKeyX(privateKey) {
    var p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
    var n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    var Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    var Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
    
    if (privateKey <= 0 || privateKey >= n) {
        return 0;
    }
    
    var x = Gx;
    var y = Gy;
    var result_x = 0;
    var result_y = 0;
    var point_at_infinity = 1;
    
    for (var i = 0; i < 256; i++) {
        var should_add = (privateKey >> i) & 1;
        var valid_point = (y != 0);
        
        if (should_add) {
            if (point_at_infinity == 1) {
                result_x = x;
                result_y = y;
                point_at_infinity = 0;
            } else {
                var slope;
                if (result_x == x) {
                    var numerator = (3 * x * x) % p;
                    var denominator = (2 * y) % p;
                    var denominator_inv = modInverse(denominator, p);
                    slope = (numerator * denominator_inv) % p;
                } else {
                    var numerator = (y > result_y) ? y - result_y : p - (result_y - y);
                    var denominator = (x > result_x) ? x - result_x : p - (result_x - x);
                    var denominator_inv = modInverse(denominator, p);
                    slope = (numerator * denominator_inv) % p;
                }
                
                var new_x = (slope * slope - result_x - x) % p;
                if (new_x < 0) new_x += p;
                var new_y = (slope * (result_x - new_x) - result_y) % p;
                if (new_y < 0) new_y += p;
                
                result_x = new_x;
                result_y = new_y;
            }
        }
        
        if (i < 255 && valid_point) {
            var numerator = (3 * x * x) % p;
            var denominator = (2 * y) % p;
            var denominator_inv = modInverse(denominator, p);
            var slope = (numerator * denominator_inv) % p;
            
            var new_x = (slope * slope - 2 * x) % p;
            if (new_x < 0) new_x += p;
            var new_y = (slope * (x - new_x) - y) % p;
            if (new_y < 0) new_y += p;
            
            x = new_x;
            y = new_y;
        }
    }
    
    return result_x;
}

// Calculate public key Y coordinate from private key
function calculatePubKeyY(privateKey) {
    var p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
    var n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    var Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
    var Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
    
    if (privateKey <= 0 || privateKey >= n) {
        return 0;
    }
    
    var x = Gx;
    var y = Gy;
    var result_x = 0;
    var result_y = 0;
    var point_at_infinity = 1;
    
    for (var i = 0; i < 256; i++) {
        var should_add = (privateKey >> i) & 1;
        var valid_point = (y != 0);
        
        if (should_add) {
            if (point_at_infinity == 1) {
                result_x = x;
                result_y = y;
                point_at_infinity = 0;
            } else {
                var slope;
                if (result_x == x) {
                    var numerator = (3 * x * x) % p;
                    var denominator = (2 * y) % p;
                    var denominator_inv = modInverse(denominator, p);
                    slope = (numerator * denominator_inv) % p;
                } else {
                    var numerator = (y > result_y) ? y - result_y : p - (result_y - y);
                    var denominator = (x > result_x) ? x - result_x : p - (result_x - x);
                    var denominator_inv = modInverse(denominator, p);
                    slope = (numerator * denominator_inv) % p;
                }
                
                var new_x = (slope * slope - result_x - x) % p;
                if (new_x < 0) new_x += p;
                var new_y = (slope * (result_x - new_x) - result_y) % p;
                if (new_y < 0) new_y += p;
                
                result_x = new_x;
                result_y = new_y;
            }
        }
        
        if (i < 255 && valid_point) {
            var numerator = (3 * x * x) % p;
            var denominator = (2 * y) % p;
            var denominator_inv = modInverse(denominator, p);
            var slope = (numerator * denominator_inv) % p;
            
            var new_x = (slope * slope - 2 * x) % p;
            if (new_x < 0) new_x += p;
            var new_y = (slope * (x - new_x) - y) % p;
            if (new_y < 0) new_y += p;
            
            x = new_x;
            y = new_y;
        }
    }
    
    return result_y;
}

// Main PrivateKeyVerification template
template PrivateKeyVerification() {
    // Public inputs
    signal input publicAddress[2];
    
    // Private inputs (witness)
    signal input privateKey;
    
    // Output signals
    signal output valid;
    
    // Verify player knows the private key associated with public address
    component poseidon = Poseidon(1);
    poseidon.inputs[0] <== privateKey;
    
    signal calculatedPubX;
    signal calculatedPubY;
    calculatedPubX <-- calculatePubKeyX(privateKey);
    calculatedPubY <-- calculatePubKeyY(privateKey);
    
    // Check public key matches
    calculatedPubX === publicAddress[0];
    calculatedPubY === publicAddress[1];
    
    // Set validity
    valid <== 1;
}

// Main component instantiation
component main {public [publicAddress]} = PrivateKeyVerification();