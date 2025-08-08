# PostgreSQL Database Schema Map - KitchenPantry CRM

**Generated:** $(date)  
**Database:** Supabase PostgreSQL  
**Schema Version:** 12.2.12 (cd3cf9e)

---

## 📊 **Database Overview**

This is a **comprehensive CRM system** designed for managing organizations, contacts, opportunities, products, and interactions in a Principal-Distributor-Customer business model.

---

## 🗂️ **Core Tables**

### **1. Organizations** (`organizations`)
**Purpose:** Central entity for all business relationships

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `name` (VARCHAR(500), NOT NULL) - Organization display name
- `legal_name` (VARCHAR(500)) - Official legal business name
- `type` (ENUM) - B2B, B2C, B2B2C, Non-Profit, Government, Other
- `size` (ENUM) - Startup, Small, Medium, Large, Enterprise
- `status` (ENUM) - Active, Inactive, Prospect, Customer, Partner, Vendor
- `is_principal` (BOOLEAN) - Whether organization is a principal
- `is_distributor` (BOOLEAN) - Whether organization is a distributor
- `lead_score` (INTEGER, 0-100) - Sales prioritization score
- `parent_org_id` (UUID, FK) - Hierarchical organization structure

**Business Logic:**
- Organizations can be Principals (manufacturers), Distributors, or Customers
- Supports hierarchical relationships (parent-child organizations)
- Lead scoring for sales prioritization

### **2. Contacts** (`contacts`)
**Purpose:** Individual contacts within organizations

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `first_name` (VARCHAR(255), NOT NULL) - Contact first name
- `last_name` (VARCHAR(255), NOT NULL) - Contact last name
- `organization_id` (UUID, FK) - Reference to organizations table
- `position` (VARCHAR(255)) - Job title/position
- `email` (VARCHAR(255)) - Contact email
- `phone` (VARCHAR(50)) - Contact phone
- `is_primary` (BOOLEAN) - Whether this is the primary contact
- `account_manager` (VARCHAR(255)) - Assigned account manager

**Relationships:**
- Many contacts can belong to one organization
- Supports primary contact designation

### **3. Opportunities** (`opportunities`)
**Purpose:** Sales opportunities and deals

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `name` (VARCHAR(255), NOT NULL) - Opportunity name
- `organization_id` (UUID, FK) - Reference to customer organization
- `principal_id` (UUID, FK) - Reference to principal organization
- `stage` (ENUM) - Sales pipeline stage
- `estimated_value` (DECIMAL) - Estimated deal value
- `actual_value` (DECIMAL) - Actual closed value
- `probability_percent` (INTEGER) - Win probability
- `expected_close_date` (TIMESTAMPTZ) - Expected close date
- `product_id` (UUID, FK) - Associated product

**Sales Pipeline Stages:**
- New Lead
- Initial Outreach
- Sample/Visit Offered
- Awaiting Response
- Feedback Logged
- Demo Scheduled
- Closed - Won

### **4. Products** (`products`)
**Purpose:** Product catalog and management

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `name` (VARCHAR(255), NOT NULL) - Product name
- `category` (ENUM) - Product category
- `sku` (VARCHAR(255)) - Stock keeping unit
- `description` (TEXT) - Product description
- `unit_cost` (DECIMAL) - Product cost
- `suggested_retail_price` (DECIMAL) - Retail price
- `is_active` (BOOLEAN) - Product availability
- `launch_date` (TIMESTAMPTZ) - Product launch date
- `discontinue_date` (TIMESTAMPTZ) - Product discontinuation

**Product Categories:**
- Protein, Sauce, Seasoning, Beverage, Snack, Frozen, Dairy, Bakery, Other

### **5. Interactions** (`interactions`)
**Purpose:** Track all customer interactions and activities

**Key Fields:**
- `id` (UUID, PK) - Unique identifier
- `opportunity_id` (UUID, FK) - Associated opportunity
- `type` (ENUM) - Interaction type
- `subject` (VARCHAR(255), NOT NULL) - Interaction subject
- `interaction_date` (TIMESTAMPTZ, NOT NULL) - When interaction occurred
- `status` (ENUM) - Interaction status
- `outcome` (ENUM) - Interaction outcome
- `duration_minutes` (INTEGER) - Interaction duration
- `notes` (TEXT) - Interaction notes
- `follow_up_required` (BOOLEAN) - Whether follow-up is needed
- `follow_up_date` (TIMESTAMPTZ) - Scheduled follow-up date

**Interaction Types:**
- Email, Phone, Meeting, Demo, Proposal, Contract, Note, Task, Event, Social, Website, Other

**Interaction Statuses:**
- SCHEDULED, COMPLETED, CANCELLED, NO_SHOW

**Interaction Outcomes:**
- POSITIVE, NEUTRAL, NEGATIVE, NEEDS_FOLLOW_UP

---

## 🔗 **Relationship Tables**

### **6. Contact Principals** (`contact_principals`)
**Purpose:** Many-to-many relationship between contacts and principals

**Key Fields:**
- `contact_id` (UUID, FK) - Reference to contacts
- `principal_id` (UUID, FK) - Reference to principal organizations
- `advocacy_level` (VARCHAR) - Level of advocacy (High, Medium, Low)
- `notes` (TEXT) - Relationship notes

### **7. Opportunity Principals** (`opportunity_principals`)
**Purpose:** Many-to-many relationship between opportunities and principals

**Key Fields:**
- `opportunity_id` (UUID, FK) - Reference to opportunities
- `principal_id` (UUID, FK) - Reference to principal organizations
- `contribution_percent` (DECIMAL) - Principal's contribution percentage
- `is_primary` (BOOLEAN) - Whether this is the primary principal

### **8. Product Principals** (`product_principals`)
**Purpose:** Many-to-many relationship between products and principals

**Key Fields:**
- `product_id` (UUID, FK) - Reference to products
- `principal_id` (UUID, FK) - Reference to principal organizations
- `wholesale_price` (DECIMAL) - Wholesale price for this principal
- `is_primary_principal` (BOOLEAN) - Whether this is the primary principal
- `exclusive_rights` (BOOLEAN) - Whether principal has exclusive rights
- `contract_start_date` (TIMESTAMPTZ) - Contract start date
- `contract_end_date` (TIMESTAMPTZ) - Contract end date
- `territory_restrictions` (JSONB) - Geographic restrictions

### **9. Organization Interactions** (`organization_interactions`)
**Purpose:** Track interactions at the organization level

**Key Fields:**
- `organization_id` (UUID, FK) - Reference to organizations
- `contact_id` (UUID, FK) - Associated contact (optional)
- `type` (ENUM) - Interaction type
- `direction` (ENUM) - Inbound or Outbound
- `subject` (VARCHAR(255)) - Interaction subject
- `interaction_date` (TIMESTAMPTZ) - When interaction occurred
- `duration_minutes` (INTEGER) - Interaction duration

### **10. Organization Documents** (`organization_documents`)
**Purpose:** Document management for organizations

**Key Fields:**
- `organization_id` (UUID, FK) - Reference to organizations
- `name` (VARCHAR(255), NOT NULL) - Document name
- `description` (TEXT) - Document description
- `file_type` (VARCHAR(50)) - Document file type
- `storage_path` (VARCHAR(500)) - File storage location
- `category` (VARCHAR(100)) - Document category
- `is_public` (BOOLEAN) - Whether document is publicly accessible
- `version` (VARCHAR(50)) - Document version

### **11. Organization Analytics** (`organization_analytics`)
**Purpose:** Analytics and performance tracking

**Key Fields:**
- `organization_id` (UUID, FK) - Reference to organizations
- `period_start` (TIMESTAMPTZ) - Analytics period start
- `period_end` (TIMESTAMPTZ) - Analytics period end
- `period_type` (VARCHAR(50)) - Period type (daily, weekly, monthly)
- `total_interactions` (INTEGER) - Total interactions in period
- `email_interactions` (INTEGER) - Email interactions count
- `phone_interactions` (INTEGER) - Phone interactions count
- `meeting_interactions` (INTEGER) - Meeting interactions count
- `revenue_generated` (DECIMAL) - Revenue generated in period
- `deals_closed` (INTEGER) - Number of deals closed
- `deals_in_progress` (INTEGER) - Number of deals in progress

---

## 📈 **Database Views**

### **12. Contact Views**
- **`contact_list_view`** - Simplified contact list with basic info
- **`contact_detail_view`** - Detailed contact information with organization data

### **13. Organization Views**
- **`organizations_with_contact_counts`** - Organizations with contact counts
- **`organization_lead_scoring`** - Lead scoring analytics
- **`principal_activity_summary`** - Principal activity and performance metrics

### **14. Opportunity Views**
- **`opportunity_list_view`** - Comprehensive opportunity list with related data
- **`opportunity_kpi_view`** - Key performance indicators for opportunities

### **15. Analytics Views**
- **`monthly_organization_performance`** - Monthly performance metrics
- **`principal_activity_summary`** - Principal engagement and activity summary

---

## 🔧 **Database Functions**

### **16. Analytics Functions**
- **`get_principal_activity_stats()`** - Get principal activity statistics
- **`refresh_principal_activity_summary()`** - Refresh principal activity data
- **`analyze_interactions_index_performance()`** - Performance analysis

### **17. Security Functions**
- **`can_access_interaction(interaction_uuid)`** - Check interaction access
- **`validate_interaction_security()`** - Validate interaction security
- **`get_user_accessible_interactions()`** - Get user-accessible interactions

### **18. Utility Functions**
- **`get_organization_contact_count(org_id)`** - Get contact count for organization
- **`show_trgm(text)`** - Text similarity functions
- **`set_limit(integer)`** - Set search limits

---

## 🔒 **Security & Access Control**

### **19. Row Level Security (RLS)**
- **Organizations RLS** - Organization access policies
- **Contacts RLS** - Contact access policies  
- **Opportunities RLS** - Opportunity access policies
- **Interactions RLS** - Interaction access policies
- **Documents RLS** - Document access policies

### **20. Data Validation**
- **Email format validation** - Ensures valid email addresses
- **Lead score constraints** - Ensures lead scores are 0-100
- **Name validation** - Prevents empty names
- **Date validation** - Ensures logical date relationships

---

## 📊 **Enums & Data Types**

### **21. Organization Enums**
```sql
organization_type: 'B2B', 'B2C', 'B2B2C', 'Non-Profit', 'Government', 'Other'
organization_size: 'Startup', 'Small', 'Medium', 'Large', 'Enterprise'
organization_status: 'Active', 'Inactive', 'Prospect', 'Customer', 'Partner', 'Vendor'
```

### **22. Interaction Enums**
```sql
interaction_type: 'Email', 'Phone', 'Meeting', 'Demo', 'Proposal', 'Contract', 'Note', 'Task', 'Event', 'Social', 'Website', 'Other'
interaction_status: 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'
interaction_outcome: 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NEEDS_FOLLOW_UP'
interaction_direction: 'Inbound', 'Outbound'
```

### **23. Opportunity Enums**
```sql
opportunity_stage: 'New Lead', 'Initial Outreach', 'Sample/Visit Offered', 'Awaiting Response', 'Feedback Logged', 'Demo Scheduled', 'Closed - Won'
opportunity_context: 'Site Visit', 'Food Show', 'New Product Interest', 'Follow-up', 'Demo Request', 'Sampling', 'Custom'
```

### **24. Product Enums**
```sql
product_category: 'Protein', 'Sauce', 'Seasoning', 'Beverage', 'Snack', 'Frozen', 'Dairy', 'Bakery', 'Other'
```

---

## 🏗️ **Database Architecture**

### **25. Design Patterns**
- **UUID Primary Keys** - For better scalability and security
- **Soft Deletes** - Using `deleted_at` timestamps
- **Audit Trails** - `created_at` and `updated_at` timestamps
- **JSONB Fields** - For flexible custom fields and metadata
- **Materialized Views** - For complex analytics queries
- **Row Level Security** - For data access control

### **26. Performance Optimizations**
- **Indexes** - Comprehensive indexing strategy
- **Partitioning** - For large tables (future consideration)
- **Caching** - Materialized views for analytics
- **Query Optimization** - Optimized views and functions

### **27. Scalability Features**
- **Horizontal Scaling** - UUID-based partitioning ready
- **Vertical Scaling** - Efficient data types and constraints
- **Caching Strategy** - Materialized views for heavy queries
- **Backup Strategy** - Supabase managed backups

---

## 📋 **Migration History**

### **28. Schema Evolution**
1. **Initial Schema** - Basic user submissions
2. **Contacts Schema** - Contact management MVP
3. **Organizations Schema** - Comprehensive organization management
4. **Opportunities Schema** - Sales pipeline management
5. **Products Schema** - Product catalog
6. **Interactions Schema** - Activity tracking
7. **Analytics Schema** - Performance tracking
8. **Security Schema** - Row level security implementation

### **29. Current Status**
- **Active Development** - Schema is actively evolving
- **Production Ready** - Core functionality is stable
- **Security Compliant** - RLS policies implemented
- **Performance Optimized** - Indexes and views in place

---

## 🎯 **Business Logic Summary**

This database supports a **Principal-Distributor-Customer** business model where:

1. **Principals** (manufacturers) create products
2. **Distributors** sell products to customers
3. **Customers** purchase products through distributors
4. **Opportunities** track sales pipeline
5. **Interactions** record all business activities
6. **Analytics** provide performance insights

The schema is designed for **enterprise CRM functionality** with comprehensive tracking, analytics, and security features. 