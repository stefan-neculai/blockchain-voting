# 📖 User Guide: Anonymous Blockchain Voting

> How to vote anonymously using Zero-Knowledge Proofs

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Prerequisites](#2-prerequisites)
3. [Getting Started](#3-getting-started)
4. [Managing Your Identity](#4-managing-your-identity)
5. [Registering to Vote](#5-registering-to-vote)
6. [Casting Your Vote](#6-casting-your-vote)
7. [Viewing Results](#7-viewing-results)
8. [Troubleshooting](#8-troubleshooting)
9. [Security Best Practices](#9-security-best-practices)
10. [FAQ](#10-faq)

---

## 1. Introduction

### What is Anonymous Voting?

This system allows you to vote in polls without anyone knowing how you voted. We use a technology called **Zero-Knowledge Proofs (ZKP)** to prove you're eligible to vote without revealing your identity.

### How Does It Work?

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR VOTING JOURNEY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. CREATE IDENTITY          2. REGISTER                        │
│   ┌────────────────┐          ┌────────────────┐                │
│   │  Generate a    │  ─────►  │  Submit your   │                │
│   │  secret identity│          │  commitment    │                │
│   └────────────────┘          └────────────────┘                │
│                                       │                          │
│   4. VOTE COUNTED             3. CAST VOTE                       │
│   ┌────────────────┐          ┌────────────────┐                │
│   │  Your vote is  │  ◄─────  │  Submit ZK     │                │
│   │  recorded      │          │  proof + vote  │                │
│   └────────────────┘          └────────────────┘                │
│                                                                  │
│   🔒 At no point is your identity linked to your vote!          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites

Before you start, make sure you have:

### ✅ MetaMask Wallet
- Install MetaMask from [metamask.io](https://metamask.io/)
- Create or import a wallet
- Write down your recovery phrase!

### ✅ Sepolia Test ETH
- The system runs on Sepolia testnet (free to use)
- Get free test ETH from a faucet:
  - [sepoliafaucet.com](https://sepoliafaucet.com/)
  - [alchemy.com/faucets](https://www.alchemy.com/faucets/ethereum-sepolia)

### ✅ Modern Browser
- Chrome, Firefox, Brave, or Edge
- JavaScript enabled

---

## 3. Getting Started

### Step 1: Connect Your Wallet

1. Open the voting application
2. Click **"Connect Wallet"** in the header
3. MetaMask will pop up - click **"Connect"**
4. Make sure you're on **Sepolia Network**

![Connect Wallet](images/connect-wallet.png)

### Step 2: Switch to Sepolia Network

If you're not on Sepolia:

1. Click the network dropdown in MetaMask
2. Select **"Sepolia test network"**
3. If it's not listed, go to Settings → Networks → Show test networks

---

## 4. Managing Your Identity

Your **ZK Identity** is the key to anonymous voting. It's a cryptographic secret that proves you're eligible to vote without revealing who you are.

### 4.1 Generate a New Identity

1. Navigate to the **Identity Manager** section
2. Click **"Generate New Identity"**
3. Your identity will be created and stored securely

⚠️ **Important:** Your identity is stored in your browser. If you clear browser data, you'll lose it!

### 4.2 Backup Your Identity

**Always backup your identity!**

1. Click **"Export Identity"**
2. Save the JSON file somewhere safe
3. This file contains your secret - protect it!

Example export file:
```json
{
  "secret": "your-secret-string",
  "commitment": "0x1234...",
  "exportedAt": "2025-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### 4.3 Import an Existing Identity

1. Click **"Import Identity"**
2. Select your backup JSON file
3. Your identity will be restored

### 4.4 Recover from Secret

If you only have your secret string:

1. Click **"Recover from Secret"**
2. Paste your secret
3. Your identity will be regenerated

---

## 5. Registering to Vote

Before you can vote in a poll, you need to register your identity commitment.

### Step 1: Find Your Poll

1. Go to the **Polls** page
2. Find the poll you want to participate in
3. Check that:
   - Registration is open
   - The poll hasn't ended
   - You haven't already registered

### Step 2: Register Your Commitment

1. Click **"Register to Vote"** on the poll
2. Confirm the transaction in MetaMask
3. Wait for the transaction to be confirmed

**What happens:**
- Your identity **commitment** (a hash) is stored on the blockchain
- Your identity **secret** never leaves your browser
- The poll admin can see that someone registered, but not who

### ⚠️ Privacy Note

When you register, your **wallet address** is visible in the transaction. This links your wallet to being a registered voter (but not to your vote).

**Best practice:** Register well before voting begins to prevent timing correlation.

---

## 6. Casting Your Vote

### Step 1: Check Your Status

Before voting, verify:
- ✅ You have an identity (green indicator)
- ✅ You're registered for this poll
- ✅ The poll is currently active
- ✅ You haven't already voted

### Step 2: Select Your Candidate

1. Open the poll you want to vote in
2. Review the candidates/options
3. Click on your choice

### Step 3: Generate ZK Proof

1. Click **"Submit Vote"**
2. Wait while the proof is generated (10-30 seconds)

**What's happening:**
```
┌─────────────────────────────────────────────────────────┐
│              PROOF GENERATION (in your browser)         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   Your Secret Identity                                   │
│          +                                               │
│   List of All Registered Voters                         │
│          +                                               │
│   Your Vote Choice                                       │
│          ↓                                               │
│   ┌────────────────────────────────────────────────┐    │
│   │      ZK-SNARK Circuit (Semaphore)              │    │
│   └────────────────────────────────────────────────┘    │
│          ↓                                               │
│   Zero-Knowledge Proof                                   │
│   (Proves you're registered without revealing WHO)       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Submit to Blockchain

1. MetaMask will pop up with the transaction
2. Review the gas fee
3. Click **"Confirm"**
4. Wait for confirmation

### Step 5: Confirmation

You'll see:
- ✅ "Vote successfully cast!"
- Your **nullifier** (a unique identifier that prevents double voting)

**Your nullifier is public, but cannot be traced back to you.**

---

## 7. Viewing Results

### During Voting

- Results may be hidden until voting ends
- You can see total vote count

### After Voting Ends

1. Go to the poll page
2. Click **"View Results"**
3. See the breakdown by candidate

Results are:
- ✅ Publicly verifiable
- ✅ Tamper-proof (on blockchain)
- ✅ Anonymous (no voter identification)

---

## 8. Troubleshooting

### "Identity not found"

**Cause:** Browser storage was cleared, or you're on a new device.

**Solution:**
1. Import your backup identity file, OR
2. Recover using your secret string, OR
3. Generate a new identity (you'll need to re-register)

---

### "Not registered for this poll"

**Cause:** You haven't registered your commitment for this poll.

**Solution:**
1. Go to the poll page
2. Click "Register to Vote"
3. Wait for transaction confirmation

---

### "Already voted"

**Cause:** Your nullifier was already used for this poll.

**Solution:** This is by design - you can only vote once per poll. If you believe this is an error, your identity may have been compromised.

---

### "Proof generation failed"

**Cause:** Various issues with generating the ZK proof.

**Solutions:**
1. Refresh the page and try again
2. Check your internet connection
3. Ensure your browser has enough memory
4. Try a different browser

---

### "Transaction failed"

**Cause:** Blockchain transaction was reverted.

**Solutions:**
1. Check you have enough Sepolia ETH for gas
2. Wait a few minutes and try again
3. Check if the poll is still active

---

### MetaMask Not Connecting

**Solutions:**
1. Refresh the page
2. Unlock MetaMask
3. Check you're on Sepolia network
4. Try disconnecting and reconnecting

---

## 9. Security Best Practices

### 🔐 Protect Your Identity

| DO ✅ | DON'T ❌ |
|-------|----------|
| Backup your identity file | Share your secret with anyone |
| Store backup in encrypted location | Store backup in cloud without encryption |
| Use strong, unique passwords | Use same identity for multiple systems |
| Generate new identity if compromised | Continue using compromised identity |

### 🌐 Network Security

- Use a trusted internet connection
- Consider using a VPN for additional privacy
- Avoid public Wi-Fi when voting

### 🖥️ Browser Security

- Keep your browser updated
- Avoid browser extensions from unknown sources
- Use incognito mode if on shared computer
- Clear browser data after voting on shared computer

### 💰 Wallet Security

- Never share your MetaMask seed phrase
- Use a hardware wallet for high-stakes voting
- Consider using a dedicated wallet for voting

---

## 10. FAQ

### General Questions

**Q: Is my vote really anonymous?**

A: Yes! The zero-knowledge proof proves you're eligible without revealing your identity. On the blockchain, there's no connection between your vote and your identity.

---

**Q: Can the poll creator see how I voted?**

A: No. The poll creator can see that votes were cast, but cannot identify who cast which vote.

---

**Q: What if I lose my identity?**

A: If you backed it up, you can restore it. If not, you'll need to create a new identity and re-register for future polls.

---

**Q: Can I vote multiple times?**

A: No. The cryptographic nullifier prevents double voting. Even if you try, the blockchain will reject your second vote.

---

**Q: What happens if I vote right before the deadline?**

A: Your vote must be included in a block before the poll end time. If the network is congested, your transaction might not be processed in time.

---

### Technical Questions

**Q: What is a "commitment"?**

A: A commitment is a cryptographic hash of your identity. It's like a fingerprint - unique to you but reveals nothing about your secret identity.

---

**Q: What is a "nullifier"?**

A: A nullifier is a unique value derived from your identity and the poll. It prevents double voting - if someone tries to vote twice, the same nullifier would be generated, and the blockchain would reject it.

---

**Q: Why does proof generation take so long?**

A: Zero-knowledge proofs require complex mathematical computations. The proof is generated entirely in your browser for privacy, which takes 10-30 seconds depending on your device.

---

**Q: Is this system audited?**

A: This is an academic project. For production use, professional security audits are recommended.

---

## Need Help?

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/stefan-neculai/blockchain-voting/issues)
2. Open a new issue with details about your problem
3. Contact: n.stefancatalin@gmail.com

---

<p align="center">
<strong>Vote Securely. Vote Anonymously. 🗳️</strong>
</p>
