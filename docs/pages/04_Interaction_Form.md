## 🧩 UI Elements Summary
• A dropdown to select interaction type (Email, Call, In-Person, Demo, etc.)
• A date and time picker for when the interaction occurred
• A text field to enter a brief subject description
• A dropdown to link to an existing opportunity
• A number field to enter duration in minutes
• A text field for location description
• A text area for detailed notes
• A checkbox to mark if follow-up is required
• A date picker for follow-up date
• A camera button to attach photos (mobile)
• A submit button to save the interaction

# Interaction Form - Communication Tracking

## Overview
The Interaction Form logs touchpoints that move deals forward and support opportunity advancement. Interactions are created **after** Opportunities exist to track progression and document activities that advance specific opportunities.

## Purpose
Log touchpoints that move deals forward and support opportunity advancement.

## Structural Model
- **Interaction** logs touchpoints that support or advance existing opportunities
- **Timing**: Created after Opportunity exists to track progression
- **Relationship**: Each interaction can be linked to specific opportunities to show deal advancement

## Form Structure

### Required Fields
- **Type*** - Email, Call, In-Person, Demo/sampled, Quoted price, Follow-up (dropdown)
- **Date/Time*** - When interaction occurred
- **Subject*** - Brief description
- **Opportunity*** - Link to existing opportunity (dropdown) - shows opportunities for this organization

### Auto-Captured Fields (Mobile)
- GPS coordinates (for visit verification)
- Timestamp
- User ID

### Optional Fields
- Duration (minutes)
- Location description
- Detailed notes
- Follow-up required checkbox
- Follow-up date
- Photo attachments (mobile)

## Mobile Optimization

### Mobile-Specific Features
- **Quick templates for common interactions**
- **Offline capability with sync**
- **Large touch targets (48px minimum)**
- **Voice-to-text for notes**
- **GPS auto-capture for visit verification**

### Quick Interaction Log
**Designed for field reps visiting restaurants**

**Simplified Required Fields:**
- Organization (dropdown with type-ahead)
- Interaction type (simplified options)
- Quick notes (voice input supported)

**Auto-Captured:**
- GPS location and timestamp
- Weather conditions
- Visit duration

**Offline Support:**
- Forms work without internet
- Data syncs when connection restored
- Conflict resolution for simultaneous edits

## Migration Mapping

### Excel to Database Mapping
- Excel "Interactions" → `interactions` table
- Excel "PRIORITY (Formula)" → `priority_formula`
- Excel "NOTES" → `notes`

### Data Quality Rules
- Interaction types mapped to: email, call, in_person, demo, quoted, follow_up
- Date/time stamps required for all interactions
- GPS coordinates optional but recommended for mobile field visits

## Interaction Types

### Communication Types
- **Email** - Email communications with contacts
- **Call** - Phone conversations
- **In-Person** - Face-to-face meetings
- **Demo/Sampled** - Product demonstrations or sampling
- **Quoted Price** - Pricing discussions
- **Follow-up** - Follow-up communications

### GPS Tracking
- **Visit Verification** - GPS coordinates confirm field representative visits
- **Accuracy Tracking** - GPS accuracy in meters for visit verification
- **Location Description** - Text description of visit location

## Business Rules
- Each interaction can be linked to specific opportunities
- GPS coordinates are optional but recommended for mobile field visits
- Follow-up interactions can be scheduled automatically
- Interaction history provides complete touchpoint timeline

## Mobile Field Entry

### Field Representative Workflow
1. **Select Organization** - Quick dropdown search
2. **Choose Interaction Type** - Simplified options for mobile
3. **Auto-Capture Location** - GPS coordinates and timestamp
4. **Voice Notes** - Quick voice-to-text input
5. **Link to Opportunity** - Connect to existing opportunity
6. **Offline Sync** - Data saves locally and syncs when online

### Performance Optimization
- **Quick Entry** - Minimal required fields for speed
- **Auto-Complete** - Predictive text based on history
- **Batch Sync** - Multiple interactions sync together
- **Conflict Resolution** - Handle simultaneous edits gracefully

## Integration Points
- Created after [Opportunity Form](03_Opportunity_Form.md) opportunities are established
- Links to [Contact Form](01_Contact_Form.md) contacts for relationship tracking
- Connects to [Organization Form](02_Organization_Form.md) for organizational context
- Feeds into [Principal Activity Tracking](05_Principal_Activity_Tracking.md) for activity analysis
- Supports [Mobile Optimization](08_Mobile_Optimization.md) workflows

## 💾 PostgreSQL Schema
```sql
-- Interactions table - Communication tracking
CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Email', 'Call', 'In-Person', 'Demo', 'Quoted', 'Follow-up')),
    date_time TIMESTAMP NOT NULL,
    subject VARCHAR(255) NOT NULL,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    contact_id INTEGER REFERENCES contacts(id),
    opportunity_id INTEGER REFERENCES opportunities(id),
    duration_minutes INTEGER,
    location_description VARCHAR(255),
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    gps_accuracy_meters DECIMAL(8,2),
    weather_conditions VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Interaction photos table
CREATE TABLE interaction_photos (
    id SERIAL PRIMARY KEY,
    interaction_id INTEGER NOT NULL REFERENCES interactions(id),
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_interactions_organization_id ON interactions(organization_id);
CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX idx_interactions_opportunity_id ON interactions(opportunity_id);
CREATE INDEX idx_interactions_date_time ON interactions(date_time);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_follow_up ON interactions(follow_up_required, follow_up_date);
```