#!/bin/bash

# Ensure terminal uses colored outputs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0;0m' # No Color

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}   GitHub Setup Script — Jason Gunawan Portfolio     ${NC}"
echo -e "${BLUE}=====================================================${NC}"

# Check Git configurations
GLOBAL_NAME=$(git config --global user.name)
GLOBAL_EMAIL=$(git config --global user.email)

if [ -z "$GLOBAL_NAME" ]; then
    echo -e "Git Username is not configured globally."
    read -p "Enter your full name (e.g. Jason Gunawan): " user_name
    git config --global user.name "$user_name"
    echo -e "${GREEN}✓ Global user.name configured.${NC}"
else
    echo -e "${GREEN}✓ Git Name:${NC} $GLOBAL_NAME"
fi

if [ -z "$GLOBAL_EMAIL" ]; then
    echo -e "Git Email is not configured globally."
    read -p "Enter your email address (connected to GitHub): " user_email
    git config --global user.email "$user_email"
    echo -e "${GREEN}✓ Global user.email configured.${NC}"
else
    echo -e "${GREEN}✓ Git Email:${NC} $GLOBAL_EMAIL"
fi

echo ""
# Prompt for GitHub details
read -p "Enter your GitHub username: " gh_user
while [ -z "$gh_user" ]; do
    read -p "Username cannot be empty. Please enter your GitHub username: " gh_user
done

read -p "Enter repository name [default: testporto]: " gh_repo
if [ -z "$gh_repo" ]; then
    gh_repo="testporto"
fi

# Configure remote origin
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$gh_user/$gh_repo.git"
echo -e "${GREEN}✓ Remote origin set to:${NC} https://github.com/$gh_user/$gh_repo.git"

echo ""
echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}  ACTION REQUIRED: CREATE REPOSITORY ON GITHUB       ${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo -e "1. Open your browser and navigate to: ${GREEN}https://github.com/new${NC}"
echo -e "2. Name your repository: ${GREEN}$gh_repo${NC}"
echo -e "3. Keep it Public (or Private) and leave everything else unchecked"
echo -e "   (Do NOT initialize with README, .gitignore, or license)."
echo -e "4. Click 'Create repository'."
echo -e "${BLUE}=====================================================${NC}"
read -p "Once created, press [ENTER] here to push the code..."

echo ""
echo -e "Attempting to push to branch 'main'..."
echo -e "Note: If prompted for password, enter your ${GREEN}GitHub Personal Access Token (PAT)${NC}."
echo -e "If you do not have a PAT, generate one here: ${BLUE}https://github.com/settings/tokens${NC}"
echo ""

if git push -u origin main; then
    echo -e "${GREEN}=====================================================${NC}"
    echo -e "${GREEN}✓ SUCCESS! Code has been pushed to GitHub.${NC}"
    echo -e "URL: https://github.com/$gh_user/$gh_repo"
    echo -e "====================================================="
    echo -e "${BLUE}Next Step: Host on Vercel${NC}"
    echo -e "1. Go to https://vercel.com and log in."
    echo -e "2. Click 'Add New' -> 'Project'."
    echo -e "3. Import your repository '$gh_repo'."
    echo -e "4. Click 'Deploy'."
    echo -e "${GREEN}=====================================================${NC}"
else
    echo -e "${RED}=====================================================${NC}"
    echo -e "${RED}✗ Push failed.${NC}"
    echo -e "Please verify that:"
    echo -e "  1. You created the repository '$gh_repo' on GitHub."
    echo -e "  2. You inputted the correct GitHub username."
    echo -e "  3. You used a valid GitHub Personal Access Token (PAT) as the password."
    echo -e "     (Standard passwords are no longer accepted by GitHub via Git CLI)."
    echo -e "====================================================="
fi
