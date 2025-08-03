## 🧩 UI Elements Summary
• A text field to enter the product name
• A dropdown to select the Principal owner (pre-filled when accessed from Principal dashboard)
• A dropdown to select the primary distributor organization
• A multi-select dropdown to choose additional distributors
• A dropdown to select product category
• A text area for detailed product description
• Text fields for cost and pricing information
• A table showing all distributors carrying the product
• Status indicators for primary vs secondary distributors
• A submit button to save product information

# Product Management - Principal-Distributor Relationships

## Overview
Product Management handles the complex relationships between Principal organizations (product owners), their products, and Distributor organizations (product suppliers). This system ensures proper product ownership and distribution channel management.

## Product Form Structure

### Product Form Fields
- **Product Name*** - Required
- **Principal Owner** - Pre-selected (read-only when accessed via Principal dashboard)
- **Primary Distributor** - Dropdown of distributor organizations (required)
- **Additional Distributors** - Multi-select dropdown of distributor organizations (optional)
- **Category** - Product classification
- **Description** - Detailed product information
- **Pricing** - Cost and pricing information

## Product-Principal-Distributor Relationship Rules

### Core Relationships
- **Each product has exactly one Principal owner**
- **Each product requires a primary distributor** (organization marked as Distributor)
- **Products can have multiple distributors** for broader market reach
- **Only organizations marked as Distributors** appear in distributor dropdowns
- **Products can only be selected in Opportunities** if at least one of the selected Principals owns that product
- **Product dropdown filters dynamically** based on selected Principals

### Business Logic
- **Principal Ownership**: Products are owned by Principal organizations
- **Distribution Channels**: Products are distributed through Distributor organizations
- **Market Reach**: Multiple distributors expand product availability
- **Opportunity Filtering**: Product selection limited to relevant Principal products

## Migration Mapping

### Excel to Database Mapping
- Excel "Products" → `products` table
- Excel columns represent different Principals (Kaufholds, Mrs Ressler's, etc.)
- Product names extracted from rows under each Principal

### Data Quality Rules
- Each product must be assigned to a Principal organization
- Principal organizations marked with `is_principal = TRUE`
- Products can be marked as inactive but not deleted
- Distributor organizations marked with `is_distributor = TRUE`

## Product Categories

### Principal Product Examples
- **Kaufholds Products**: Garlic, Jalapeno, Dill Pickle seasonings
- **Ofk Products**: Potato pancake, Crepes
- **Mrs Ressler's Products**: Specialty food items
- **Wicks Products**: Various food products
- **Frites Street Products**: French fry products
- **Better Balance Products**: Health-focused food items

### Product Classification
- **Seasonings** - Spices and flavor enhancers
- **Frozen** - Frozen food products
- **Specialty** - Unique or niche products
- **Health-Focused** - Nutritional and wellness products
- **Prepared Foods** - Ready-to-serve items

## Distributor Relationships

### Primary Distributors
- **Sysco Corporation** - Major food service distributor
- **US Foods** - National food distribution
- **Performance Food Group** - Regional food distributor
- **Food Services of America** - West Coast distributor
- **Reinhart Foodservice** - Regional distributor

### Distributor Management
- **Primary Distributor** - Main distribution channel for each product
- **Secondary Distributors** - Additional distribution channels

## Product-Distributor Junction Table

### Database Structure
- **Many-to-Many Relationship** between products and distributors
- **Primary Distributor Flag** - Marks the primary distributor for each product
- **Distribution Status** - Active/Inactive distribution relationships

### Junction Table Fields
- `product_id` - References products table
- `distributor_id` - References organizations table (distributors)
- `is_primary` - Boolean flag for primary distributor
- `created_at` - Relationship start date
- `updated_at` - Last modification date
- `created_by` - User who created the relationship

## Product Selection Logic

### Opportunity Integration
- **Principal-Filtered Products** - Only products owned by selected Principals appear
- **Dynamic Filtering** - Product dropdown updates based on Principal selection
- **Validation Rules** - Prevent selection of products not owned by selected Principals
- **Pricing Integration** - Principal/Product combination drives pricing

### Distributor Integration
- **Distribution Channels** - Products available through their distributors
- **Performance Tracking** - Monitor product performance across distributors

## Integration Points
- Created from [Principal Activity Tracking](05_Principal_Activity_Tracking.md) for Principal-owned products
- Links to [Organization Form](02_Organization_Form.md) for Principal and Distributor organizations
- Feeds into [Opportunity Form](03_Opportunity_Form.md) for product selection

