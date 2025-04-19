"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Trophy, Coins, Zap } from "lucide-react"
import { useSound } from "@/lib/sounds"
import { useToast } from "@/hooks/use-toast"
import { useGame } from "@/contexts/game-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlayingCard } from "./playing-card"
import { motion } from "framer-motion"

// Card types
type Suit = "hearts" | "diamonds" | "clubs" | "spades"
type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A"
type PlayingCardType = { suit: Suit; rank: Rank; hidden?: boolean }

// Game states
type GameState = "betting" | "dealing" | "playerTurn" | "dealerTurn" | "evaluating" | "gameOver"
type GameResult = "win" | "lose" | "push" | "blackjack" | "bust" | "charlie" | null

// Chip values
const CHIP_VALUES = [5, 25, 100, 500]

// Achievement types
type Achievement = {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  progress: number
  target: number
  unlocked: boolean
}

export default function EnhancedGameBoard() {
  // Auth and game context
  const { user } = useAuth()
  const { balance, setBalance, addWin, addLoss, addBlackjack, addGamePlayed, saveGameState, loadGameState, gameStats } =
    useGame()

  // Game state
  const [deck, setDeck] = useState<PlayingCardType[]>([])
  const [playerHand, setPlayerHand] = useState<PlayingCardType[]>([])
  const [dealerHand, setDealerHand] = useState<PlayingCardType[]>([])
  const [splitHand, setSplitHand] = useState<PlayingCardType[]>([])
  const [gameState, setGameState] = useState<GameState>("betting")
  const [gameResult, setGameResult] = useState<GameResult>(null)
  const [localBalance, setLocalBalance] = useState(balance)
  const [bet, setBet] = useState(0)
  const [sideBet, setSideBet] = useState(0)
  const [insurance, setInsurance] = useState(0)
  const [activeHand, setActiveHand] = useState<"main" | "split">("main")
  const [showTutorial, setShowTutorial] = useState(false)
  const [streak, setStreak] = useState(0)
  const [handsPlayed, setHandsPlayed] = useState(0)
  const [showInsurancePrompt, setShowInsurancePrompt] = useState(false)
  const [animatingDeal, setAnimatingDeal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_win",
      name: "Beginner's Luck",
      description: "Win your first hand",
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      progress: 0,
      target: 1,
      unlocked: false,
    },
    {
      id: "high_roller",
      name: "High Roller",
      description: "Place a bet of 500 or more",
      icon: <Coins className="h-5 w-5 text-yellow-500" />,
      progress: 0,
      target: 1,
      unlocked: false,
    },
    {
      id: "winning_streak",
      name: "Hot Streak",
      description: "Win 3 hands in a row",
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
      progress: 0,
      target: 3,
      unlocked: false,
    },
    {
      id: "blackjack_master",
      name: "Blackjack Master",
      description: "Get 5 blackjacks",
      icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      progress: 0,
      target: 5,
      unlocked: false,
    },
  ])

  // Animation refs
  const dealerCardRef = useRef<HTMLDivElement>(null)
  const playerCardRef = useRef<HTMLDivElement>(null)
  const chipStackRef = useRef<HTMLDivElement>(null)

  // Sound effects
  const { playSound, isSoundMuted, toggleSoundMute } = useSound()

  const { toast } = useToast()

  // Update local balance when context balance changes
  useEffect(() => {
    setLocalBalance(balance)
  }, [balance])

  // Initialize deck
  useEffect(() => {
    resetDeck()

    // Try to load saved game
    if (user) {
      loadSavedGame()
    }
  }, [user])

  // Load saved game
  const loadSavedGame = async () => {
    try {
      setIsLoading(true)
      const savedGame = await loadGameState()

      if (savedGame) {
        // Restore game state
        setDeck(savedGame.deck || [])
        setPlayerHand(savedGame.playerHand || [])
        setDealerHand(savedGame.dealerHand || [])
        setSplitHand(savedGame.splitHand || [])
        setGameState(savedGame.gameState || "betting")
        setGameResult(savedGame.gameResult || null)
        setBet(savedGame.bet || 0)
        setSideBet(savedGame.sideBet || 0)
        setInsurance(savedGame.insurance || 0)
        setActiveHand(savedGame.activeHand || "main")
        setStreak(savedGame.streak || 0)
        setHandsPlayed(savedGame.handsPlayed || 0)
      } else {
        resetDeck()
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error loading saved game:", error)
      resetDeck()
      setIsLoading(false)
    }
  }

  // Save current game
  const saveCurrentGame = async () => {
    try {
      setIsSaving(true)

      const gameData = {
        deck,
        playerHand,
        dealerHand,
        splitHand,
        gameState,
        gameResult,
        bet,
        sideBet,
        insurance,
        activeHand,
        streak,
        handsPlayed,
      }

      await saveGameState(gameData)
      setIsSaving(false)
    } catch (error) {
      console.error("Error saving game:", error)
      setIsSaving(false)
    }
  }

  // Create and shuffle a new deck
  const resetDeck = () => {
    const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"]
    const ranks: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]

    const newDeck: PlayingCardType[] = []

    // Create 6 decks for a shoe
    for (let d = 0; d < 6; d++) {
      for (const suit of suits) {
        for (const rank of ranks) {
          newDeck.push({ suit, rank })
        }
      }
    }

    // Shuffle
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]]
    }

    setDeck(newDeck)
  }

  // Deal a card from the deck
  const dealCard = (hidden = false): PlayingCardType => {
    const card = { ...deck[0], hidden }
    setDeck(deck.slice(1))
    return card
  }

  // Calculate hand value
  const calculateHandValue = (hand: PlayingCardType[]) => {
    let value = 0
    let aces = 0

    for (const card of hand) {
      if (card.hidden) continue

      if (card.rank === "A") {
        aces++
        value += 11
      } else if (["K", "Q", "J"].includes(card.rank)) {
        value += 10
      } else {
        value += Number.parseInt(card.rank)
      }
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10
      aces--
    }

    return value
  }

  // Check if hand is a blackjack
  const isBlackjack = (hand: PlayingCardType[]) => {
    return hand.length === 2 && calculateHandValue(hand) === 21
  }

  // Function to update achievement progress
  const updateAchievement = (id: string, progressIncrement: number) => {
    setAchievements((prevAchievements) => {
      return prevAchievements.map((achievement) => {
        if (achievement.id === id && !achievement.unlocked) {
          const newProgress = Math.min(achievement.progress + progressIncrement, achievement.target)
          const unlocked = newProgress >= achievement.target

          if (unlocked) {
            toast({
              title: "Achievement Unlocked!",
              description: `You've unlocked: ${achievement.name}`,
            })
          }

          return { ...achievement, progress: newProgress, unlocked }
        }
        return achievement
      })
    })
  }

  // Start a new game
  const startGame = async () => {
    if (bet === 0) {
      toast({
        title: "Place a bet first",
        description: "You need to place a bet to start the game",
        variant: "destructive",
      })
      return
    }

    playSound("buttonClick")
    setGameState("dealing")
    setGameResult(null)
    setPlayerHand([])
    setDealerHand([])
    setSplitHand([])
    setActiveHand("main")
    setShowInsurancePrompt(false)
    setAnimatingDeal(true)

    // Deal cards with animation delay
    const newPlayerHand: PlayingCardType[] = []
    const newDealerHand: PlayingCardType[] = []

    // First card to player
    await new Promise((resolve) => setTimeout(resolve, 300))
    playSound("cardDeal")
    newPlayerHand.push(dealCard())
    setPlayerHand([...newPlayerHand])

    // First card to dealer
    await new Promise((resolve) => setTimeout(resolve, 600))
    playSound("cardDeal")
    newDealerHand.push(dealCard())
    setDealerHand([...newDealerHand])

    // Second card to player
    await new Promise((resolve) => setTimeout(resolve, 600))
    playSound("cardDeal")
    newPlayerHand.push(dealCard())
    setPlayerHand([...newPlayerHand])

    // Second card to dealer (face down)
    await new Promise((resolve) => setTimeout(resolve, 600))
    playSound("cardDeal")
    newDealerHand.push(dealCard(true))
    setDealerHand([...newDealerHand])

    setAnimatingDeal(false)

    // Check for dealer showing Ace (insurance)
    if (newDealerHand[0].rank === "A") {
      setShowInsurancePrompt(true)
      return
    }

    // Check for player blackjack
    if (isBlackjack(newPlayerHand)) {
      handleBlackjack()
    } else {
      setGameState("playerTurn")
    }

    // Update hands played count
    setHandsPlayed((prev) => prev + 1)
    addGamePlayed()
  }

  // Handle player hitting
  const handleHit = () => {
    playSound("buttonClick")
    playSound("cardDeal")

    if (activeHand === "main") {
      const newHand = [...playerHand, dealCard()]
      setPlayerHand(newHand)

      const value = calculateHandValue(newHand)

      // Check for bust
      if (value > 21) {
        if (splitHand.length > 0) {
          setActiveHand("split")
        } else {
          handleBust()
        }
      }

      // Check for 5-card Charlie (automatic win with 5 cards without busting)
      if (newHand.length === 5 && value <= 21) {
        handleCharlie()
      }
    } else {
      const newHand = [...splitHand, dealCard()]
      setSplitHand(newHand)

      const value = calculateHandValue(newHand)

      // Check for bust on split hand
      if (value > 21) {
        handleDealerTurn()
      }

      // Check for 5-card Charlie on split hand
      if (newHand.length === 5 && value <= 21) {
        handleDealerTurn()
      }
    }
  }

  // Handle player standing
  const handleStand = () => {
    playSound("buttonClick")

    if (activeHand === "main" && splitHand.length > 0) {
      setActiveHand("split")
    } else {
      handleDealerTurn()
    }
  }

  // Handle player doubling down
  const handleDoubleDown = () => {
    if (localBalance < bet) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough chips to double down",
        variant: "destructive",
      })
      return
    }

    playSound("buttonClick")
    playSound("chipStack")

    // Double the bet
    setLocalBalance(localBalance - bet)
    setBet(bet * 2)

    // Deal one more card and then stand
    playSound("cardDeal")

    if (activeHand === "main") {
      const newHand = [...playerHand, dealCard()]
      setPlayerHand(newHand)

      if (splitHand.length > 0) {
        setActiveHand("split")
      } else {
        handleDealerTurn()
      }
    } else {
      const newHand = [...splitHand, dealCard()]
      setSplitHand(newHand)
      handleDealerTurn()
    }
  }

  // Handle player splitting
  const handleSplit = () => {
    // Can only split if first two cards have the same value
    if (
      playerHand.length !== 2 ||
      calculateHandValue([playerHand[0]]) !== calculateHandValue([playerHand[1]]) ||
      localBalance < bet
    ) {
      return
    }

    playSound("buttonClick")
    playSound("chipStack")

    // Take second card from player hand and create split hand
    const card = playerHand[1]
    setPlayerHand([playerHand[0]])
    setSplitHand([card])

    // Deduct additional bet
    setLocalBalance(localBalance - bet)

    // Deal one more card to the first hand
    playSound("cardDeal")
    setPlayerHand((prev) => [...prev, dealCard()])
  }

  // Handle insurance bet
  const handleInsurance = (takeInsurance: boolean) => {
    setShowInsurancePrompt(false)

    if (takeInsurance) {
      // Insurance costs half the original bet
      const insuranceAmount = Math.floor(bet / 2)
      setInsurance(insuranceAmount)
      setLocalBalance(localBalance - insuranceAmount)
      playSound("chipStack")
    }

    // Check for player blackjack
    if (isBlackjack(playerHand)) {
      handleBlackjack()
    } else {
      setGameState("playerTurn")
    }
  }

  // Handle dealer's turn
  const handleDealerTurn = async () => {
    setGameState("dealerTurn")

    // Reveal dealer's hole card
    const revealedHand = dealerHand.map((card) => ({ ...card, hidden: false }))
    setDealerHand(revealedHand)
    playSound("cardFlip")

    await new Promise((resolve) => setTimeout(resolve, 800))

    // Dealer draws until 17 or higher
    let currentHand = [...revealedHand]
    let currentValue = calculateHandValue(currentHand)

    while (currentValue < 17) {
      await new Promise((resolve) => setTimeout(resolve, 600))
      playSound("cardDeal")

      const newCard = dealCard()
      currentHand = [...currentHand, newCard]
      setDealerHand(currentHand)

      currentValue = calculateHandValue(currentHand)
    }

    // Evaluate results
    evaluateResults()
  }

  // Evaluate game results
  const evaluateResults = () => {
    setGameState("evaluating")

    const dealerValue = calculateHandValue(dealerHand)
    const playerValue = calculateHandValue(playerHand)
    const dealerHasBlackjack = isBlackjack(dealerHand)

    // Handle insurance first
    if (insurance > 0 && dealerHasBlackjack) {
      // Insurance pays 2:1
      const insurancePayout = insurance * 3
      setLocalBalance(localBalance + insurancePayout)
      toast({
        title: "Insurance paid",
        description: `You won ${insurancePayout} chips from insurance`,
      })
    }

    // Evaluate main hand
    if (gameResult === "blackjack") {
      // Already handled
    } else if (gameResult === "charlie") {
      // Already handled
    } else if (playerValue > 21) {
      handleLoss()
    } else if (dealerValue > 21) {
      handleWin()
    } else if (playerValue > dealerValue) {
      handleWin()
    } else if (playerValue < dealerValue) {
      handleLoss()
    } else {
      handlePush()
    }

    // Evaluate split hand if exists
    if (splitHand.length > 0) {
      const splitValue = calculateHandValue(splitHand)

      if (splitValue > 21) {
        // Split hand busts
        // No additional payout
      } else if (dealerValue > 21) {
        // Dealer busts, split hand wins
        setLocalBalance(localBalance + bet * 2)
        addWin(bet)
      } else if (splitValue > dealerValue) {
        // Split hand wins
        setLocalBalance(localBalance + bet * 2)
        addWin(bet)
      } else if (splitValue < dealerValue) {
        // Split hand loses
        // No additional payout
        addLoss(bet)
      } else {
        // Push on split hand
        setLocalBalance(localBalance + bet)
      }
    }

    // Update balance in context
    setBalance(localBalance)
    setGameState("gameOver")
  }

  // Handle player blackjack
  const handleBlackjack = () => {
    setGameState("evaluating")
    setGameResult("blackjack")

    // Blackjack pays 3:2
    const blackjackPayout = Math.floor(bet * 2.5)
    setLocalBalance(localBalance + blackjackPayout)

    // Update achievements
    updateAchievement("blackjack_master", 1)
    addBlackjack()

    // Show win animation
    setTimeout(() => {
      playSound("win")
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }, 500)

    // Update streak
    setStreak((prev) => prev + 1)
    updateAchievement("winning_streak", streak + 1)

    // Update first win achievement
    updateAchievement("first_win", 1)

    // Add win to stats
    addWin(blackjackPayout - bet)

    toast({
      title: "Blackjack!",
      description: `You won ${blackjackPayout} chips`,
      variant: "default",
    })

    setGameState("gameOver")
  }

  // Handle 5-card Charlie
  const handleCharlie = () => {
    setGameState("evaluating")
    setGameResult("charlie")

    // 5-card Charlie pays 2:1
    const charliePayout = bet * 3
    setLocalBalance(localBalance + charliePayout)

    // Show win animation
    setTimeout(() => {
      playSound("win")
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }, 500)

    // Update streak
    setStreak((prev) => prev + 1)
    updateAchievement("winning_streak", streak + 1)

    // Update first win achievement
    updateAchievement("first_win", 1)

    // Add win to stats
    addWin(charliePayout - bet)

    toast({
      title: "5-Card Charlie!",
      description: `You won ${charliePayout} chips`,
      variant: "default",
    })

    setGameState("gameOver")
  }

  // Handle player win
  const handleWin = () => {
    setGameResult("win")

    // Regular win pays 1:1
    const winnings = bet * 2
    setLocalBalance(localBalance + winnings)

    // Show win animation
    setTimeout(() => {
      playSound("win")
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)
    }, 500)

    // Update streak
    setStreak((prev) => prev + 1)
    updateAchievement("winning_streak", streak + 1)

    // Update first win achievement
    updateAchievement("first_win", 1)

    // Add win to stats
    addWin(bet)

    toast({
      title: "You win!",
      description: `You won ${winnings} chips`,
      variant: "default",
    })
  }

  // Handle player loss
  const handleLoss = () => {
    setGameResult("lose")

    // Reset streak
    setStreak(0)

    // Add loss to stats
    addLoss(bet)

    setTimeout(() => {
      playSound("lose")
    }, 500)

    toast({
      title: "You lose",
      description: `You lost ${bet} chips`,
      variant: "destructive",
    })
  }

  // Handle push (tie)
  const handlePush = () => {
    setGameResult("push")

    // Return bet on push
    setLocalBalance(localBalance + bet)

    setTimeout(() => {
      playSound("push")
    }, 500)

    toast({
      title: "Push",
      description: "Your bet has been returned",
      variant: "default",
    })
  }

  // Handle player bust
  const handleBust = () => {
    setGameResult("bust")

    // Reset streak
    setStreak(0)

    // Add loss to stats
    addLoss(bet)

    setTimeout(() => {
      playSound("lose")
    }, 500)

    toast({
      title: "Bust!",
      description: `You went over 21 and lost ${bet} chips`,
      variant: "destructive",
    })

    setGameState("gameOver")
  }

  // Place bet
  const placeBet = (amount: number) => {
    if (localBalance < amount) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough chips for this bet",
        variant: "destructive",
      })
      return
    }

    playSound("chipStack")
    setBet((prev) => prev + amount)
    setLocalBalance((prev) => prev - amount)

    // Check for high roller achievement
    if (bet + amount >= 500) {
      updateAchievement("high_roller", 1)
    }
  }

  // Clear bet
  const clearBet = () => {
    if (bet === 0) return

    playSound("chipStack")
    setLocalBalance((prev) => prev + bet)
    setBet(0)
  }

  // Render betting UI
  const renderBettingUI = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-black/50 border border-yellow-500/30 rounded-xl p-4 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Place Your Bet</h2>
            <div className="text-3xl font-bold text-yellow-500">{bet}</div>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {CHIP_VALUES.map((value) => (
            <button
              key={value}
              onClick={() => placeBet(value)}
              disabled={localBalance < value}
              className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-black ${
                localBalance < value ? "opacity-50" : ""
              }`}
              style={{
                background: value === 5 ? "#ff5722" : value === 25 ? "#2196f3" : value === 100 ? "#4caf50" : "#9c27b0",
                border: "2px solid gold",
                boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
              }}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Button
            onClick={clearBet}
            variant="outline"
            className="bg-red-900/50 hover:bg-red-800 text-white border-red-700/50"
            disabled={bet === 0}
          >
            Clear
          </Button>
          <Button
            onClick={startGame}
            className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold"
            disabled={bet === 0}
          >
            Deal
          </Button>
        </div>
      </div>
    )
  }

  // Render player actions UI
  const renderPlayerActionsUI = () => {
    const canDouble = playerHand.length === 2 && localBalance >= bet
    const canSplit = playerHand.length === 2 && playerHand[0].rank === playerHand[1].rank && localBalance >= bet

    return (
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button onClick={handleHit} className="bg-green-600 hover:bg-green-500 text-white font-bold py-4">
          Hit
        </Button>
        <Button onClick={handleStand} className="bg-red-600 hover:bg-red-500 text-white font-bold py-4">
          Stand
        </Button>
        {canDouble && (
          <Button onClick={handleDoubleDown} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4">
            Double
          </Button>
        )}
        {canSplit && (
          <Button onClick={handleSplit} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4">
            Split
          </Button>
        )}
      </div>
    )
  }

  // Render insurance prompt
  const renderInsurancePrompt = () => {
    return (
      <Card className="bg-black/70 border-yellow-500/30 p-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Insurance?</h2>
        <p className="text-gray-300 mb-4">Dealer is showing an Ace. Would you like to take insurance?</p>
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => handleInsurance(true)}
            className="bg-green-600 hover:bg-green-500 text-white font-bold"
            disabled={localBalance < Math.floor(bet / 2)}
          >
            Yes ({Math.floor(bet / 2)} chips)
          </Button>
          <Button onClick={() => handleInsurance(false)} className="bg-red-600 hover:bg-red-500 text-white font-bold">
            No
          </Button>
        </div>
      </Card>
    )
  }

  // Render game over UI
  const renderGameOverUI = () => {
    return (
      <div className="text-center space-y-4">
        {gameResult && (
          <div
            className={`text-2xl font-bold ${
              gameResult === "win" || gameResult === "blackjack" || gameResult === "charlie"
                ? "text-green-500"
                : gameResult === "push"
                  ? "text-yellow-500"
                  : "text-red-500"
            }`}
          >
            {gameResult === "win" && "You Win!"}
            {gameResult === "blackjack" && "Blackjack!"}
            {gameResult === "charlie" && "5-Card Charlie!"}
            {gameResult === "lose" && "Dealer Wins"}
            {gameResult === "bust" && "Bust!"}
            {gameResult === "push" && "Push"}
          </div>
        )}
        <Button
          onClick={() => {
            setGameState("betting")
            setBet(0)
          }}
          className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4"
        >
          New Hand
        </Button>
      </div>
    )
  }

  // Main render
  return (
    <div className="max-w-md mx-auto p-4">
      {/* Game header */}
      <div className="flex justify-between items-center mb-4">
        <Badge variant="outline" className="bg-black/50 text-yellow-500 border-yellow-500/50 px-3 py-1 text-lg">
          Balance: {localBalance}
        </Badge>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-black/50 text-white border-yellow-500/50">
            Bet: {bet}
          </Badge>
          {streak > 0 && (
            <Badge variant="outline" className="bg-black/50 text-orange-500 border-orange-500/50">
              Streak: {streak}
            </Badge>
          )}
        </div>
      </div>

      {/* Dealer's hand */}
      <Card className="bg-green-800 border-2 border-yellow-500/50 p-4 mb-4 min-h-[180px] relative">
        <h2 className="text-white mb-2 font-bold">
          Dealer's Hand {!dealerHand.some((card) => card.hidden) && `(${calculateHandValue(dealerHand)})`}
        </h2>
        <div className="flex flex-wrap gap-2">
          {dealerHand.map((card, index) => (
            <motion.div
              key={`dealer-${index}`}
              initial={{ scale: 0, rotate: 20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PlayingCard suit={card.suit} rank={card.rank} hidden={card.hidden} />
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Player's hand */}
      <Card className="bg-green-800 border-2 border-yellow-500/50 p-4 mb-4 min-h-[180px]">
        <h2 className="text-white mb-2 font-bold">
          Your Hand {playerHand.length > 0 && `(${calculateHandValue(playerHand)})`}
          {activeHand === "main" && splitHand.length > 0 && " - Active"}
        </h2>
        <div className="flex flex-wrap gap-2">
          {playerHand.map((card, index) => (
            <motion.div
              key={`player-${index}`}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PlayingCard suit={card.suit} rank={card.rank} />
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Split hand (if any) */}
      {splitHand.length > 0 && (
        <Card className="bg-green-800 border-2 border-yellow-500/50 p-4 mb-4 min-h-[180px]">
          <h2 className="text-white mb-2 font-bold">
            Split Hand {`(${calculateHandValue(splitHand)})`}
            {activeHand === "split" && " - Active"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {splitHand.map((card, index) => (
              <motion.div
                key={`split-${index}`}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <PlayingCard suit={card.suit} rank={card.rank} />
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Game controls based on state */}
      {gameState === "betting" && renderBettingUI()}
      {gameState === "playerTurn" && renderPlayerActionsUI()}
      {showInsurancePrompt && renderInsurancePrompt()}
      {gameState === "dealerTurn" && (
        <div className="text-center">
          <div className="animate-pulse text-white font-bold">Dealer is playing...</div>
        </div>
      )}
      {gameState === "gameOver" && renderGameOverUI()}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading game...</p>
          </div>
        </div>
      )}

      {/* Save game button */}
      {user && gameState !== "betting" && (
        <div className="mt-4 text-center">
          <Button
            onClick={saveCurrentGame}
            variant="outline"
            className="bg-black/50 text-white border-yellow-500/50"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Game"}
          </Button>
        </div>
      )}
    </div>
  )
}
