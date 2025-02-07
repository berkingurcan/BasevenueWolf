// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AIAgentRegistry is Ownable {
    struct Agent {
        string name;
        string metadata;
        address owner;
        bool isActive;
    }

    mapping(uint256 => Agent) public agents;
    uint256 public nextAgentId;

    event AgentRegistered(uint256 indexed agentId, string name, address owner);
    event AgentUpdated(uint256 indexed agentId, string name, string metadata);
    event AgentDeactivated(uint256 indexed agentId);

    constructor() Ownable(msg.sender) {}

    function registerAgent(string memory name, string memory metadata) external returns (uint256) {
        uint256 agentId = nextAgentId++;
        agents[agentId] = Agent({
            name: name,
            metadata: metadata,
            owner: msg.sender,
            isActive: true
        });

        emit AgentRegistered(agentId, name, msg.sender);
        return agentId;
    }

    function updateAgent(uint256 agentId, string memory name, string memory metadata) external {
        require(agents[agentId].owner == msg.sender, "Not the agent owner");
        require(agents[agentId].isActive, "Agent is not active");

        agents[agentId].name = name;
        agents[agentId].metadata = metadata;

        emit AgentUpdated(agentId, name, metadata);
    }

    function deactivateAgent(uint256 agentId) external {
        require(agents[agentId].owner == msg.sender, "Not the agent owner");
        require(agents[agentId].isActive, "Agent already deactivated");

        agents[agentId].isActive = false;
        emit AgentDeactivated(agentId);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }
} 