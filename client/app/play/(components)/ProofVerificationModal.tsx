import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import { groth16 } from "snarkjs";

const ProofVerificationModal = ({ onClose }: { onClose: () => void }) => {
  const [proofFile, setProofFile] = useState(null);
  const [publicFile, setPublicFile] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  interface ProofVerificationModalProps {
    onClose: () => void;
  }

  interface FileUploadEvent extends React.ChangeEvent<HTMLInputElement> {
    target: HTMLInputElement & EventTarget;
  }

  const handleFileUpload = (event: FileUploadEvent, fileType: 'proof' | 'public') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (fileType === 'proof') {
          setProofFile(json);
        } else {
          setPublicFile(json);
        }
      } catch (error) {
        console.error('Error parsing JSON file:', error);
      }
    };

    reader.readAsText(file);
  };

  const verifyProof = async () => {
    if (!proofFile || !publicFile) {
      return;
    }

    setIsVerifying(true);
    try {
      const vKey = await fetch('/verification_key.json').then(res => res.json());
      const verified = await groth16.verify(vKey, publicFile, proofFile);
      setVerificationStatus(verified);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus(false);
    }
    setIsVerifying(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-2xl p-8 backdrop-blur-sm border border-blue-500/20 shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="text-blue-400" />
          Verify ZK Proof
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Upload Proof File (proof.json)</label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleFileUpload(e, 'proof')}
              className="w-full bg-blue-900/20 rounded-lg p-2 border border-blue-500/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Upload Public Inputs File (public.json)</label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => handleFileUpload(e, 'public')}
              className="w-full bg-blue-900/20 rounded-lg p-2 border border-blue-500/30"
            />
          </div>

          {verificationStatus !== null && (
            <div className={`flex items-center gap-2 ${verificationStatus ? 'text-green-400' : 'text-red-400'}`}>
              {verificationStatus ? (
                <>
                  <CheckCircle />
                  <span>Proof verified successfully!</span>
                </>
              ) : (
                <>
                  <XCircle />
                  <span>Proof verification failed!</span>
                </>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={verifyProof}
              disabled={!proofFile || !publicFile || isVerifying}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isVerifying ? 'Verifying...' : 'Verify Proof'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-red-500/30 hover:bg-red-900/20 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofVerificationModal;