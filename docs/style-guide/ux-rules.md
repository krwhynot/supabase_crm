# Global UX Rules

**Version:** 1.0  
**Last Updated:** 2025  
**Authority:** System Architecture & UX Strategy

This document establishes mandatory user experience principles and interaction design rules that govern all digital product development. These rules ensure consistent, accessible, and user-centered design across our organization.

---

## Usability

### Navigation Requirements

**Clear Navigation Hierarchy**
- Primary navigation must be visible and consistent across all pages
- Breadcrumb navigation required for multi-level content structures
- Current page location must be clearly indicated
- Navigation labels must be descriptive and unambiguous

**Predictable Interaction Patterns**
- Interactive elements must behave consistently throughout the application
- Link styling must clearly differentiate from regular text
- Button actions must be immediately apparent from visual design
- Form progression must follow logical, expected sequences

**Immediate User Feedback**
- All user actions must provide immediate visual or auditory feedback
- Loading states required for any action taking >200ms
- Success confirmations required for all destructive or significant actions
- Progress indicators mandatory for multi-step processes

### Search and Discovery

**Search Functionality**
- Search must be prominently placed and easily accessible
- Search results must be relevant and well-organized
- "No results" states must provide helpful alternatives or suggestions
- Search filters must be clear and logical

**Content Organization**
- Information architecture must follow user mental models
- Related content must be grouped logically
- Content hierarchy must be visually obvious
- Scanning patterns must be supported through proper layout

---

## Consistency

### Interaction Patterns

**Standard UI Controls**
- Use established interaction patterns consistently throughout the application
- Maintain consistent placement of common elements (navigation, search, user menu)
- Apply uniform styling to similar functional elements
- Preserve familiar behaviors for standard controls (buttons, links, forms)

**Cognitive Load Reduction**
- Minimize the number of different interaction patterns
- Reuse successful design solutions across similar contexts
- Maintain consistent terminology throughout the interface
- Group related functions together visually and functionally

### Visual Consistency

**Design System Adherence**
- All components must use approved design system elements
- Maintain consistent spacing, typography, and color usage
- Apply uniform styling rules across all product areas
- Ensure visual hierarchy follows established patterns

**Brand Consistency**
- Voice and tone must remain consistent across all user touchpoints
- Visual brand elements must be applied uniformly
- Messaging style must align with established brand guidelines
- User communications must follow consistent language patterns

---

## Error Handling

### Error Message Requirements

**Clear and Concise Communication**
- Error messages must be written in plain, user-friendly language
- Avoid technical jargon and system-specific terminology
- Explain what went wrong in terms users can understand
- Use positive, helpful tone rather than blame-oriented language

**Actionable Recovery Options**
- Every error message must include specific next steps
- Provide clear paths to resolve the issue
- Offer alternative solutions when primary action fails
- Include contact information for complex problems requiring assistance

**Error Prevention**
- Implement input validation with real-time feedback
- Use confirmation dialogs for destructive actions
- Provide helpful formatting hints for form inputs
- Guide users toward successful completion rather than catching errors

### Error State Design

**Visibility and Placement**
- Error messages must be prominently displayed near the relevant input
- Use consistent styling for all error states
- Ensure error messages are accessible to screen readers
- Maintain visual hierarchy that emphasizes resolution over blame

**Progressive Disclosure**
- Show immediate, actionable errors first
- Provide additional detail through progressive disclosure
- Avoid overwhelming users with multiple simultaneous error messages
- Group related errors when appropriate

---

## User Focus

### Content Prioritization

**User Goal Alignment**
- Prioritize content and features based on primary user needs
- Surface most important actions prominently
- Minimize secondary and tertiary features in primary workflows
- Ensure critical tasks can be completed without distractions

**Distraction Minimization**
- Remove unnecessary visual elements that don't serve user goals
- Limit promotional content in task-focused interfaces
- Avoid auto-playing media or animations that interrupt focus
- Provide clear visual hierarchy that guides attention appropriately

### Progressive Disclosure

**Information Architecture**
- Present information in digestible chunks
- Use progressive disclosure to reveal additional details
- Maintain scannable layouts that support quick decision-making
- Group related information logically

**Feature Discoverability**
- Make primary features immediately discoverable
- Provide clear entry points for advanced functionality
- Use onboarding to introduce complex features gradually
- Ensure feature visibility matches importance and usage frequency

---

## Accessibility

### Inclusive Design Requirements

**Universal Accessibility**
- Design interfaces that work for users of all abilities
- Consider diverse user contexts, devices, and interaction methods
- Ensure content is perceivable, operable, understandable, and robust
- Test with assistive technologies throughout development process

**Multi-Modal Information**
- Never use color as the sole means of conveying information
- Provide text alternatives for visual content
- Include multiple ways to access the same information
- Support various input methods (mouse, keyboard, touch, voice)

### Accessibility Standards

**WCAG 2.1 AA Compliance**
- Maintain minimum contrast ratios for all text and interactive elements
- Ensure all functionality is keyboard accessible
- Provide appropriate focus management and visual indicators
- Include proper semantic markup and ARIA attributes

**Assistive Technology Support**
- Test interfaces with screen readers, voice control, and switch navigation
- Provide meaningful alt text for images and graphics
- Ensure form labels are properly associated with inputs
- Implement logical reading order for content

---

## Performance

### Perceived Performance

**Responsive Feel**
- Interface must feel fast and responsive to user interactions
- Provide immediate feedback for all user actions
- Use skeleton screens and progressive loading for better perceived performance
- Prioritize above-the-fold content loading

**Loading States**
- Show loading indicators for any process taking longer than 200ms
- Provide progress indicators for lengthy operations
- Use optimistic UI updates where appropriate
- Implement proper error recovery for failed operations

### Performance Standards

**Speed Requirements**
- Page load time must not exceed 3 seconds on standard connections
- Interactive elements must respond within 100ms
- Search results must appear within 1 second
- Form submissions must provide feedback within 500ms

**Efficiency Guidelines**
- Minimize the number of steps required to complete tasks
- Reduce cognitive load through efficient information presentation
- Streamline workflows by removing unnecessary steps
- Optimize for common user pathways

---

## Testing

### Usability Testing Requirements

**Regular Testing Schedule**
- Conduct usability testing for all major feature releases
- Test with representative users from target audience
- Include accessibility testing with users who have disabilities
- Perform competitive analysis to identify improvement opportunities

**Testing Methods**
- Use both moderated and unmoderated testing approaches
- Conduct A/B testing for significant interface changes
- Implement analytics tracking for quantitative behavioral insights
- Perform guerrilla testing for quick validation of design decisions

### Iteration and Improvement

**Data-Driven Design Decisions**
- Base design decisions on qualitative and quantitative user feedback
- Track key performance indicators related to user experience
- Monitor user satisfaction metrics continuously
- Implement feedback collection mechanisms throughout the interface

**Continuous Improvement Process**
- Establish regular review cycles for interface effectiveness
- Create feedback loops between user research and design implementation
- Document lessons learned for future reference
- Maintain design system updates based on testing insights

### Testing Coverage

**Comprehensive Testing Scope**
- Test across all supported devices and browsers
- Validate accessibility with assistive technologies
- Verify performance across various network conditions
- Test internationalization and localization implementations

**User Journey Testing**
- Test complete user workflows from start to finish
- Validate error scenarios and edge cases
- Ensure smooth transitions between different interface states
- Test integration points between different system components

---

## Fundamental UX Psychology Laws

### Cognitive Psychology Principles

These core psychological principles must guide all user experience design decisions to ensure interfaces work with natural human behavior patterns.

**Jakob's Law** - Users spend most of their time on other sites, so they prefer familiar patterns
- Follow established conventions for navigation placement (left sidebar, top horizontal)
- Use standard interaction patterns users expect from similar applications
- Maintain consistency with platform-specific design guidelines (iOS, Android, Web)

**Hick's Law** - The time to make a decision increases with the number of choices
- Limit primary navigation to 5-7 items to reduce decision paralysis
- Group related options under logical categories
- Use progressive disclosure to present choices gradually

**Fitts's Law** - The time to acquire a target is a function of distance and size
- Place frequently used actions closer to where users naturally look or interact
- Make important buttons larger and easier to target
- Consider thumb zones on mobile devices for optimal button placement

**Miller's Law** - The average person can keep 7±2 objects in working memory
- Limit dashboard elements to 5-7 key metrics or widgets
- Break long forms into logical chunks or steps
- Group related information to reduce cognitive load

**Aesthetic-Usability Effect** - Users perceive attractive products as more usable
- Invest in visual design quality as it directly impacts perceived usability
- Use consistent branding and high-quality imagery
- Maintain clean, uncluttered layouts that feel professional

### Behavioral Design Laws

**Law of Proximity** - Objects that are near each other are perceived as grouped
- Group related form fields, controls, and information visually
- Use consistent spacing to show relationships between elements
- Keep actions close to the content they affect

**Progressive Disclosure** - Only present what the user needs when they need it
- Show primary options first, reveal advanced features on demand
- Use expandable sections, tabs, or modal dialogs for secondary information
- Implement step-by-step workflows for complex processes

**Doherty Threshold** - Productivity soars when computer and user interact <400ms
- Show immediate feedback for all user interactions within 200ms
- Use loading indicators and skeleton screens for longer operations
- Implement optimistic UI updates where possible

**Law of Similarity** - Elements that look similar are perceived as functioning similarly
- Use consistent visual styling for similar functional elements
- Apply uniform button styles, form controls, and interaction patterns
- Maintain consistent iconography and visual hierarchy

**Zeigarnik Effect** - People remember uncompleted tasks better than completed ones
- Show progress indicators for multi-step processes
- Highlight incomplete sections or required actions
- Use visual cues to remind users of pending tasks

### Psychological Influence Principles

**Goal-Gradient Effect** - Tendency to accelerate behavior as one approaches a goal
- Display progress toward completion to motivate task completion
- Show users how close they are to achieving objectives
- Use progress bars, completion percentages, and milestone indicators

**Von Restorff Effect** - Distinctive items are more memorable than common ones
- Highlight important actions, alerts, or special content with distinct styling
- Use color, size, or positioning to make critical elements stand out
- Apply contrast thoughtfully to guide user attention

**Peak-End Rule** - People judge experiences by their peak and final moments
- Ensure completion screens, confirmations, and endings are positive
- Make success states delightful and reassuring
- End user journeys with clear value and positive reinforcement

**Serial Position Effect** - Items at beginning and end of lists are remembered best
- Place most important navigation items first and last in menus
- Position critical information at the start or end of content sections
- Structure forms with essential fields at the beginning

### Decision-Making Psychology

**Anchoring Bias** - Heavy reliance on first piece of information encountered
- Present context and reference points to guide user expectations
- Show premium options first to establish value perception
- Use appropriate defaults that serve as starting points for decisions

**Framing Effect** - Drawing different conclusions from same information based on presentation
- Frame benefits positively ("90% uptime" vs "10% downtime")
- Present options in ways that highlight desired actions
- Use action-oriented language that emphasizes positive outcomes

**Loss Aversion** - People prefer avoiding losses over acquiring equivalent gains
- Highlight what users might lose if they don't take action
- Use time-limited offers or availability indicators appropriately
- Show potential consequences of not completing important tasks

**Social Proof** - People look to behavior of others to guide their own actions
- Display usage statistics, reviews, or popularity indicators when relevant
- Show what other users have chosen or recommended
- Use testimonials and case studies to build confidence

### Memory and Attention Laws

**Tesler's Law** - For any system, there is a certain amount of complexity that cannot be reduced
- Move complexity to the system rather than burdening the user
- Provide smart defaults and auto-fill capabilities
- Simplify user-facing processes while handling complexity behind the scenes

**Consistency Principle** - Users learn one interaction and expect it to work similarly elsewhere  
- Maintain identical patterns for similar functions across the entire interface
- Use consistent terminology, visual design, and interaction methods
- Follow established platform conventions and industry standards

**Feedback Principle** - Users need to know the result of their actions
- Provide immediate confirmation for all user interactions
- Show system status and loading states clearly
- Use appropriate success, error, and warning messages

**Forgiveness Principle** - Good design helps users recover from mistakes
- Provide clear "undo" options for reversible actions
- Use confirmation dialogs for destructive operations
- Allow easy correction of errors without losing progress

### Application in UX Design

**Implementation Requirements**
- Apply these psychological principles consistently across all user interfaces
- Test design decisions against user behavior and natural interaction patterns
- Document which psychological principles guide specific design choices
- Regularly validate implementations through user testing and behavioral analysis

**Design Decision Framework**
- Consider multiple psychological principles when designing each interface element
- Balance competing principles (e.g., simplicity vs. feature completeness)
- Prioritize principles based on user context and primary use cases
- Use A/B testing to validate psychological assumptions with real user behavior

**Continuous Learning**
- Monitor user behavior analytics to understand how psychological principles affect actual usage
- Update design patterns based on observed user behavior and preferences  
- Stay current with UX psychology research and emerging behavioral insights
- Share learnings across design and development teams

---

## Implementation Standards

### Design Review Process

**Quality Assurance**
- All designs must be reviewed against these UX rules before implementation
- Conduct accessibility audits during design phase
- Validate user research findings against design decisions
- Ensure alignment with established user personas and scenarios

### Documentation Requirements

**Design Documentation**
- Document design rationale for major interface decisions
- Maintain user journey maps and interaction specifications
- Keep accessibility annotations for development handoff
- Update design system components based on new patterns

### Compliance Monitoring

**Ongoing Assessment**
- Regularly audit implemented interfaces against these UX rules
- Monitor user feedback and satisfaction metrics
- Conduct periodic accessibility compliance reviews
- Track performance metrics and user experience KPIs

---

**Authority:** These UX rules are mandatory for all product development. Exceptions require explicit approval from the System Architecture and UX Strategy teams and must include documented rationale and user research support.