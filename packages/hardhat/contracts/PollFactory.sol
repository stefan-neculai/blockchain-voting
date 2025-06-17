// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PollFactory {

    struct Poll {
        string question;
        string[] options;
        uint[] votes;
    }

    // Maps a poll ID to its data
    mapping(uint => Poll) public polls;
    // Maps a poll ID to a voter's address to check if they've voted
    mapping(uint => mapping(address => bool)) public hasVoted;

    uint public pollCount;

    event PollCreated(uint indexed pollId, address indexed creator);

    function createPoll(string memory _question, string[] memory _options) public {
        require(_options.length > 1, "At least two options required.");

        uint pollId = pollCount;
        Poll storage newPoll = polls[pollId];
        newPoll.question = _question;

        for (uint i = 0; i < _options.length; i++) {
            newPoll.options.push(_options[i]);
        }
        newPoll.votes = new uint[](_options.length);

        pollCount++;
        emit PollCreated(pollId, msg.sender);
    }

    function vote(uint _pollId, uint _optionIndex) public {
        require(_pollId < pollCount, "Poll does not exist.");
        require(!hasVoted[_pollId][msg.sender], "Already voted in this poll.");
        require(_optionIndex < polls[_pollId].options.length, "Invalid option.");

        hasVoted[_pollId][msg.sender] = true;
        polls[_pollId].votes[_optionIndex]++;
    }

    function getPoll(uint _pollId) public view returns (string memory, string[] memory, uint[] memory) {
        require(_pollId < pollCount, "Poll does not exist.");
        Poll storage p = polls[_pollId];
        return (p.question, p.options, p.votes);
    }
}