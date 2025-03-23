"use client";

import {
  APTOS_CONNECT_ACCOUNT_URL,
  AboutAptosConnect,
  AboutAptosConnectEducationScreen,
  AdapterNotDetectedWallet,
  AdapterWallet,
  AptosPrivacyPolicy,
  WalletItem,
  groupAndSortWallets,
  isAptosConnectWallet,
  isInstallRequired,
  truncateAddress,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { ArrowLeft, ArrowRight, ChevronDown, Copy, LogOut, User } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function WalletSelector() {
  const { account, connected, disconnect, wallet } = useWallet();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const closeDialog = useCallback(() => setIsDialogOpen(false), []);

  const copyAddress = useCallback(async () => {
    if (!account?.address) return;
    
    // Handle different types of address representation
    const addressStr = typeof account.address === 'string' 
      ? account.address 
      : account.address.toString?.() || account.address.toStringLong?.() || JSON.stringify(account.address);
    
    try {
      await navigator.clipboard.writeText(addressStr);
      toast({
        title: "Success",
        description: "Copied wallet address to clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy wallet address.",
      });
    }
  }, [account?.address, toast]);

  // Format the address properly based on the account structure
  const formatAddress = () => {
    if (!account || !account.address) return "Unknown";
    
    if (account.ansName) return account.ansName;
    
    // Handle different types of address representation
    const addressStr = typeof account.address === 'string' 
      ? account.address 
      : account.address.toString?.() || account.address.toStringLong?.() || JSON.stringify(account.address);
    
    return truncateAddress(addressStr);
  };

  return connected ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-4 py-2 rounded-full">
          {formatAddress()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white/10 backdrop-blur-lg border border-white/20">
        <DropdownMenuItem onSelect={copyAddress} className="gap-2 text-white hover:bg-white/10">
          <Copy className="h-4 w-4" /> Copy address
        </DropdownMenuItem>
        {wallet && isAptosConnectWallet(wallet) && (
          <DropdownMenuItem asChild>
            <a href={APTOS_CONNECT_ACCOUNT_URL} target="_blank" rel="noopener noreferrer" className="flex gap-2 text-white hover:bg-white/10">
              <User className="h-4 w-4" /> Account
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={disconnect} className="gap-2 text-white hover:bg-white/10">
          <LogOut className="h-4 w-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white px-4 py-2 rounded-full">
          Connect Wallet
        </Button>
      </DialogTrigger>
      <ConnectWalletDialog close={closeDialog} />
    </Dialog>
  );
}

interface ConnectWalletDialogProps {
  close: () => void;
}

function ConnectWalletDialog({ close }: ConnectWalletDialogProps) {
  const { wallets = [] } = useWallet();

  // We'll just use a simple flag instead of pathname checking since we don't have router context
  const isPublicMintPage = true; // Set this based on your app's needs

  const { aptosConnectWallets, availableWallets, installableWallets } = groupAndSortWallets(wallets);

  const hasAptosConnectWallets = !!aptosConnectWallets.length;

  return (
    <DialogContent className="max-h-screen overflow-auto bg-white/10 backdrop-blur-lg border border-white/20 text-white">
      <AboutAptosConnect renderEducationScreen={renderEducationScreen}>
        {isPublicMintPage ? (
          <>
            <DialogHeader className="flex flex-col items-center">
              <DialogTitle className="flex flex-col text-center leading-snug">
                <span>Log in or sign up</span>
                <span>with Social + Aptos Connect</span>
              </DialogTitle>
            </DialogHeader>
            {hasAptosConnectWallets && (
              <div className="flex flex-col gap-2 pt-3">
                {aptosConnectWallets.map((wallet) => (
                  <AptosConnectWalletRow key={wallet.name} wallet={wallet} onConnect={close} />
                ))}
                <p className="flex gap-1 justify-center items-center text-muted-foreground text-sm">
                  Learn more about{" "}
                  <AboutAptosConnect.Trigger className="flex gap-1 py-3 items-center text-foreground">
                    Aptos Connect <ArrowRight size={16} />
                  </AboutAptosConnect.Trigger>
                </p>
                <AptosPrivacyPolicy className="flex flex-col items-center py-1">
                  <p className="text-xs leading-5">
                    <AptosPrivacyPolicy.Disclaimer />{" "}
                    <AptosPrivacyPolicy.Link className="text-muted-foreground underline underline-offset-4" />
                    <span className="text-muted-foreground">.</span>
                  </p>
                  <AptosPrivacyPolicy.PoweredBy className="flex gap-1.5 items-center text-xs leading-5 text-muted-foreground" />
                </AptosPrivacyPolicy>
                <div className="flex items-center gap-3 pt-4 text-muted-foreground">
                  <div className="h-px w-full bg-secondary" />
                  Or
                  <div className="h-px w-full bg-secondary" />
                </div>
              </div>
            )}
          </>
        ) : (
          <DialogHeader className="flex flex-col items-center">
            <DialogTitle className="flex flex-col text-center leading-snug">
              <span>Connect a Wallet</span>
            </DialogTitle>
          </DialogHeader>
        )}
        <div className="flex flex-col gap-3 pt-3">
          {availableWallets.map((wallet) => (
            <WalletRow key={wallet.name} wallet={wallet} onConnect={close} />
          ))}
          {!!installableWallets.length && (
            <Collapsible className="flex flex-col gap-3">
              <CollapsibleTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-2 text-white hover:bg-white/10">
                  More wallets <ChevronDown />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-3">
                {installableWallets.map((wallet) => (
                  <WalletRow key={wallet.name} wallet={wallet} onConnect={close} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </AboutAptosConnect>
    </DialogContent>
  );
}

interface WalletRowProps {
  wallet: AdapterWallet | AdapterNotDetectedWallet;
  onConnect?: () => void;
}

function WalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem
      wallet={wallet}
      onConnect={onConnect}
      className="flex items-center justify-between px-4 py-3 gap-4 border rounded-md"
    >
      <div className="flex items-center gap-4">
        <WalletItem.Icon className="h-6 w-6" />
        <WalletItem.Name className="text-base font-normal" />
      </div>
      {isInstallRequired(wallet) ? (
        <Button size="sm" variant="ghost" asChild className="text-white hover:bg-white/10">
          <WalletItem.InstallLink />
        </Button>
      ) : (
        <WalletItem.ConnectButton asChild>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">Connect</Button>
        </WalletItem.ConnectButton>
      )}
    </WalletItem>
  );
}

function AptosConnectWalletRow({ wallet, onConnect }: WalletRowProps) {
  return (
    <WalletItem wallet={wallet} onConnect={onConnect}>
      <WalletItem.ConnectButton asChild>
        <Button size="lg" variant="outline" className="w-full gap-4 border border-white/20 text-white hover:bg-white/10">
          <WalletItem.Icon className="h-5 w-5" />
          <WalletItem.Name className="text-base font-normal" />
        </Button>
      </WalletItem.ConnectButton>
    </WalletItem>
  );
}

function renderEducationScreen(screen: AboutAptosConnectEducationScreen) {
  return (
    <>
      <DialogHeader className="grid grid-cols-[1fr_4fr_1fr] items-center space-y-0">
        <Button variant="ghost" size="icon" onClick={screen.cancel} className="text-white hover:bg-white/10">
          <ArrowLeft />
        </Button>
        <DialogTitle className="leading-snug text-base text-center">About Aptos Connect</DialogTitle>
      </DialogHeader>

      <div className="flex h-[162px] pb-3 items-end justify-center">
        <screen.Graphic />
      </div>
      <div className="flex flex-col gap-2 text-center pb-4">
        <screen.Title className="text-xl" />
        <screen.Description className="text-sm text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a]:text-foreground" />
      </div>

      <div className="grid grid-cols-3 items-center">
        <Button size="sm" variant="ghost" onClick={screen.back} className="justify-self-start text-white hover:bg-white/10">
          Back
        </Button>
        <div className="flex items-center gap-2 place-self-center">
          {screen.screenIndicators.map((ScreenIndicator, i) => (
            <ScreenIndicator key={i} className="py-4">
              <div className="h-0.5 w-6 transition-colors bg-muted [[data-active]>&]:bg-foreground" />
            </ScreenIndicator>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={screen.next} className="gap-2 justify-self-end text-white hover:bg-white/10">
          {screen.screenIndex === screen.totalScreens - 1 ? "Finish" : "Next"}
          <ArrowRight size={16} />
        </Button>
      </div>
    </>
  );
}