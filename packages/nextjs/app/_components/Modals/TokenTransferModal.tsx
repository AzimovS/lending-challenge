import { useState } from "react";
import { Address as AddressType, parseEther } from "viem";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { Address, AddressInput, IntegerInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

type TokenTransferModalProps = {
  myUSDBalance: string;
  connectedAddress: string;
  modalId: string;
};

export const TokenTransferModal = ({ myUSDBalance, connectedAddress, modalId }: TokenTransferModalProps) => {
  const [loading, setLoading] = useState(false);
  const [sendValue, setSendValue] = useState("");

  const [inputAddress, setInputAddress] = useState<AddressType>();

  const { writeContractAsync: writeCornContract } = useScaffoldWriteContract({
    contractName: "Corn",
  });

  const handleSend = async () => {
    try {
      await writeCornContract({
        functionName: "transfer",
        args: [inputAddress, parseEther(sendValue)],
      });
      setInputAddress("");
      setSendValue("");
    } catch (error) {
      console.error("Error sending corn:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <input type="checkbox" id={`${modalId}`} className="modal-toggle" />
      <label htmlFor={`${modalId}`} className="modal cursor-pointer">
        <label className="modal-box relative">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3">Send MyUSD</h3>
          <label htmlFor={`${modalId}`} className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>
          <div className="space-y-2">
            <div className="flex space-x-4">
              <div>
                <span className="text-sm font-bold">From:</span>
                <Address address={connectedAddress} onlyEnsOrAddress />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold pl-3">Available:</span>
                <span className="pl-3">{myUSDBalance} MyUSD</span>
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <AddressInput
                placeholder="Destination Address"
                value={inputAddress ?? ""}
                onChange={value => setInputAddress(value as AddressType)}
              />
              <IntegerInput
                value={sendValue}
                onChange={newValue => {
                  setSendValue(newValue);
                }}
                placeholder="Amount"
                disableMultiplyBy1e18
              />
              <button className="h-10 btn btn-primary btn-sm px-2 rounded-full" onClick={handleSend} disabled={loading}>
                {!loading ? (
                  <BanknotesIcon className="h-6 w-6" />
                ) : (
                  <span className="loading loading-spinner loading-sm"></span>
                )}
                <span>Send</span>
              </button>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
