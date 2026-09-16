# Complete Guide: Using Claude Code Plugins for SAP BTP CAP Development

## Table of Contents
1. [Plugin Structure & Anatomy](#plugin-structure--anatomy)
2. [Step-by-Step Setup Guide](#step-by-step-setup-guide)
3. [Development Workflow with Slash Commands](#development-workflow-with-slash-commands)
4. [Practical SAP CAP Project Use Case](#practical-sap-cap-project-use-case)
5. [Troubleshooting & Best Practices](#troubleshooting--best-practices)

---

### Structure Visualization
```
my-sap-plugin/
├── .claude-plugin/
│   └── plugin.json                    # Plugin metadata & manifest
├── commands/
│   ├── create-cap-service.md         # Slash command
│   ├── deploy-btp.md                 # Slash command
│   └── generate-cds.md               # Slash command
├── agents/
│   ├── cap-architect.md              # Specialized sub-agent
│   └── btp-deployment-expert.md      # Specialized sub-agent
├── skills/
│   ├── sap-cap-basics/
│   │   └── SKILL.md
│   ├── sap-btp-deployment/
│   │   └── SKILL.md
│   ├── fiori-elements/
│   │   └── SKILL.md
│   └── abap-cds/
│       └── SKILL.md
├── hooks/
│   └── hooks.json                    # Event configuration
├── .mcp.json                         # MCP server definitions
└── README.md
```
*claude code by anubhav trainings*

### File Types Explained

#### plugin.json (Manifest)
```json
{
  "name": "sap-cap-developer",
  "version": "1.0.0",
  "description": "Production-ready plugin for SAP BTP CAP development",
  "author": "Your Name",
  "license": "MIT",
  "capabilities": {
    "skills": ["sap-cap-basics", "sap-btp-deployment"],
    "commands": ["create-cap-service", "deploy-btp"],
    "agents": ["cap-architect"],
    "hooks": true,
    "mcp": true
  }
}
```
*claude code by anubhav trainings*

#### SKILL.md (Knowledge File)
```yaml
---
description: |
  Expert in SAP Cloud Application Programming (CAP) development.
  Use when: Creating CAP services, defining data models, or implementing handlers.
when_to_use: |
  - Creating new CAP projects
  - Implementing service definitions
  - Working with CDS (Core Data Services)
  - Setting up authentication and authorization
---

# SAP CAP Development Skills

## Best Practices
1. Always define entities in db/data-model.cds
2. Use calculated elements for derived data
3. Implement event handlers in srv/ directory
...
```
*claude code by anubhav trainings*

---

## Plugin Structure & Anatomy

### Complete Directory Breakdown

#### 1. **Manifest File (.claude-plugin/plugin.json)**
The heart of your plugin. Defines metadata and component paths.

```json
{
  "name": "sap-btp-cap-pro",
  "version": "1.5.0",
  "description": "Professional-grade SAP BTP CAP development plugin",
  "author": "Your Name",
  "license": "MIT",
  "keywords": ["sap", "cap", "btp", "cloud", "development"],
  "engines": {
    "claude-code": ">=1.0.0"
  },
  "capabilities": {
    "skills": [
      "cap-architecture",
      "btp-deployment",
      "fiori-integration",
      "data-modeling"
    ],
    "commands": [
      "init-cap-project",
      "deploy-to-btp",
      "generate-service"
    ],
    "agents": ["cap-architect", "btp-expert"],
    "hooks": true,
    "mcp": true
  },
  "customPaths": {
    "skills": "${CLAUDE_PLUGIN_ROOT}/skills",
    "commands": "${CLAUDE_PLUGIN_ROOT}/commands"
  }
}
```
*claude code by anubhav trainings*

#### 2. **Skills (skills/SKILL.md)**
Model-invoked knowledge that Claude automatically uses based on context.

```yaml
---
description: |
  Expert in SAP Cloud Application Programming (CAP).
  Covers data modeling, service implementation, and event handling.
when_to_use: |
  - Creating or modifying CDS data models
  - Implementing service handlers
  - Configuring authentication/authorization
  - Setting up OData services
tools: [Read, Write, Bash]
---

# SAP CAP Development Excellence

## 1. Data Modeling (db/data-model.cds)

### Entity Definition Standards
- Always define primary keys explicitly
- Use calculated elements for read-only derived fields
- Leverage composition relationships for hierarchy

### Example Structure
```cds
namespace sap.capire.bookshop;

using cuid, managed from '@sap/cds/common';

entity Books : cuid, managed {
  title       : String;
  author      : String;
  ISBN        : String;
  pages       : Integer;
  price       : Decimal(9,2);
  currency    : String;
  stock       : Integer;
  virtual available : Boolean;
}

entity Orders : cuid, managed {
  customer    : String;
  book        : Association to Books;
  quantity    : Integer;
  total       : Decimal(10,2);
}
```
*claude code by anubhav trainings*

## 2. Service Implementation (srv/)

### File Naming Convention
- srv/service-name-service.js
- srv/service-name-service.cds

### Handler Implementation Pattern
```javascript
const cds = require('@sap/cds');
const { Books, Orders } = cds.models;

class BookshopService extends cds.ApplicationService {
  async init() {
    // Bind event handlers
    this.on('CREATE', 'Orders', this.createOrder);
    this.on('READ', Books, this.readBooks);
    super.init();
  }

  async createOrder(req) {
    const { quantity, book_ID } = req.data;
    const { stock } = await cds.run(SELECT.one(Books, b => b`*`).where`ID=${book_ID}`);
    
    if (stock >= quantity) {
      await cds.run(UPDATE(Books).where`ID=${book_ID}`.set`stock -= ${quantity}`);
      return req.data;
    }
    return req.error(409, 'Insufficient stock');
  }
}

module.exports = BookshopService;
```
*claude code by anubhav trainings*

## 3. Testing Standards
- Unit test all service handlers
- Mock database calls appropriately
- Test both success and error scenarios

## 4. Authentication & Authorization
- Use JWT tokens in production
- Define scopes in xs-security.json
- Test role-based access restrictions
```

#### 3. **Commands (commands/command-name.md)**
Custom slash commands that users can invoke.

```yaml
---
description: Initialize a new SAP CAP project
invoke: /init-cap-project
parameters:
  project_name: Project name
  use_typescript: Use TypeScript (true/false)
---

# Initialize SAP CAP Project

Create a production-ready SAP CAP project with all necessary configurations.

## Steps
1. Create project directory
2. Initialize package.json
3. Install dependencies
4. Generate sample data model
5. Create service definition
6. Set up local testing

## Output
- Complete project structure
- Pre-configured npm scripts
- Sample CDS files
- Ready-to-use handlers
```
*claude code by anubhav trainings*

#### 4. **Hooks (hooks/hooks.json)**
Event-driven automation that triggers on specific events.

```json
{
  "hooks": [
    {
      "event": "file:created",
      "pattern": "**/*.cds",
      "action": "validate-cds"
    },
    {
      "event": "file:saved",
      "pattern": "db/data-model.cds",
      "action": "generate-types"
    },
    {
      "event": "pre-commit",
      "action": "lint-and-format"
    }
  ]
}
```
*claude code by anubhav trainings*

#### 5. **MCP Servers (.mcp.json)**
Integration with external services.

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["./mcp-servers/github-server.js"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "sap-btp": {
      "command": "python3",
      "args": ["./mcp-servers/btp-server.py"]
    }
  }
}
```
*claude code by anubhav trainings*

---

## Step-by-Step Setup Guide

### Phase 1: Installation

#### Step 1.1: Install Claude Code
```bash
# Download from https://claude.ai or use your package manager
# For macOS with Homebrew:
brew install claude-code

# For npm/Node.js users:
npm install -g @anthropic-ai/claude-code

# Verify installation
claude-code --version
```
*claude code by anubhav trainings*

#### Step 1.2: Install SAP CAP Marketplace Plugin
```bash
# Open Claude Code terminal and use:
/plugin marketplace add https://github.com/secondsky/sap-skills

# Or install directly from GitHub marketplace:
/plugin install sap-cap-capire@sap-skills
```
*claude code by anubhav trainings*

#### Step 1.3: Install Multiple Related Plugins
```bash
# Install multiple SAP plugins at once
/plugin install sap-cap-capire@sap-skills sap-btp-cloud-platform@sap-skills sap-fiori-tools@sap-skills

# List all installed plugins
/plugin list
```
*claude code by anubhav trainings*

#### Step 1.4: Verify Installation
```bash
# Check active plugins
/plugin status

# Reload plugins after installation
/reload-plugins
```
*claude code by anubhav trainings*

### Phase 2: Configuration

#### Step 2.1: Create Team Configuration
Create `.claude/settings.json` in your project root:

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
    },
    {
      "name": "sap-btp-cloud-platform",
      "enabled": true,
      "scope": "project"
    }
  ]
}
```
*claude code by anubhav trainings*

#### Step 2.2: Create Local Plugin Configuration
Create `.claude/agents/` directory for local agent definitions:

```bash
mkdir -p .claude/agents
mkdir -p .claude/skills
```
*claude code by anubhav trainings*

#### Step 2.3: Set Environment Variables
```bash
# For deployment credentials
export CF_USERNAME="your-btp-username"
export CF_PASSWORD="your-btp-password"
export CF_API_ENDPOINT="https://api.cf.your-region.hana.ondemand.com"

# For SAP Development Tools
export NODE_ENV="development"
export ENABLE_CAP_DEBUG="true"
```
*claude code by anubhav trainings*

### Phase 3: Validation

#### Step 3.1: Test Plugin Activation
Ask Claude Code to perform an SAP CAP-specific task:
```
"Create a new CAP service for inventory management"
```
*claude code by anubhav trainings*
This should automatically activate the `sap-cap-capire` plugin.

#### Step 3.2: Verify Skills Loading
```bash
# Check which skills are active
/skill list

# Reload if needed
/reload-plugins
```
*claude code by anubhav trainings*

---

## Development Workflow with Slash Commands

### Core SAP Development Slash Commands

#### 1. Project Initialization Commands

```bash
# Initialize new CAP project with default configuration
/init-cap-project my-bookstore-app

# Initialize with specific options
/init-cap-project my-app --use-typescript --with-auth --sample-data

# Initialize with SAP Fiori template
/init-cap-project my-app --with-fiori-elements --ui5-version latest
```
*claude code by anubhav trainings*

**What It Does:**
- Creates project directory structure
- Initializes package.json
- Installs SAP CAP dependencies
- Creates sample db/ and srv/ directories
- Sets up .gitignore and configuration files

#### 2. Data Modeling Commands

```bash
# Generate CDS data model from description
/generate-cds-model Books,Authors,Orders

# Create new entity with fields
/create-entity --name Products --fields "id,name,price,category,stock"

# Add relationship between entities
/add-association Orders.book -> Books

# Validate CDS syntax
/validate-cds
```
*claude code by anubhav trainings*

**Example Workflow:**
```bash
# Step 1: Create main entities
/create-entity --name Books --fields "id,title,author,price"

# Step 2: Add validation and constraints
/enhance-entity Books --add-validations

# Step 3: Validate the model
/validate-cds

# Step 4: Generate TypeScript types
/generate-types
```
*claude code by anubhav trainings*

#### 3. Service Implementation Commands

```bash
# Scaffold new OData service
/create-service BookshopService

# Generate service handlers with CRUD operations
/generate-handlers BookshopService --entities Books,Orders,Authors

# Add authentication to service
/add-authentication BookshopService --type jwt

# Add field validation rules
/add-validations BookshopService --entity Orders
```
*claude code by anubhav trainings*

#### 4. Deployment Commands

```bash
# Deploy to SAP BTP CloudFoundry
/deploy-to-btp --org "my-org" --space "development"

# Deploy with specific manifest
/deploy-to-btp --manifest manifest-dev.yml

# Rollback previous deployment
/rollback-deployment --version previous

# Check deployment status
/deployment-status
```
*claude code by anubhav trainings*

#### 5. Testing & Validation Commands

```bash
# Generate unit tests for service
/generate-tests BookshopService

# Run all CAP tests locally
/test-cap-app

# Run specific test file
/test-file test/bookshop-service.test.js

# Generate E2E test scenarios
/generate-e2e-tests --service BookshopService
```
*claude code by anubhav trainings*

#### 6. UI/Fiori Commands

```bash
# Create new Fiori Elements application
/create-fiori-app books-app --datasource BookshopService

# Generate Fiori table with data binding
/generate-fiori-table --entity Books --app books-app

# Create Fiori form for entity
/create-fiori-form Orders --page order-create

# Preview Fiori application
/fiori-preview books-app
```
*claude code by anubhav trainings*

#### 7. Code Quality Commands

```bash
# Lint CDS files
/lint-cds

# Format all code files
/format-code

# Run static analysis
/analyze-code --strict

# Generate code documentation
/generate-docs
```
*claude code by anubhav trainings*

#### 8. Database Commands

```bash
# Initialize database with sample data
/db-init

# Create database migration
/db-migration --name add-inventory-table

# View database schema
/db-schema --entity Books

# Export database data
/db-export --format json --output data.json
```
*claude code by anubhav trainings*

#### 9. Hybrid Local Development Commands

```bash
# Start local CAP development server
/start-dev-server

# Start with debug logging
/start-dev-server --debug

# Watch for file changes
/watch-mode

# Access local Fiori preview
/open-localhost --port 4004
```
*claude code by anubhav trainings*

#### 10. Configuration & Info Commands

```bash
# Show current environment configuration
/show-config

# Update CAP to latest version
/update-cap-version

# Check plugin versions
/plugin versions

# Get detailed plugin information
/plugin info sap-cap-capire
```
*claude code by anubhav trainings*

### Command Invocation Patterns

#### Pattern 1: Sequential Command Workflow
```bash
# Complete development cycle
/init-cap-project bookstore
/create-entity --name Books --fields "id,title,price"
/create-service BookshopService
/generate-handlers BookshopService --entities Books
/generate-tests BookshopService
/test-cap-app
/deploy-to-btp --org my-org --space dev
```
*claude code by anubhav trainings*

#### Pattern 2: Interactive Command Mode
```bash
# Let Claude guide you through interactive setup
/setup-interactive

# Follow prompts for:
# - Project name
# - Technology stack
# - Database choice
# - Deployment target
```
*claude code by anubhav trainings*

#### Pattern 3: Batch Operations
```bash
# Execute multiple operations in sequence
/batch-execute << 'EOF'
/create-entity Books
/create-entity Authors
/add-association Books.author -> Authors
/generate-service BookService
/generate-handlers BookService
EOF
```
*claude code by anubhav trainings*

---

## Practical SAP CAP Project Use Case

### Project: E-Commerce Bookstore Platform

#### Step 1: Create Project Structure
```bash
/init-cap-project bookstore-app --use-typescript --with-fiori-elements --with-auth
```
*claude code by anubhav trainings*

#### Step 2: Define Data Model

**Create file: db/data-model.cds**
```cds
namespace bookstore.app;

using {
  cuid,
  managed,
  temporal
} from '@sap/cds/common';

/**
 * Books Entity - Core product catalog
 */
entity Books : cuid, managed {
  title          : String not null;
  author         : String;
  ISBN           : String unique;
  pages          : Integer;
  price          : Decimal(9,2) not null;
  currency       : String default 'USD';
  stock          : Integer default 0;
  category       : String;
  description    : String;
  image_url      : String;
  
  // Virtual elements
  virtual available : Boolean;
  virtual discount  : Decimal(5,2);
  
  // Associations
  orders         : Composition of many Orders on orders.book;
  reviews        : Composition of many Reviews on reviews.book;
}

/**
 * Authors Entity
 */
entity Authors : cuid, managed {
  name           : String not null;
  biography      : String;
  birth_date     : Date;
  website        : String;
  
  books          : Association to many Books on books.author = $self;
}

/**
 * Orders Entity - Customer orders
 */
entity Orders : cuid, managed {
  customer_name  : String not null;
  customer_email : String;
  book           : Association to Books;
  quantity       : Integer not null;
  unit_price     : Decimal(9,2);
  total_amount   : Decimal(10,2);
  status         : String enum {
    PENDING;
    PROCESSING;
    SHIPPED;
    DELIVERED;
    CANCELLED;
  } default 'PENDING';
  
  order_date     : DateTime default now();
  delivery_date  : DateTime;
}

/**
 * Reviews Entity - Customer reviews
 */
entity Reviews : cuid, managed {
  book           : Association to Books;
  customer_name  : String;
  rating         : Integer;
  comment        : String;
  helpful_count  : Integer default 0;
  
  review_date    : DateTime default now();
}

/**
 * Inventory Tracking
 */
entity InventoryLog : cuid, managed {
  book           : Association to Books;
  transaction    : String enum {
    ADD;
    REMOVE;
    ADJUSTMENT;
  };
  quantity       : Integer;
  reason         : String;
  previous_stock : Integer;
  new_stock      : Integer;
  
  timestamp      : DateTime default now();
}
```
*claude code by anubhav trainings*

#### Step 3: Create Service Definition

**Create file: srv/bookshop-service.cds**
```cds
using { bookstore.app } from '../db/data-model';

service BookshopService {
  
  // Entities exposed via OData
  entity Books as projection on app.Books;
  entity Authors as projection on app.Authors;
  entity Orders as projection on app.Orders excluding { customer_email };
  entity Reviews as projection on app.Reviews;
  entity InventoryLog as projection on app.InventoryLog;
  
  // Custom actions
  action placeOrder(
    book_ID : UUID,
    quantity : Integer,
    customer_name : String
  ) returns { success : Boolean; message : String };
  
  action submitReview(
    book_ID : UUID,
    rating : Integer,
    comment : String
  ) returns { success : Boolean };
  
  function getAvailableBooks() returns array of Books;
  function getTopReviewedBooks(limit : Integer) returns array of Books;
}
```
*claude code by anubhav trainings*

#### Step 4: Implement Service Handlers

**Create file: srv/bookshop-service.js**
```javascript
const cds = require('@sap/cds');
const { Books, Orders, Reviews, InventoryLog } = cds.models;

/**
 * BookshopService Implementation
 */
class BookshopService extends cds.ApplicationService {
  
  async init() {
    // Event handlers for Orders entity
    this.on('CREATE', 'Orders', this.createOrder);
    this.on('UPDATE', 'Orders', this.updateOrder);
    this.on('DELETE', 'Orders', this.deleteOrder);
    
    // Event handlers for Reviews
    this.on('CREATE', 'Reviews', this.createReview);
    
    // Custom action handlers
    this.on('placeOrder', this.placeOrder);
    this.on('submitReview', this.submitReview);
    
    // Read handlers for calculated elements
    this.on('READ', 'Books', this.calculateAvailable);
    
    // Custom function handlers
    this.on('getAvailableBooks', this.getAvailableBooks);
    this.on('getTopReviewedBooks', this.getTopReviewedBooks);
    
    await super.init();
  }

  /**
   * Create new order with stock validation
   */
  async createOrder(req) {
    const { book_ID, quantity, customer_name, customer_email } = req.data;
    
    try {
      // Validate book exists and check stock
      const book = await cds.run(
        SELECT.one.from(Books).where({ ID: book_ID })
      );
      
      if (!book) {
        return req.error(404, `Book ${book_ID} not found`);
      }
      
      if (book.stock < quantity) {
        return req.error(
          409,
          `Insufficient stock. Available: ${book.stock}, Requested: ${quantity}`
        );
      }
      
      // Create order
      const order = await cds.run(
        INSERT.into(Orders).entries({
          book_ID,
          quantity,
          customer_name,
          customer_email,
          unit_price: book.price,
          total_amount: book.price * quantity
        })
      );
      
      // Update book stock
      await cds.run(
        UPDATE(Books, book_ID).with({ stock: book.stock - quantity })
      );
      
      // Log inventory transaction
      await cds.run(
        INSERT.into(InventoryLog).entries({
          book_ID,
          transaction: 'REMOVE',
          quantity,
          reason: `Order: ${order[0]}`,
          previous_stock: book.stock,
          new_stock: book.stock - quantity
        })
      );
      
      req.notify(201, `Order created successfully. Order ID: ${order[0]}`);
      
    } catch (error) {
      console.error('Order creation error:', error);
      return req.error(500, 'Failed to create order');
    }
  }

  /**
   * Update order status with notifications
   */
  async updateOrder(req) {
    const { ID, status } = req.data;
    
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    
    if (status && !validStatuses.includes(status)) {
      return req.error(400, `Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }
    
    // Log status change
    if (status === 'DELIVERED') {
      // Send delivery notification (implement based on your needs)
      console.log(`Order ${ID} delivered to customer`);
    }
  }

  /**
   * Delete order (cascade to related records if needed)
   */
  async deleteOrder(req) {
    const { ID } = req.data;
    
    // Check if order can be deleted (e.g., not shipped)
    const order = await cds.run(
      SELECT.one.from(Orders, { ID }).columns(o => ({ ...o, book: null }))
    );
    
    if (order.status === 'SHIPPED') {
      return req.error(403, 'Cannot delete shipped orders');
    }
    
    // Restore book stock
    const { book_ID, quantity } = order;
    const book = await cds.run(SELECT.one.from(Books).where({ ID: book_ID }));
    
    await cds.run(
      UPDATE(Books, book_ID).with({ stock: book.stock + quantity })
    );
  }

  /**
   * Create review with validation
   */
  async createReview(req) {
    const { book_ID, rating, comment } = req.data;
    
    if (rating < 1 || rating > 5) {
      return req.error(400, 'Rating must be between 1 and 5');
    }
    
    if (comment && comment.length > 500) {
      return req.error(400, 'Comment cannot exceed 500 characters');
    }
    
    // Check if book exists
    const book = await cds.run(
      SELECT.one.from(Books).where({ ID: book_ID })
    );
    
    if (!book) {
      return req.error(404, 'Book not found');
    }
  }

  /**
   * Custom action: placeOrder
   */
  async placeOrder(req) {
    const { book_ID, quantity, customer_name } = req._
.params;
    
    // Implementation same as createOrder
    try {
      const book = await cds.run(
        SELECT.one.from(Books).where({ ID: book_ID })
      );
      
      if (!book) return { success: false, message: 'Book not found' };
      if (book.stock < quantity) {
        return { 
          success: false, 
          message: `Only ${book.stock} copies available` 
        };
      }
      
      await this.createOrder({
        data: { book_ID, quantity, customer_name }
      });
      
      return { success: true, message: 'Order placed successfully' };
      
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Custom action: submitReview
   */
  async submitReview(req) {
    const { book_ID, rating, comment } = req._.params;
    
    if (rating < 1 || rating > 5) {
      return { success: false, message: 'Invalid rating' };
    }
    
    try {
      await cds.run(
        INSERT.into(Reviews).entries({
          book_ID,
          rating,
          comment,
          customer_name: req.user.id
        })
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Calculate available flag for books
   */
  async calculateAvailable(req) {
    const books = await cds.run(req.query);
    books.forEach(book => {
      book.available = book.stock > 0;
    });
    return books;
  }

  /**
   * Custom function: getAvailableBooks
   */
  async getAvailableBooks(req) {
    return cds.run(
      SELECT.from(Books).where({ stock: { '>': 0 } })
    );
  }

  /**
   * Custom function: getTopReviewedBooks
   */
  async getTopReviewedBooks(req) {
    const { limit = 5 } = req._.params;
    
    return cds.run(
      SELECT.from(Books).columns(b => ({
        ...b,
        reviewCount: { count: '*' },
        avgRating: { avg: Reviews.rating }
      }))
      .where(c => c.stock > 0)
      .orderBy(b => b.avgRating + ' desc')
      .limit(limit)
    );
  }
}

module.exports = BookshopService;
```
*claude code by anubhav trainings*

#### Step 5: Generate Tests

**Create file: test/bookshop-service.test.js**
```javascript
const cds = require('@sap/cds/lib');
const { expect } = require('chai');

describe('Bookshop Service', () => {
  
  let srv, db;
  
  beforeAll(async () => {
    cds.model = cds.compile.from(__dirname + '/../db');
    db = cds.services.db;
    srv = cds.services.BookshopService;
  });
  
  beforeEach(async () => {
    // Reset test data
    await cds.run(DELETE.from('bookstore.app.Books'));
    await cds.run(DELETE.from('bookstore.app.Orders'));
  });

  describe('Order Management', () => {
    
    it('should create order with valid data', async () => {
      // Insert test book
      const book = await cds.run(
        INSERT.into('bookstore.app.Books').entries({
          title: 'Clean Code',
          price: 50,
          stock: 10
        })
      );
      
      // Place order
      const result = await POST('/bookshop/Orders', {
        book_ID: book[0],
        quantity: 2,
        customer_name: 'John Doe'
      });
      
      expect(result.status).to.equal(201);
    });
    
    it('should reject order with insufficient stock', async () => {
      const book = await cds.run(
        INSERT.into('bookstore.app.Books').entries({
          title: 'Expensive Book',
          price: 100,
          stock: 2
        })
      );
      
      const result = await POST('/bookshop/Orders', {
        book_ID: book[0],
        quantity: 5,
        customer_name: 'Jane Doe'
      }).expect(409);
      
      expect(result.body.error.message).to.include('Insufficient stock');
    });
  });
  
  describe('Reviews', () => {
    
    it('should create review with valid rating', async () => {
      const book = await cds.run(
        INSERT.into('bookstore.app.Books').entries({
          title: 'Test Book',
          price: 30,
          stock: 5
        })
      );
      
      const result = await POST('/bookshop/Reviews', {
        book_ID: book[0],
        rating: 4,
        comment: 'Great book!'
      });
      
      expect(result.status).to.equal(201);
    });
    
    it('should reject invalid rating', async () => {
      const result = await POST('/bookshop/Reviews', {
        book_ID: '12345',
        rating: 6,
        comment: 'Invalid'
      }).expect(400);
    });
  });
});
```
*claude code by anubhav trainings*

#### Step 6: Deploy to SAP BTP

**Create file: manifest.yml**
```yaml
---
applications:
  - name: bookstore-app
    path: gen/srv
    memory: 1024M
    disk_quota: 1024M
    random-route: false
    routes:
      - route: bookstore-${space}.cfapps.us10.hana.ondemand.com
    buildpacks:
      - nodejs_buildpack
    env:
      NODE_ENV: production
      DEBUG: ""
    services:
      - bookstore-db
      - bookstore-uaa
```
*claude code by anubhav trainings*

**Deploy command:**
```bash
# Validate and deploy
/deploy-to-btp --manifest manifest.yml --org my-org --space production

# Monitor deployment
/deployment-status
```
*claude code by anubhav trainings*

#### Step 7: Create Fiori UI

**Create file: app/books/manifest.json**
```json
{
  "_version": "1.0.0",
  "sap.app": {
    "id": "bookstore.app.books",
    "type": "application",
    "title": "Books Management",
    "description": "Manage book catalog and orders",
    "dataSources": {
      "mainService": {
        "uri": "/odata/v4/bookshop/",
        "type": "ODataV4"
      }
    }
  },
  "sap.fiori": {
    "registrationIds": [],
    "archeType": "transactional"
  },
  "sap.ui5": {
    "componentUsages": {
      "fioriElements": {
        "name": "sap.fe.templates.ListReportPage",
        "settings": {
          "entitySet": "Books"
        }
      }
    }
  }
}
```
*claude code by anubhav trainings*

---

## Troubleshooting & Best Practices

### Common Issues & Solutions

#### Issue 1: Plugins Not Loading
```bash
# Solution: Reload plugins
/reload-plugins

# Verify installation
/plugin list

# Check logs
/plugin debug
```
*claude code by anubhav trainings*

#### Issue 2: Skills Not Activating
**Problem:** Created skill but Claude doesn't use it.
**Solution:**
```bash
# Verify skill structure
- Check SKILL.md exists in skills/skill-name/
- Verify YAML frontmatter syntax
- Ensure description includes "when_to_use"
- Reload: /reload-plugins
```
*claude code by anubhav trainings*

#### Issue 3: CAP Validation Errors
```bash
# Run validation
/validate-cds

# Check CDS syntax
cds compile db/data-model.cds

# Review error messages for syntax issues
```
*claude code by anubhav trainings*

#### Issue 4: Deployment Failures
```bash
# Check CloudFoundry connection
cf api  # Should show your API endpoint

# Login to BTP
cf login -a <api_endpoint> -o <org> -s <space>

# Check available services
cf services

# View deployment logs
cf logs <app-name>
```
*claude code by anubhav trainings*

### Best Practices

#### 1. **Plugin Development**
```markdown
✅ DO:
- Use clear descriptions in SKILL.md
- Include "when_to_use" sections
- Version your plugin properly
- Document commands thoroughly

❌ DON'T:
- Create plugins for single-use scripts
- Embed API keys in plugin files
- Use overly complex directory structures
```
*claude code by anubhav trainings*

#### 2. **CAP Development**
```cds
✅ DO:
- Define entities in db/data-model.cds
- Use associations for relationships
- Implement handlers in srv/
- Write comprehensive tests
- Use calculated elements for derived data

❌ DON'T:
- Hardcode business logic in handlers
- Skip error validation
- Ignore timezone handling
- Store sensitive data in models
```
*claude code by anubhav trainings*

#### 3. **Team Collaboration**
```json
✅ Store in Git:
- All CDS definitions
- Service implementations
- Plugin configurations
- Test files
- Deployment manifests

❌ Don't commit:
- .env files with credentials
- node_modules/
- gen/ directory
- .DS_Store
```
*claude code by anubhav trainings*

#### 4. **Performance Optimization**
```javascript
// ✅ Use efficient queries
const books = await cds.run(
  SELECT.from(Books).limit(100)
);

// ❌ Avoid N+1 queries
books.forEach(async book => {
  book.reviews = await SELECT.from(Reviews)
    .where({ book_ID: book.ID });
});

// ✅ Use batch operations
const orders = await cds.run(
  INSERT.into(Orders).entries([...])
);

// ❌ Avoid sequential operations
for (const order of orders) {
  await cds.run(INSERT.into(Orders).entries(order));
}
```
*claude code by anubhav trainings*

---

## Quick Reference: Essential Commands

### Setup Commands
```bash
/plugin marketplace add <marketplace_url>
/plugin install <plugin-name>@<marketplace>
/plugin list
/reload-plugins
```
*claude code by anubhav trainings*

### Project Commands
```bash
/init-cap-project <project-name>
/start-dev-server
/test-cap-app
/deploy-to-btp
```
*claude code by anubhav trainings*

### Modeling Commands
```bash
/create-entity <entity-name>
/generate-cds-model
/validate-cds
/generate-types
```
*claude code by anubhav trainings*

### Development Commands
```bash
/generate-handlers <service-name>
/generate-tests <service-name>
/lint-cds
/format-code
```
*claude code by anubhav trainings*

### Deployment Commands
```bash
/deploy-to-btp --org <org> --space <space>
/deployment-status
/rollback-deployment
```
*claude code by anubhav trainings*

---

## Resources

- **Official Documentation:** https://code.claude.com/docs/en/plugins
- **SAP CAP Official:** https://cap.cloud.sap
- **SAP BTP Documentation:** https://help.sap.com/docs/btp
- **SAP Skills Repository:** https://github.com/secondsky/sap-skills
- **Claude Code Reference:** https://docs.claude.com/en/docs/claude-code/overview

---

## Summary

Claude Code plugins transform your development experience by:
1. **Automating** repetitive CAP development tasks
2. **Standardizing** team workflows and best practices
3. **Integrating** with SAP BTP deployment pipelines
4. **Distributing** knowledge across your organization
5. **Accelerating** project initialization and scaffolding

Start with the SAP skills marketplace, customize for your team's needs, and version control your configurations for maximum productivity.

