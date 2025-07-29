## 🧩 UI Elements Summary
• A dropdown to select and filter by Principal organization
• A dashboard showing all interactions involving the selected Principal
• A list of all opportunities featuring the Principal's products
• Performance metrics charts for Principal-owned products
• A timeline view of all Principal-related activities
• A button to log new Principal-specific interactions
• A button to create opportunities for Principal products
• A product management section for Principal-owned products
• Analytics charts showing conversion rates and trends
• A table of distributors carrying Principal products

# Principal Activity Tracking - Account Manager Goal

## Overview
Principal Activity Tracking provides a centralized view of all Principal-related activities and serves as the primary Account Manager goal. This includes managing Principal organizations, their products, and their distributor relationships.

## Principal Dashboard

### Purpose
Centralized view of all Principal-related activities.

### Access Path
Dashboard → Principal Activity Tracking → Select Principal

### Dashboard Components
- **All Interactions** involving the Principal
- **All Opportunities** featuring Principal products
- **Product Performance** metrics for Principal-owned products
- **Activity Timeline** chronological view of all Principal activities

## Principal-Focused Actions

### 1. Log Principal Interaction
- Pre-selects the chosen Principal
- Links to standard Interaction Form
- Automatically associates with Principal activities

### 2. Create Principal Opportunity
- Pre-selects the chosen Principal
- Filters Product dropdown to Principal-owned products only
- Links to standard Opportunity Form

### 3. Manage Principal Products
- View all products owned by the Principal
- Add new products (auto-assigned to Principal)
- Edit existing product details
- Product Form includes Principal ownership validation

### 4. View Principal Analytics
- Interaction frequency and types
- Opportunity conversion rates
- Product performance metrics
- Activity trends over time

## Distributor Activity Tracking

### Distributor Dashboard
**Purpose**: Track distributor relationships and product distribution channels for Principal products

**Access Path**: Dashboard → Principal Activity Tracking → Select Principal → Manage Distributors

### Dashboard Components
- **Products Distributed** - All Principal products carried by this distributor
- **Distribution Relationships** - Primary vs. secondary distributor roles for Principal products
- **Partner Principals** - Principal organizations whose products they distribute

### Distributor Products Display
**When viewing a Distributor organization**, the info section includes a **"Products Distributed"** table with:

**Table Columns:**
- **Principal** - Clickable link to Principal organization page (e.g., "Kaufholds")
- **Product** - Clickable link to Product detail page (e.g., "Garlic Seasoning")
- **Status** - Primary/Secondary distributor badge
- **Since** - Distribution relationship start date

**Navigation Behavior:**
- **Clicking Principal name** → Opens Principal organization page
- **Clicking Product name** → Opens Product detail page with specifications, pricing, and all distributors
- **Status badges** → Color-coded (Primary = Green, Secondary = Blue)

**Business Context:**
- Shows the distributor's complete product catalog for Principal products
- Enables quick navigation to product details or principal relationships
- Supports distributor account management as part of Principal relationship tracking

## Principal Types

### Principal Organizations
- Companies that own products (Kaufholds, Better Balance, etc.)
- Marked with `is_principal = TRUE`
- Focus on product development and brand management
- Track all activities related to their products

### Key Principal Examples
- **Kaufholds** - Garlic, Jalapeno, Dill Pickle seasonings
- **Mrs Ressler's** - Specialty food products
- **Ofk** - Potato pancake, Crepes
- **Wicks** - Various food products
- **Frites Street** - French fry products
- **Better Balance** - Health-focused food products

## Activity Tracking Features

### Principal-Specific Workflows
- **Product-Focused Opportunities** - Filter opportunities by Principal's products
- **Distributor Relationship Management** - Track which distributors carry Principal products
- **Performance Analytics** - Monitor Principal product performance across distributors
- **Interaction History** - Complete timeline of Principal-related activities

### Distributor Relationship Management
- **Primary Distributor Assignment** - Each product has one primary distributor
- **Secondary Distributors** - Products can have multiple secondary distributors

## Integration Points
- Links to [Contact Form](01_Contact_Form.md) for Principal advocacy tracking
- Connects to [Organization Form](02_Organization_Form.md) for Principal and Distributor organizations
- Feeds from [Opportunity Form](03_Opportunity_Form.md) for Principal-focused opportunities
- Receives data from [Interaction Form](04_Interaction_Form.md) for Principal activities
- Manages [Product Management](06_Product_Management.md) for Principal-owned products

## 💾 PostgreSQL Schema
```sql
-- Principal activity analytics view
CREATE VIEW principal_activity_summary AS
SELECT 
    p.id as principal_id,
    p.name as principal_name,
    COUNT(DISTINCT pr.id) as total_products,
    COUNT(DISTINCT o.id) as total_opportunities,
    COUNT(DISTINCT i.id) as total_interactions,
    COUNT(DISTINCT CASE WHEN o.is_won = TRUE THEN o.id END) as won_opportunities,
    COALESCE(ROUND(COUNT(DISTINCT CASE WHEN o.is_won = TRUE THEN o.id END) * 100.0 / NULLIF(COUNT(DISTINCT o.id), 0), 2), 0) as win_rate_percent,
    COUNT(DISTINCT pd.distributor_id) as total_distributors,
    MAX(i.date_time) as last_interaction_date,
    MAX(o.created_at) as last_opportunity_date
FROM organizations p
LEFT JOIN products pr ON p.id = pr.principal_id
LEFT JOIN opportunities o ON pr.id = o.product_id
LEFT JOIN interactions i ON o.id = i.opportunity_id
LEFT JOIN product_distributors pd ON pr.id = pd.product_id
WHERE p.is_principal = TRUE
GROUP BY p.id, p.name;

-- Principal distributor relationships view
CREATE VIEW principal_distributor_relationships AS
SELECT 
    p.id as principal_id,
    p.name as principal_name,
    d.id as distributor_id,
    d.name as distributor_name,
    COUNT(pd.product_id) as products_distributed,
    COUNT(CASE WHEN pd.is_primary = TRUE THEN pd.product_id END) as primary_products,
    COUNT(CASE WHEN pd.is_primary = FALSE THEN pd.product_id END) as secondary_products,
    MIN(pd.created_at) as relationship_start_date
FROM organizations p
JOIN products pr ON p.id = pr.principal_id
JOIN product_distributors pd ON pr.id = pd.product_id
JOIN organizations d ON pd.distributor_id = d.id
WHERE p.is_principal = TRUE AND d.is_distributor = TRUE
GROUP BY p.id, p.name, d.id, d.name;
```