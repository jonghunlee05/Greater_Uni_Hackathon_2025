import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { HomeIcon, Hammer, Heart, Search } from "lucide-react";
import sofaImage from "@/assets/sofa-2s.jpg";
import lampImage from "@/assets/lamp-vintage.jpg";
import deskImage from "@/assets/desk-malm.jpg";
import tableImage from "@/assets/table-dining.jpg";
import shelfImage from "@/assets/shelf-book.jpg";
import chairImage from "@/assets/chair-ergonomic.jpg";
type BidActivity = {
  user: string;
  amount: number;
  timestamp: number;
};
type AuctionItem = {
  id: string;
  title: string;
  condition: string;
  startingPrice: number;
  minIncrement: number;
  buyNow: number;
  endsInMinutes: number;
  imageEmoji: string;
  imageUrl: string;
  currentBid?: number;
  endTime?: number;
  status?: "live" | "ended" | "sold";
  bidMessage?: string;
  recentBids?: BidActivity[];
};
const INITIAL_ITEMS: AuctionItem[] = [{
  id: "sofa-2s",
  title: "Two-Seater Sofa",
  condition: "Good",
  startingPrice: 120,
  minIncrement: 5,
  buyNow: 240,
  endsInMinutes: 18,
  imageEmoji: "🛋️",
  imageUrl: sofaImage
}, {
  id: "lamp-vintage",
  title: "Vintage Floor Lamp",
  condition: "Very Good",
  startingPrice: 40,
  minIncrement: 5,
  buyNow: 95,
  endsInMinutes: 12,
  imageEmoji: "💡",
  imageUrl: lampImage
}, {
  id: "desk-malm",
  title: "IKEA MALM Desk",
  condition: "Fair",
  startingPrice: 55,
  minIncrement: 5,
  buyNow: 130,
  endsInMinutes: 25,
  imageEmoji: "🧰",
  imageUrl: deskImage
}, {
  id: "table-dining",
  title: "Dining Table Set (4 Chairs)",
  condition: "Good",
  startingPrice: 110,
  minIncrement: 10,
  buyNow: 260,
  endsInMinutes: 9,
  imageEmoji: "🍽️",
  imageUrl: tableImage
}, {
  id: "shelf-book",
  title: "Bookshelf, 5-Tier",
  condition: "Good",
  startingPrice: 30,
  minIncrement: 5,
  buyNow: 80,
  endsInMinutes: 30,
  imageEmoji: "📚",
  imageUrl: shelfImage
}, {
  id: "chair-ergonomic",
  title: "Ergonomic Office Chair",
  condition: "Very Good",
  startingPrice: 75,
  minIncrement: 5,
  buyNow: 180,
  endsInMinutes: 14,
  imageEmoji: "🪑",
  imageUrl: chairImage
}];
type Transaction = {
  id: string;
  type: "deposit" | "gamble_win" | "gamble_loss" | "rent_payment" | "withdrawal";
  amount: number;
  timestamp: number;
  description: string;
};
const Index = () => {
  const [currentView, setCurrentView] = useState<"home" | "rent" | "furniture" | "wallet" | "landlord">("home");

  // Wallet State
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  // Landlord Approval State
  const [landlordEmail, setLandlordEmail] = useState<string>("");
  const [propertyLink, setPropertyLink] = useState<string>("");
  const [approvalMessage, setApprovalMessage] = useState<string>(`Dear Landlord/Estate Agent,\n\nI am writing to request your approval to use RentRoll, a service that allows me to potentially reduce my monthly rent payment through a gamble system.\n\nHow it works:\n- I can gamble up to 50% of my rent amount\n- 40% chance to win and save that amount\n- 60% chance to lose and pay an additional 40% penalty\n\nAll payments will still be made in full and on time. I would only use this service with your explicit written consent.\n\nThank you for considering this request.\n\nBest regards`);
  const [approvalSent, setApprovalSent] = useState<boolean>(false);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [showAdminToggle, setShowAdminToggle] = useState<boolean>(false);

  // Credit Card State
  const [cardNumber, setCardNumber] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCVV, setCardCVV] = useState<string>("");
  const [cardName, setCardName] = useState<string>("");

  // Rent Gamble State
  const [totalRent, setTotalRent] = useState<string>("");
  const [gambleAmount, setGambleAmount] = useState<string>("");
  const [result, setResult] = useState<{
    type: "win" | "lose" | "error" | null;
    message: string;
  }>({
    type: null,
    message: ""
  });

  // Auction State
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("ending-soon");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "ending-soon" | "sold">("all");
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});

  // Load wallet data and approval status from localStorage
  useEffect(() => {
    const savedBalance = localStorage.getItem("walletBalance");
    const savedTransactions = localStorage.getItem("walletTransactions");
    const savedApproval = localStorage.getItem("landlordApproval");
    if (savedBalance) {
      setBalance(parseFloat(savedBalance));
    }
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
    if (savedApproval === "true") {
      setIsApproved(true);
    }
  }, []);

  // Save wallet data to localStorage
  useEffect(() => {
    localStorage.setItem("walletBalance", balance.toString());
    localStorage.setItem("walletTransactions", JSON.stringify(transactions));
  }, [balance, transactions]);

  // Initialize auction items on mount
  useEffect(() => {
    const now = Date.now();
    const savedBids = localStorage.getItem("auctionBids");
    const savedWatchlist = localStorage.getItem("auctionWatchlist");
    const bidsData = savedBids ? JSON.parse(savedBids) : {};
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
    const initializedItems = INITIAL_ITEMS.map(item => ({
      ...item,
      currentBid: bidsData[item.id] || item.startingPrice,
      endTime: now + item.endsInMinutes * 60 * 1000,
      status: "live" as const,
      bidMessage: "",
      recentBids: []
    }));
    setItems(initializedItems);
  }, []);

  // Countdown timer and random competing bids
  useEffect(() => {
    if (currentView !== "furniture" || items.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setItems(prevItems => prevItems.map(item => {
        if (item.status === "sold" || item.status === "ended") return item;
        const timeLeft = (item.endTime || 0) - now;
        if (timeLeft <= 0) {
          return {
            ...item,
            status: "ended" as const,
            bidMessage: item.currentBid! > item.startingPrice ? "SOLD" : "UNSOLD"
          };
        }

        // Random competing bid (15-30s intervals)
        if (Math.random() < 0.05) {
          // ~5% chance per second = avg 20s
          const increase = Math.floor(item.minIncrement * (1 + Math.random() * 0.2));
          const newBid = (item.currentBid || item.startingPrice) + increase;

          // Save to localStorage
          const savedBids = localStorage.getItem("auctionBids");
          const bidsData = savedBids ? JSON.parse(savedBids) : {};
          bidsData[item.id] = newBid;
          localStorage.setItem("auctionBids", JSON.stringify(bidsData));
          const randomUser = `user_${Math.floor(Math.random() * 15) + 1}`;
          const newBidActivity: BidActivity = {
            user: randomUser,
            amount: newBid,
            timestamp: Date.now()
          };
          return {
            ...item,
            currentBid: newBid,
            bidMessage: "New bid placed!",
            recentBids: [newBidActivity, ...(item.recentBids || [])].slice(0, 3)
          };
        }
        return item;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentView, items.length]);
  const toggleWatchlist = (itemId: string) => {
    const newWatchlist = watchlist.includes(itemId) ? watchlist.filter(id => id !== itemId) : [...watchlist, itemId];
    setWatchlist(newWatchlist);
    localStorage.setItem("auctionWatchlist", JSON.stringify(newWatchlist));
  };
  const placeBid = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const bidAmount = parseFloat(bidInputs[itemId] || "0");
    const minBid = (item.currentBid || item.startingPrice) + item.minIncrement;
    if (isNaN(bidAmount) || bidAmount < minBid) {
      setItems(prevItems => prevItems.map(i => i.id === itemId ? {
        ...i,
        bidMessage: `⚠️ Minimum bid: £${minBid.toFixed(2)}`
      } : i));
      return;
    }

    // Update bid
    const savedBids = localStorage.getItem("auctionBids");
    const bidsData = savedBids ? JSON.parse(savedBids) : {};
    bidsData[itemId] = bidAmount;
    localStorage.setItem("auctionBids", JSON.stringify(bidsData));
    const newBidActivity: BidActivity = {
      user: "You",
      amount: bidAmount,
      timestamp: Date.now()
    };
    setItems(prevItems => prevItems.map(i => i.id === itemId ? {
      ...i,
      currentBid: bidAmount,
      bidMessage: "✅ Bid placed successfully!",
      recentBids: [newBidActivity, ...(i.recentBids || [])].slice(0, 3)
    } : i));
    setBidInputs(prev => ({
      ...prev,
      [itemId]: ""
    }));
    setTimeout(() => {
      setItems(prevItems => prevItems.map(i => i.id === itemId ? {
        ...i,
        bidMessage: ""
      } : i));
    }, 3000);
  };
  const buyNow = (itemId: string) => {
    setItems(prevItems => prevItems.map(i => i.id === itemId ? {
      ...i,
      status: "sold",
      bidMessage: "🎉 Bought! Item is yours."
    } : i));
  };
  const getFilteredItems = () => {
    let filtered = [...items];

    // Search
    if (searchQuery) {
      filtered = filtered.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Status filter
    if (statusFilter === "live") {
      filtered = filtered.filter(item => item.status === "live");
    } else if (statusFilter === "ending-soon") {
      const now = Date.now();
      filtered = filtered.filter(item => {
        const timeLeft = (item.endTime || 0) - now;
        return item.status === "live" && timeLeft <= 10 * 60 * 1000;
      });
    } else if (statusFilter === "sold") {
      filtered = filtered.filter(item => item.status === "sold" || item.status === "ended");
    }

    // Watchlist
    if (showWatchlistOnly) {
      filtered = filtered.filter(item => watchlist.includes(item.id));
    }

    // Sort
    if (sortBy === "ending-soon") {
      filtered.sort((a, b) => (a.endTime || 0) - (b.endTime || 0));
    } else if (sortBy === "highest-bid") {
      filtered.sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
    } else if (sortBy === "lowest-bid") {
      filtered.sort((a, b) => (a.currentBid || 0) - (b.currentBid || 0));
    }
    return filtered;
  };
  const getTimeLeft = (endTime: number) => {
    const timeLeft = endTime - Date.now();
    if (timeLeft <= 0) return "ENDED";
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor(timeLeft % 60000 / 1000);
    return `${minutes}m ${seconds}s`;
  };
  const getProgress = (endTime: number, endsInMinutes: number) => {
    const totalTime = endsInMinutes * 60 * 1000;
    const elapsed = totalTime - (endTime - Date.now());
    return Math.min(100, Math.max(0, elapsed / totalTime * 100));
  };
  const handleGamble = () => {
    const rent = parseFloat(totalRent);
    const gamble = parseFloat(gambleAmount);

    // Validation
    if (isNaN(rent) || isNaN(gamble) || rent <= 0 || gamble <= 0) {
      setResult({
        type: "error",
        message: "⚠️ Please enter valid amounts for both fields."
      });
      return;
    }
    if (gamble > rent / 2) {
      setResult({
        type: "error",
        message: "⚠️ You can only gamble up to 50% of your rent."
      });
      return;
    }

    // Gambling logic: 40% chance to win, 60% chance to lose
    const loseChance = 0.6;
    const randomRoll = Math.random();
    if (randomRoll > loseChance) {
      // WIN
      const newRent = rent - gamble;
      const savings = gamble;
      setBalance(prev => prev + savings);
      addGambleTransaction("win", savings, `Won gamble! Saved £${savings.toFixed(2)} on rent`);
      setResult({
        type: "win",
        message: `🎉 YOU WON! 🎉\nYou saved £${savings.toFixed(2)}! Your new rent is £${newRent.toFixed(2)}.\n\nYour balance has been credited.`
      });
    } else {
      // LOSE
      const penalty = gamble * 0.4;
      const newRent = rent + penalty;
      setBalance(prev => prev - penalty);
      addGambleTransaction("loss", penalty, `Lost gamble. Penalty: £${penalty.toFixed(2)}`);
      setResult({
        type: "lose",
        message: `😥 Ouch! You lost. 😥\nYou pay an extra £${penalty.toFixed(2)}. Your new total is £${newRent.toFixed(2)}.\n\nPenalty deducted from balance.`
      });
    }
  };
  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: "deposit",
      amount: amount,
      timestamp: Date.now(),
      description: `Deposited £${amount.toFixed(2)}`
    };
    setBalance(prev => prev + amount);
    setTransactions(prev => [newTransaction, ...prev]);
    setDepositAmount("");
  };
  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      return;
    }
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: "withdrawal",
      amount: -amount,
      timestamp: Date.now(),
      description: `Withdrew £${amount.toFixed(2)}`
    };
    setBalance(prev => prev - amount);
    setTransactions(prev => [newTransaction, ...prev]);
    setWithdrawAmount("");
  };
  const handlePayRent = (amount: number) => {
    if (amount > balance) {
      return false;
    }
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: "rent_payment",
      amount: -amount,
      timestamp: Date.now(),
      description: `Paid rent £${amount.toFixed(2)}`
    };
    setBalance(prev => prev - amount);
    setTransactions(prev => [newTransaction, ...prev]);
    return true;
  };
  const addGambleTransaction = (type: "win" | "loss", amount: number, description: string) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: type === "win" ? "gamble_win" : "gamble_loss",
      amount: type === "win" ? amount : -amount,
      timestamp: Date.now(),
      description
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };
  const handleSendApproval = () => {
    if (!landlordEmail || !propertyLink) {
      return;
    }

    // Mock sending email
    setApprovalSent(true);
    setTimeout(() => setApprovalSent(false), 5000);
  };

  const handleAdminApproval = () => {
    setIsApproved(!isApproved);
    localStorage.setItem("landlordApproval", (!isApproved).toString());
  };
  const goHome = () => {
    setCurrentView("home");
    setResult({
      type: null,
      message: ""
    });
  };

  const getGradientClass = () => {
    switch (currentView) {
      case 'home': return 'gradient-home';
      case 'rent': return 'gradient-gamble';
      case 'furniture': return 'gradient-auctions';
      case 'wallet': return 'gradient-wallet';
      case 'landlord': return 'gradient-landlord';
      default: return 'gradient-home';
    }
  };

  return <div className={`min-h-screen flex flex-col items-center justify-center p-4 gap-8 ${getGradientClass()}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-2">Rent Roll</h1>
        <p className="text-muted-foreground">Choose your game.</p>
      </div>

      {/* Home Menu */}
      {currentView === "home" && <div className="w-full max-w-3xl">
          {/* Balance Display */}
          <Card className="mb-6 bg-card/80 backdrop-blur-sm border-2 border-primary shadow-xl">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm mb-2">Your Balance</p>
              <p className="text-4xl font-bold text-primary">£{balance.toFixed(2)}</p>
              <Button onClick={() => setCurrentView("wallet")} variant="outline" size="sm" className="mt-4">
                Manage Wallet
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card id="nav-rent" className={`bg-card border-2 shadow-xl ${isApproved ? 'border-primary cursor-pointer hover:bg-card/80 transition-all duration-200 hover:scale-105' : 'border-muted-foreground/30 cursor-not-allowed opacity-60'}`} onClick={() => isApproved && setCurrentView("rent")}>
            <CardContent className="p-8 text-center relative">
              {!isApproved && (
                <div className="absolute top-2 right-2 bg-destructive/20 text-destructive text-xs px-2 py-1 rounded-full border border-destructive/40">
                  🔒 Locked
                </div>
              )}
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <HomeIcon className="w-16 h-16 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Gamble for Rent
              </h2>
              <p className="text-muted-foreground">
                {isApproved ? 'Take a chance on reducing your monthly rent payment' : 'Get landlord approval first'}
              </p>
            </CardContent>
          </Card>

          <Card id="nav-furniture" className="bg-card border-2 border-primary shadow-xl cursor-pointer hover:bg-card/80 transition-all duration-200 hover:scale-105" onClick={() => setCurrentView("furniture")}>
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Hammer className="w-16 h-16 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Auction for Furniture
              </h2>
              <p className="text-muted-foreground">
                Simulate an auction and see what your items could sell for
              </p>
            </CardContent>
          </Card>

          <Card id="nav-wallet" className="bg-card border-2 border-primary shadow-xl cursor-pointer hover:bg-card/80 transition-all duration-200 hover:scale-105" onClick={() => setCurrentView("wallet")}>
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                My Wallet
              </h2>
              <p className="text-muted-foreground">
                Manage your funds and payment methods
              </p>
            </CardContent>
          </Card>

          <Card id="nav-landlord" className="bg-card border-2 border-secondary shadow-xl cursor-pointer hover:bg-card/80 transition-all duration-200 hover:scale-105 md:col-span-2" onClick={() => setCurrentView("landlord")}>
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-secondary/10 rounded-full">
                  <svg className="w-16 h-16 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Landlord Approval {isApproved && <span className="text-primary">✓</span>}
              </h2>
              <p className="text-muted-foreground">
                {isApproved ? 'Approved - You can now gamble your rent' : 'Request approval from your landlord to use RentRoll'}
              </p>
            </CardContent>
          </Card>
          </div>
        </div>}

      {/* Gamble for Rent Section */}
      {currentView === "rent" && <Card className="w-full max-w-md bg-card/80 backdrop-blur-sm border-2 border-primary shadow-2xl">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <HomeIcon className="w-16 h-16 text-primary" strokeWidth={1.5} />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center text-foreground mb-4">
              Gamble Your Rent
            </h2>

            {/* How It Works Section */}
            <div className="bg-slate-900/50 rounded-lg p-4 my-4 space-y-3">
              <div className="space-y-1">
                <p className="text-primary text-sm font-semibold">
                  🟢 WIN: Save Money
                </p>
                <p className="text-muted-foreground text-xs">
                  Your rent is reduced by the gambled amount.<br/>
                  Gamble £200 = Save £200
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-destructive text-sm font-semibold">
                  🔴 LOSE: Pay Penalty
                </p>
                <p className="text-muted-foreground text-xs">
                  Pay your full rent + 40% penalty on gambled amount.<br/>
                  Gamble £200 = Pay extra £80
                </p>
              </div>
              <p className="text-muted-foreground text-xs font-bold text-center pt-2 border-t border-slate-700">
                18+ only. Gamble responsibly.
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="total-rent" className="block text-muted-foreground mb-2 font-medium">
                What's your total monthly rent?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-semibold">
                  £
                </span>
                <Input id="total-rent" type="number" value={totalRent} onChange={e => setTotalRent(e.target.value)} className="pl-8 bg-muted text-foreground border-border focus:border-primary focus:ring-primary h-12" placeholder="0.00" />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="gamble-amount" className="block text-muted-foreground mb-2 font-medium">
                How much do you want to gamble?
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-semibold">
                  £
                </span>
                <Input id="gamble-amount" type="number" value={gambleAmount} onChange={e => setGambleAmount(e.target.value)} className="pl-8 bg-muted text-foreground border-border focus:border-primary focus:ring-primary h-12" placeholder="0.00" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                You can gamble up to 50% of your rent.
              </p>
            </div>

            <Button id="rent-gamble-button" onClick={handleGamble} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              🎲 Roll the Dice
            </Button>

            {result.type && <div id="rent-result" className={`mt-6 p-4 rounded-lg text-center text-lg font-bold whitespace-pre-line transition-all duration-300 ${result.type === "win" ? "bg-success/20 text-success border border-success/30" : result.type === "lose" ? "bg-destructive/20 text-destructive border border-destructive/30" : "bg-muted text-muted-foreground border border-border"}`}>
                {result.message}
              </div>}

            <Button onClick={goHome} variant="outline" className="w-full mt-6 back-home">
              Back to Home
            </Button>
          </CardContent>
        </Card>}

      {/* Wallet Section */}
      {currentView === "wallet" && <div className="w-full max-w-4xl">
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary shadow-2xl mb-6">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-center text-foreground mb-8">
                💰 My Wallet
              </h2>

              <div className="text-center mb-8">
                <p className="text-muted-foreground mb-2">Current Balance</p>
                <p className="text-5xl font-bold text-primary">£{balance.toFixed(2)}</p>
              </div>

              {/* Credit Card Input Section */}
              <div className="mb-8 border border-border rounded-lg p-6 bg-muted/30">
                <h3 className="text-xl font-bold text-foreground mb-4">💳 Payment Method</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-foreground text-sm font-medium mb-2">
                      Card Number
                    </label>
                    <Input 
                      type="text" 
                      value={cardNumber} 
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} 
                      className="bg-muted text-foreground border-border h-12" 
                      placeholder="1234 5678 9012 3456"
                      maxLength={16}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-foreground text-sm font-medium mb-2">
                      Cardholder Name
                    </label>
                    <Input 
                      type="text" 
                      value={cardName} 
                      onChange={e => setCardName(e.target.value)} 
                      className="bg-muted text-foreground border-border h-12" 
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground text-sm font-medium mb-2">
                      Expiry Date
                    </label>
                    <Input 
                      type="text" 
                      value={cardExpiry} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length >= 2) val = val.slice(0,2) + '/' + val.slice(2,4);
                        setCardExpiry(val);
                      }} 
                      className="bg-muted text-foreground border-border h-12" 
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-foreground text-sm font-medium mb-2">
                      CVV
                    </label>
                    <Input 
                      type="text" 
                      value={cardCVV} 
                      onChange={e => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 3))} 
                      className="bg-muted text-foreground border-border h-12" 
                      placeholder="123"
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Deposit */}
                <div className="space-y-3">
                  <label className="block text-foreground font-semibold">
                    Deposit Funds
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-semibold">
                      £
                    </span>
                    <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} onKeyDown={e => e.key === "Enter" && handleDeposit()} className="pl-8 bg-muted text-foreground border-border h-12" placeholder="0.00" />
                  </div>
                  <Button onClick={handleDeposit} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12">
                    💳 Deposit
                  </Button>
                </div>

                {/* Withdraw */}
                <div className="space-y-3">
                  <label className="block text-foreground font-semibold">
                    Withdraw / Pay Rent
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-semibold">
                      £
                    </span>
                    <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} onKeyDown={e => e.key === "Enter" && handleWithdraw()} className="pl-8 bg-muted text-foreground border-border h-12" placeholder="0.00" />
                  </div>
                  <Button onClick={handleWithdraw} className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold h-12">
                    💸 Withdraw
                  </Button>
                </div>
              </div>

              {/* Transaction History */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">Transaction History</h3>
                <div className="bg-muted rounded-lg border border-border max-h-96 overflow-y-auto">
                  {transactions.length === 0 ? <p className="text-center text-muted-foreground p-8">
                      No transactions yet
                    </p> : transactions.map(transaction => <div key={transaction.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
                        <div>
                          <p className="text-foreground font-medium">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className={`font-bold ${transaction.amount >= 0 ? "text-primary" : "text-destructive"}`}>
                          {transaction.amount >= 0 ? "+" : ""}£
                          {Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </div>)}
                </div>
              </div>

              <Button onClick={goHome} variant="outline" className="w-full mt-6">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>}

      {/* Landlord Approval Section */}
      {currentView === "landlord" && <div className="w-full max-w-2xl">
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-secondary shadow-2xl">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-center text-foreground mb-4">
                📧 Landlord Approval {isApproved && <span className="text-primary">✓</span>}
              </h2>

              {isApproved ? (
                <div className="bg-primary/20 border border-primary/40 rounded-lg p-4 mb-6">
                  <p className="text-primary font-bold text-sm text-center">
                    ✅ Your landlord approval is confirmed! You can now gamble your rent.
                  </p>
                </div>
              ) : (
                <div className="bg-destructive/20 border border-destructive/40 rounded-lg p-4 mb-6">
                  <p className="text-destructive font-bold text-sm text-center">
                    ⚠️ You must have explicit written approval from your landlord or estate agent to use this service for your rent payments.
                  </p>
                </div>
              )}

              {/* Admin Toggle (Hidden by default) */}
              <div className="text-center mb-4">
                <button 
                  onClick={() => setShowAdminToggle(!showAdminToggle)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {showAdminToggle ? '▼' : '▶'} Admin
                </button>
              </div>
              {showAdminToggle && (
                <div className="bg-muted border border-border rounded-lg p-4 mb-6">
                  <p className="text-xs text-muted-foreground mb-3">Admin: Toggle approval for testing</p>
                  <Button 
                    onClick={handleAdminApproval}
                    variant={isApproved ? "destructive" : "default"}
                    className="w-full"
                  >
                    {isApproved ? '🔓 Revoke Approval' : '🔒 Grant Approval'}
                  </Button>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="landlord-email" className="block text-foreground font-semibold mb-2">
                    Landlord/Agent Email *
                  </label>
                  <Input id="landlord-email" type="email" value={landlordEmail} onChange={e => setLandlordEmail(e.target.value)} className="bg-muted text-foreground border-border h-12" placeholder="landlord@example.com" />
                </div>

                <div>
                  <label htmlFor="property-link" className="block text-foreground font-semibold mb-2">
                    Link to Accommodation Property *
                  </label>
                  <Input id="property-link" type="url" value={propertyLink} onChange={e => setPropertyLink(e.target.value)} className="bg-muted text-foreground border-border h-12" placeholder="https://..." />
                </div>

                <div>
                  <label htmlFor="approval-message" className="block text-foreground font-semibold mb-2">
                    Approval Request Message
                  </label>
                  <textarea id="approval-message" value={approvalMessage} onChange={e => setApprovalMessage(e.target.value)} className="w-full min-h-[200px] p-4 bg-muted text-foreground border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary resize-none" />
                </div>

                {approvalSent && <div className="bg-primary/20 border border-primary/40 rounded-lg p-4 text-center">
                    <p className="text-primary font-bold">
                      ✅ Approval request sent successfully!
                    </p>
                  </div>}

                <Button onClick={handleSendApproval} disabled={!landlordEmail || !propertyLink} className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground disabled:opacity-50">
                  📨 Send Approval Request
                </Button>
              </div>

              <Button onClick={goHome} variant="outline" className="w-full mt-6">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>}

      {/* Auction for Furniture Section */}
      {currentView === "furniture" && <div className="w-full max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-foreground mb-2">
              Auction for Furniture
            </h1>
            <p className="text-primary text-lg">Bid smart. Furnish cheaper.</p>
          </div>

          {/* Filters */}
          <Card className="bg-card border border-border mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="search" placeholder="Search furniture..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-muted border-border" />
                </div>

                {/* Sort */}
                <select id="sort" value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-4 py-2 bg-muted text-foreground border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary">
                  <option value="ending-soon">Ending Soon</option>
                  <option value="highest-bid">Highest Bid</option>
                  <option value="lowest-bid">Lowest Bid</option>
                </select>

                {/* Status Filters */}
                <div className="flex gap-2 flex-wrap">
                  {(["all", "live", "ending-soon", "sold"] as const).map(status => <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1 text-sm font-medium rounded-full border transition-all ${statusFilter === status ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-border hover:border-primary"}`}>
                      {status === "all" ? "All" : status === "live" ? "Live" : status === "ending-soon" ? "Ending Soon" : "Sold"}
                    </button>)}
                  <button onClick={() => setShowWatchlistOnly(!showWatchlistOnly)} className={`px-3 py-1 text-sm font-medium rounded-full border transition-all flex items-center gap-1 ${showWatchlistOnly ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-foreground border-border hover:border-primary"}`}>
                    <Heart className={`w-3 h-3 ${showWatchlistOnly ? "fill-current" : ""}`} />
                    Watchlist
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auction Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {getFilteredItems().map(item => {
          const timeLeft = item.endTime ? getTimeLeft(item.endTime) : "ENDED";
          const isEnded = item.status === "ended" || item.status === "sold";
          const isWatched = watchlist.includes(item.id);
          const progress = item.endTime ? getProgress(item.endTime, item.endsInMinutes) : 100;
          return <Card key={item.id} className="bg-card border border-primary/40 shadow-xl flex flex-col">
                  <CardContent className="p-4 flex flex-col gap-3 flex-1">
                    {/* Image */}
                    <div className="aspect-square bg-muted rounded-lg border border-primary/20 overflow-hidden">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>

                    {/* Title & Condition */}
                    <div>
                      <h3 className="text-foreground font-semibold text-lg">
                        {item.title}
                      </h3>
                      <span className="inline-block mt-1 text-primary border border-primary/40 rounded-full px-2 py-0.5 text-xs">
                        {item.condition}
                      </span>
                    </div>

                    {/* Timer & Status */}
                    <div className="flex items-center justify-between">
                      <span id={`timer-${item.id}`} className="text-sm text-muted-foreground font-mono">
                        {timeLeft}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === "live" ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                        {item.status === "live" ? "LIVE" : item.status === "sold" ? "SOLD" : "ENDED"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div id={`progress-${item.id}`} className="h-full bg-primary rounded transition-all duration-1000" style={{
                  width: `${progress}%`
                }} />
                    </div>

                    {/* Bid Info */}
                    <div className="bg-background/40 border border-primary/30 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Bid:</span>
                        <span className="text-foreground font-bold">
                          £{(item.currentBid || item.startingPrice).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Min Increment:</span>
                        <span className="text-foreground">£{item.minIncrement}</span>
                      </div>
                      <Button onClick={() => buyNow(item.id)} disabled={isEnded} size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold disabled:opacity-50">
                        Buy Now: £{item.buyNow}
                      </Button>
                    </div>

                    {/* Bid Controls */}
                    {!isEnded && <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground font-semibold text-sm">
                              £
                            </span>
                            <Input id={`bid-input-${item.id}`} type="number" value={bidInputs[item.id] || ""} onChange={e => setBidInputs(prev => ({
                      ...prev,
                      [item.id]: e.target.value
                    }))} onKeyDown={e => {
                      if (e.key === "Enter") placeBid(item.id);
                    }} className="pl-7 bg-muted text-foreground border-border focus:border-primary h-10" placeholder="0.00" />
                          </div>
                          <Button id={`bid-btn-${item.id}`} onClick={() => placeBid(item.id)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                            Place Bid
                          </Button>
                        </div>
                      </div>}

                    {/* Bid Message */}
                    {item.bidMessage && <div className="text-sm text-center p-2 rounded bg-muted text-foreground" role="status" aria-live="polite">
                        {item.bidMessage}
                      </div>}

                    {/* Recent Bid Activity */}
                    {item.recentBids && item.recentBids.length > 0 && <div className="space-y-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground font-semibold">Recent Activity</p>
                        {item.recentBids.map((bid, idx) => <div key={idx} className="flex items-center gap-2 text-xs">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                              {bid.user.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-foreground">
                              <span className="font-semibold">{bid.user}</span> placed a bid of £{bid.amount.toFixed(2)}
                            </span>
                          </div>)}
                      </div>}

                    {/* Watchlist & Watch Count */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span id={`watch-${item.id}`} className="text-xs text-muted-foreground">
                        {watchlist.filter(id => id === item.id).length > 0 ? "Watching" : ""}
                      </span>
                      <button onClick={() => toggleWatchlist(item.id)} className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="Toggle watchlist">
                        <Heart className={`w-5 h-5 transition-colors ${isWatched ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                  </CardContent>
                </Card>;
        })}
          </div>

          {/* Footer */}
          <p className="text-center text-primary/70 text-xs mb-4">
            Local, fast, and slightly competitive.
          </p>

          <Button onClick={goHome} variant="outline" className="mx-auto block back-home">
            Back to Home
          </Button>
        </div>}
    </div>;
};
export default Index;