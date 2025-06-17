const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

// --- CONFIGURATION ---
const RPC_URL = "http://127.0.0.1:8545/"; // e.g., from Infura or Alchemy
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const contractABI = require('./PollFactory.json').abi; // Adjust the path to your ABI file

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

// --- API ENDPOINTS ---

// Get a list of all polls (summary)
app.get('/polls', async (req, res) => {
    try {
        const count = await contract.pollCount();
        console.log(`Total polls: ${count}`);
        if (count === 0n) {
            return res.json([]); // No polls available
        }
        const polls = [];
        // Loop backwards to show newest polls first
        for (let i = BigInt(count) - 1n; i >= 0; i--) {
            const pollData = await contract.getPoll(i);
            console.log(`Fetching poll ${i}:`, pollData);
            polls.push({
                id: Number(i),
                question: pollData[0],
                options: pollData[1],
            });
            console.log(`Poll ${i}:`, pollData.question);
        }
        res.json(polls);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get full details for a single poll
app.get('/polls/:id', async (req, res) => {
    try {
        const pollId = req.params.id;
        const [question, options, votes] = await contract.getPoll(pollId);
        const formattedVotes = votes.map(v => Number(v));
        res.json({ id: pollId, question, options, votes: formattedVotes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(3001, () => {
    console.log('Backend server listening on port 3001');
});
