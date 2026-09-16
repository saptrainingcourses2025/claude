# How to Use Marketplace Plugins - Practical Step-by-Step Guide

## 🎯 What You'll Learn

By the end of this guide, you'll know:
- ✅ Where to find marketplace plugins
- ✅ How to browse available plugins
- ✅ How to install plugins in 3 different ways
- ✅ How to use installed plugins in your workflow
- ✅ How to manage multiple plugins
- ✅ Where to find SAP-specific plugins for CAP development

---

## 📱 Quick 5-Minute Start

### The Simplest Way: Using the Plugin Manager UI

```bash
# Step 1: Open Claude Code plugin manager
/plugin

# Step 2: Navigate to "Discover" tab
# (Press Tab key to switch tabs)

# Step 3: Browse available plugins
# Use arrow keys to navigate

# Step 4: Select a plugin and press Enter
# View details and install

# Done! Plugin is ready to use
```
*claude code by anubhav trainings*

**That's it!** The plugin is now active in your current session.

---

## 🏠 Understanding the Basics

### Three Key Concepts

#### 1. **Marketplace** 
A collection/catalog of plugins hosted on GitHub or a URL. It's like an app store.

**Examples:**
- `claude-plugins-official` - Anthropic's official marketplace (pre-installed)
- `secondsky/sap-skills` - SAP development plugins
- `xiaolai/claude-plugin-marketplace` - Community plugins

#### 2. **Plugin** 
A packaged bundle containing one or more skills, commands, agents, hooks, or MCP servers.

**Example:**
- `sap-cap-capire` plugin includes skills for CAP development

#### 3. **Skill**
Individual instruction sets/knowledge that Claude uses automatically based on context.

**Example:**
- `sap-cap-basics` skill (inside `sap-cap-capire` plugin)

### The Relationship
```
Marketplace (App Store)
    ↓
Contains many Plugins (Apps)
    ↓
Each Plugin has Skills, Commands, Agents, Hooks, MCP Servers
```
*claude code by anubhav trainings*

---

## 🔍 Method 1: Using the Interactive UI (Easiest)

### Step 1: Open Plugin Manager
```bash
/plugin
```
*claude code by anubhav trainings*

You'll see a tabbed interface:
```
┌─────────────────────────────────────┐
│ Installed | Discover | Marketplaces │ Errors
├─────────────────────────────────────┤
│                                     │
│ (Tab content shows here)            │
│                                     │
└─────────────────────────────────────┘
```
*claude code by anubhav trainings*

### Step 2: Browse Available Plugins
Navigate to the **Discover** tab:
```bash
# Press Tab key multiple times to reach "Discover" tab
# Or click on the Discover tab
```
*claude code by anubhav trainings*

You'll see a list of available plugins with:
- Plugin name
- Description
- What skills it includes
- Status (suggested for this directory / general)

### Step 3: View Plugin Details
```bash
# Navigate with arrow keys
↑ ↓  = Move between plugins
Enter = Select and view details
```
*claude code by anubhav trainings*

When you select a plugin, you'll see:
```
Plugin: sap-cap-capire
────────────────────────
Description: SAP CAP development plugin
Marketplace: sap-skills

Includes:
✓ Skills: cap-architecture, data-modeling, service-implementation
✓ Commands: init-cap-project, deploy-to-btp
✓ Agents: cap-architect
✓ MCP Servers: 1 (SAP API)

Status: Not installed
────────────────────────
[ Install ] [ Cancel ]
```
*claude code by anubhav trainings*

### Step 4: Install Plugin
```bash
# Press Enter on "Install" button
# Wait for confirmation message
```
*claude code by anubhav trainings*

### Step 5: Verify Installation
```bash
# Navigate to "Installed" tab
/plugin
# Press Tab to go to "Installed"

# You'll see your newly installed plugin listed
```
*claude code by anubhav trainings*

---

## 💻 Method 2: Using Command Line (Fastest)

### Basic Syntax

```bash
# Install from official marketplace
/plugin install <plugin-name>@claude-plugins-official

# Install from community marketplace
/plugin install <plugin-name>@<marketplace-name>

# List installed plugins
/plugin list

# Uninstall plugin
/plugin uninstall <plugin-name>
```
*claude code by anubhav trainings*

### SAP Development Examples

```bash
# Install SAP CAP plugin
/plugin install sap-cap-capire@sap-skills

# Install multiple SAP plugins at once
/plugin install sap-cap-capire@sap-skills sap-btp-cloud-platform@sap-skills sap-fiori-tools@sap-skills

# Install from Anthropic official marketplace
/plugin install code-review@claude-plugins-official
/plugin install feature-dev@claude-plugins-official
/plugin install security-guidance@claude-plugins-official

# Check what's installed
/plugin list
```
*claude code by anubhav trainings*

### Install Scopes

You can choose where to install a plugin:

```bash
# Global scope (default) - Available everywhere
/plugin install plugin-name --scope user

# Project scope - Only in current project
/plugin install plugin-name --scope project

# View difference:
--scope user     → Installed in ~/.claude/plugins/
--scope project  → Installed in .claude/plugins/ (versioned with your repo)
```
*claude code by anubhav trainings*

**Choose project scope if:**
- You want to share the plugin setup with your team
- You want it in version control
- Different projects need different plugins

**Choose user scope if:**
- You want the plugin available everywhere
- It's a personal development tool

---

## 🌐 Method 3: Adding External Marketplaces

By default, you only have the Anthropic official marketplace. To access SAP plugins or community plugins, you need to add their marketplaces first.

### Step 1: Get the Marketplace URL

For SAP skills, it's:
```
https://github.com/secondsky/sap-skills
```
*claude code by anubhav trainings*

Other popular marketplaces:
```
https://github.com/xiaolai/claude-plugin-marketplace
https://github.com/anthropics/claude-plugins-community
```
*claude code by anubhav trainings*

### Step 2: Add the Marketplace

#### Option A: Using UI
```bash
/plugin
# Go to "Marketplaces" tab
# Select "Add marketplace"
# Enter GitHub URL: https://github.com/secondsky/sap-skills
# Press Enter
```
*claude code by anubhav trainings*

#### Option B: Using Command Line
```bash
/plugin marketplace add https://github.com/secondsky/sap-skills
```
*claude code by anubhav trainings*

You'll see:
```
✓ Marketplace "sap-skills" added successfully
  URL: https://github.com/secondsky/sap-skills
  Plugins: 35 available
```
*claude code by anubhav trainings*

### Step 3: Verify Marketplace Added

```bash
/plugin
# Go to "Marketplaces" tab
# Should see: sap-skills (35 plugins)
```
*claude code by anubhav trainings*

### Step 4: Now Install Plugins from This Marketplace

```bash
# Now you can install SAP plugins
/plugin install sap-cap-capire@sap-skills
/plugin install sap-btp-cloud-platform@sap-skills
/plugin install sap-fiori-tools@sap-skills
```
*claude code by anubhav trainings*

---

## 🚀 Using Installed Plugins in Your Workflow

### Automatic Activation (Skills)

Once installed, skills automatically activate based on context.

```bash
# Example: You're working in a CAP project

# Claude Code detects:
# - db/data-model.cds file
# - package.json with @sap/cds dependency
# - srv/ directory

# It automatically activates:
# ✓ sap-cap-basics skill
# ✓ data-modeling skill
# ✓ service-implementation skill

# You just work normally - the skills guide Claude in the background
```
*claude code by anubhav trainings*

### Using Plugin Commands

Commands are manually invoked with slash (/).

```bash
# These become available after installing the plugin

# Examples with SAP CAP plugin:
/init-cap-project my-app
/create-entity Books
/generate-service BookshopService
/deploy-to-btp --org my-org

# Examples with official dev plugins:
/code-review          # Review code for best practices
/security-check       # Check for security issues
/commit-message       # Generate git commit messages
```
*claude code by anubhav trainings*

### How to Discover Available Commands

```bash
# Method 1: Type / and see autocomplete suggestions
/
# You'll see list of available commands

# Method 2: Ask Claude Code directly
"What commands are available from installed plugins?"

# Method 3: Check plugin details
/plugin
# Go to "Installed" tab
# Select a plugin to see its commands
```
*claude code by anubhav trainings*

---

## 📋 Complete Example: Installing SAP Plugins

Let me walk through a complete real-world example.

### Scenario: New SAP Developer Setting Up Claude Code

**Goal:** Set up Claude Code for SAP BTP CAP development with marketplace plugins

### Complete Setup Steps

#### Step 1: Open Claude Code
```bash
cd /path/to/your/sap-project
claude code  # or just open Claude Code
```
*claude code by anubhav trainings*

#### Step 2: Add SAP Skills Marketplace
```bash
# Open plugin manager
/plugin

# Go to Marketplaces tab (press Tab)
# Select "Add Marketplace"
# Enter: https://github.com/secondsky/sap-skills
# Press Enter
```
*claude code by anubhav trainings*

**Output:**
```
✓ Marketplace added: sap-skills
  URL: https://github.com/secondsky/sap-skills
  Available plugins: 35
```
*claude code by anubhav trainings*

#### Step 3: Browse Available SAP Plugins
```bash
/plugin
# Go to "Discover" tab
# Browse SAP plugins:

  • sap-cap-capire (18 skills)
  • sap-btp-cloud-platform (12 skills)
  • sap-fiori-tools (15 skills)
  • sap-abap-cds (10 skills)
  • sap-hana-cloud (8 skills)
  ... and 30 more
```
*claude code by anubhav trainings*

#### Step 4: Install Required Plugins
```bash
# For CAP development, install these core plugins:
/plugin install sap-cap-capire@sap-skills
/plugin install sap-btp-cloud-platform@sap-skills
/plugin install sap-fiori-tools@sap-skills

# Plus optional ones based on your needs:
/plugin install sap-abap-cds@sap-skills           # If using ABAP CDS
/plugin install sap-hana-cloud@sap-skills         # If using HANA
```
*claude code by anubhav trainings*

#### Step 5: Verify Installation
```bash
/plugin
# Go to "Installed" tab

# You should see:
  ✓ sap-cap-capire
  ✓ sap-btp-cloud-platform
  ✓ sap-fiori-tools
  ✓ sap-abap-cds
  ✓ sap-hana-cloud
```
*claude code by anubhav trainings*

#### Step 6: Start Using Plugins
```bash
# Now you can use commands like:
/init-cap-project bookstore-app

# And skills activate automatically when you:
# - Open a CDS file → CDS modeling skills activate
# - Open package.json → CAP setup skills activate
# - Work in srv/ → Service implementation skills activate
```
*claude code by anubhav trainings*

---

## 🛠️ Managing Your Plugins

### View Plugin Installation Details

```bash
/plugin list
```
*claude code by anubhav trainings*

Shows:
```
Global Plugins (~/.claude/plugins/):
  ✓ sap-cap-capire (v1.5.0) - 18 skills
  ✓ code-review (v2.0.1) - 5 skills
  
Project Plugins (.claude/plugins/):
  ✓ sap-fiori-tools (v1.2.0) - 15 skills

Marketplaces:
  • claude-plugins-official (33 plugins)
  • sap-skills (35 plugins)
```
*claude code by anubhav trainings*

### Remove a Plugin

```bash
# Uninstall from global
/plugin uninstall sap-cap-capire

# Remove marketplace
/plugin marketplace remove sap-skills
```
*claude code by anubhav trainings*

### Update Plugins

Currently, there's no auto-update feature. To update:

```bash
# Uninstall old version
/plugin uninstall plugin-name

# Reinstall latest
/plugin install plugin-name@marketplace-name
```
*claude code by anubhav trainings*

### Check Plugin Status

```bash
/plugin
# Go to "Errors" tab if you have issues

# You'll see any plugin loading errors
```
*claude code by anubhav trainings*

---

## 📊 Popular Marketplace Plugins by Category

### SAP Development
```bash
# Core CAP Development
/plugin marketplace add https://github.com/secondsky/sap-skills
/plugin install sap-cap-capire@sap-skills
/plugin install sap-btp-cloud-platform@sap-skills
/plugin install sap-fiori-tools@sap-skills

# Also available:
# sap-abap-cds, sap-hana-cloud, sap-datasphere, sap-analytics-cloud
```
*claude code by anubhav trainings*

### General Development (Official Anthropic)
```bash
# Code quality
/plugin install code-review@claude-plugins-official
/plugin install security-guidance@claude-plugins-official

# Development workflow
/plugin install feature-dev@claude-plugins-official
/plugin install commit-commands@claude-plugins-official

# UI/Frontend
/plugin install frontend-design@claude-plugins-official
```
*claude code by anubhav trainings*

### Community Plugins
```bash
# First add marketplace
/plugin marketplace add https://github.com/xiaolai/claude-plugin-marketplace

# Then install
/plugin install cc-suite@xiaolai
/plugin install tdd-guardian@xiaolai
/plugin install echo-sleuth@xiaolai
```
*claude code by anubhav trainings*

---

## 🎓 Understanding Plugin Contents

When you select a plugin to view details, you'll see:

### What Each Component Does

#### Skills ✓
```
These activate AUTOMATICALLY based on context
- You don't invoke them manually
- They guide Claude's responses
- Example: CDS modeling skill activates when you edit .cds files
```
*claude code by anubhav trainings*

#### Commands ⌘
```
These are invoked MANUALLY with /
- Example: /init-cap-project
- Example: /deploy-to-btp
- You see them in autocomplete after /
```
*claude code by anubhav trainings*

#### Agents 🤖
```
These are specialized sub-agents for complex tasks
- More focused than the main Claude Code agent
- Handle specific workflows
- Example: cap-architect agent specializes in CAP architecture
```
*claude code by anubhav trainings*

#### Hooks 🛡️
```
These run AUTOMATICALLY on events
- Examples: on-commit, on-file-save, on-build-failure
- No manual invocation needed
- May impact performance if many hooks
```
*claude code by anubhav trainings*

#### MCP Servers 🔌
```
These integrate EXTERNAL SERVICES
- Examples: GitHub integration, SAP API access
- Require authentication sometimes
- Cost context (memory usage)
```
*claude code by anubhav trainings*

---

## ⚠️ Important Notes & Best Practices

### 1. Trust Plugins Before Installing

```
⚠️ Plugin Safety Reminder:
- Anthropic does not control third-party plugin content
- Verify you trust the source
- Check GitHub repo for documentation
- Review what the plugin does
```
*claude code by anubhav trainings*

### 2. Plugin Scope Matters

```bash
# ✓ Good practice: Team CAP plugins in project scope
/plugin install sap-cap-capire --scope project
# → Shared with team via .claude/plugins/ in git

# ✓ Good practice: Personal tools in user scope
/plugin install my-custom-tool --scope user
# → Only on your machine
```
*claude code by anubhav trainings*

### 3. Not Too Many Plugins

```
⚠️ Performance consideration:
- Each plugin adds context overhead
- Don't install plugins you don't use regularly
- MCP servers especially impact performance
- Start with 3-5 core plugins
- Add more as needed
```
*claude code by anubhav trainings*

### 4. Keep Plugin List Updated

```bash
# Occasionally check what you have installed
/plugin list

# Remove unused plugins
/plugin uninstall unused-plugin

# This keeps things lean and fast
```
*claude code by anubhav trainings*

---

## 🔧 Troubleshooting

### Problem 1: Plugin Not Found

```bash
Error: Plugin "sap-cap-capire" not found in any marketplace
```
*claude code by anubhav trainings*

**Solution:**
```bash
# The marketplace might not be added yet
/plugin marketplace add https://github.com/secondsky/sap-skills

# Then try installing again
/plugin install sap-cap-capire@sap-skills
```
*claude code by anubhav trainings*

### Problem 2: Command Not Showing Up

```bash
# After installing, plugin commands don't appear
```
*claude code by anubhav trainings*

**Solution:**
```bash
# Reload plugins
/reload-plugins

# Or restart Claude Code completely
# Commands should appear in / autocomplete

# If still missing, check installation:
/plugin list
```
*claude code by anubhav trainings*

### Problem 3: Marketplace URL Invalid

```bash
Error: Invalid marketplace URL
```
*claude code by anubhav trainings*

**Solution:**
```bash
# Make sure it's a valid GitHub URL format:
✓ https://github.com/secondsky/sap-skills
✓ https://github.com/username/plugin-repo

# NOT:
✗ github.com/secondsky/sap-skills (missing https://)
✗ https://github.com/secondsky (missing repo name)
```
*claude code by anubhav trainings*

### Problem 4: Slow Performance After Installing Plugins

```bash
# Too many plugins or MCP servers?
```
*claude code by anubhav trainings*

**Solution:**
```bash
# Check what's installed
/plugin list

# Check which plugins have MCP servers
/plugin
# Go to Discover tab and look for "🔌" indicators

# Uninstall heavy plugins you don't need
/plugin uninstall heavy-plugin-name

# Keep only active plugins
```
*claude code by anubhav trainings*

---

## 📚 Finding More Plugins

### Official Locations

1. **Anthropic Official Marketplace**
   - URL: https://claude.com/plugins
   - Built-in to Claude Code

2. **SAP Skills Marketplace**
   - URL: https://github.com/secondsky/sap-skills
   - 35+ plugins for SAP development

3. **Community Marketplace**
   - URL: https://github.com/anthropics/claude-plugins-community
   - Community-curated plugins

4. **Claude Plugin Hub**
   - URL: https://claudemarketplaces.com
   - Directory of 2,500+ plugins
   - Searchable by category
   - Shows install count and ratings

### How to Find the Right Plugin

```bash
# Method 1: Browse on Web
1. Visit https://claudemarketplaces.com
2. Search by keyword: "sap", "typescript", "docker", etc.
3. Click plugin to see install command
4. Copy and run in Claude Code

# Method 2: Search with Claude
Ask Claude Code directly:
"I need a plugin for [task]. What would you recommend?"

# Method 3: Ask in community
- Claude community forums
- SAP developer communities
- GitHub discussions
```
*claude code by anubhav trainings*

---

## ✅ Quick Checklist: Your First Plugin Install

- [ ] Open Claude Code: `/plugin`
- [ ] Add marketplace: `/plugin marketplace add https://...`
- [ ] Browse plugins: Go to "Discover" tab
- [ ] Select plugin and press Enter
- [ ] Click "Install"
- [ ] Verify installed: Go to "Installed" tab
- [ ] Start using: Type `/` to see available commands
- [ ] Test: Run a command from the plugin
- [ ] Success! 🎉

---

## 🎬 Next Steps

1. **Install your first plugin** using Method 1 (UI) - it's easiest
2. **Try a command** from the plugin
3. **Work on a project** and let skills activate automatically
4. **Add more plugins** as you discover useful ones
5. **Share your setup** with team via `.claude/settings.json`

---

## 📖 Official Documentation

- Claude Code Plugins: https://code.claude.com/docs/en/plugins
- Discover & Install: https://code.claude.com/docs/en/discover-plugins
- Create Plugins: https://code.claude.com/docs/en/create-plugins
- Claude Plugin Hub: https://claudemarketplaces.com

---

## 💡 Pro Tips

### Tip 1: Install in Project Scope for Teams
```bash
# So everyone gets the same plugins
cd your-team-project
/plugin install sap-cap-capire@sap-skills --scope project

# Commit .claude/settings.json to git
git add .claude/settings.json
git commit -m "Add CAP development plugins"
```
*claude code by anubhav trainings*

### Tip 2: Create Your Own Marketplace
If your organization has custom plugins, create a team marketplace:
1. Create GitHub repo with plugin structure
2. Add all plugins to that repo
3. Share repo URL with team
4. Everyone adds it: `/plugin marketplace add https://...`

### Tip 3: Document Plugin Setup
Create `.claude/README.md`:
```markdown
# Claude Code Setup

## Installed Plugins
- sap-cap-capire - CAP development
- sap-btp-cloud-platform - BTP deployment
- sap-fiori-tools - UI development

## How to Install
1. Clone this repo
2. Run: `/plugin`
3. Plugins load from .claude/settings.json

## Commands Available
- /init-cap-project
- /deploy-to-btp
- /create-fiori-app
```
*claude code by anubhav trainings*

### Tip 4: Share Your Plugin Setup
Create `.claude/settings.json` in your project:
```json
{
  "extraKnownMarketplaces": [
    {
      "name": "sap-skills",
      "url": "https://github.com/secondsky/sap-skills"
    }
  ],
  "plugins": [
    {
      "name": "sap-cap-capire",
      "enabled": true,
      "scope": "project"
    }
  ]
}
```
*claude code by anubhav trainings*

When team members clone the project, plugins auto-load!

---

## 🎯 Summary

| Method | Best For | Command |
|--------|----------|---------|
| **UI** | Learning, browsing | `/plugin` → navigate with tabs |
| **CLI** | Speed, automation | `/plugin install <name>@<marketplace>` |
| **Config File** | Team sharing | `.claude/settings.json` |

**Remember:** 
- First **add marketplace** (only once)
- Then **install plugins** from that marketplace
- Plugins either activate automatically (skills) or manually (commands)
- Start with 3-5 plugins and add more as needed

You're now ready to use marketplace plugins like a pro! 🚀

