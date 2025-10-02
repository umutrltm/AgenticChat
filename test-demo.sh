#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' 

BASE_URL="http://localhost:3000"


chat() {
  local message="$1"
  local session="$2"
  
  echo -e "${YELLOW}User:${NC} $message"
  
  response=$(curl -s -X POST "$BASE_URL/chat" \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\": \"$session\", \"message\": \"$message\"}")
  
  echo -e "${GREEN}Agent:${NC} $(echo $response | jq -r '.reply')"
  echo -e "${BLUE}Tools Used:${NC} $(echo $response | jq -r '.toolsUsed | join(", ")')"
  echo ""
  
  sleep 1
}

echo -e "${BLUE}=== Demo Journey 1: Add + Recall ===${NC}\n"

chat "Add Alice (alice@example.com) as a VIP" "demo-1"
chat "Add Bob (bob@example.com) as a regular contact with note: met at tech meetup" "demo-1"
chat "Who are my VIPs?" "demo-1"
chat "What did we add earlier?" "demo-1"

echo -e "\n${BLUE}=== Demo Journey 2: Update ===${NC}\n"

chat "Mark Alice as not VIP and add note: met at conference" "demo-1"
chat "Show me Alice's details" "demo-1"

echo -e "\n${BLUE}=== Demo Journey 3: Semantic Recall ===${NC}\n"

chat "Who did we meet at the conference?" "demo-1"
chat "Tell me about people I met at events" "demo-1"

echo -e "\n${BLUE}=== Additional Tests ===${NC}\n"

chat "List all my contacts" "demo-1"
chat "Who did I meet at a meetup?" "demo-1"

# Show final state
echo -e "${BLUE}=== Final Database State ===${NC}\n"
echo -e "${YELLOW}Contacts:${NC}"
curl -s "$BASE_URL/contacts" | jq '.contacts'

echo -e "\n${YELLOW}Memories:${NC}"
curl -s "$BASE_URL/memory?sessionId=demo-1" | jq '.memories'

echo ""
