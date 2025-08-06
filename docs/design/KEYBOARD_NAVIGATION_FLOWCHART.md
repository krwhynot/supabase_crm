# KEYBOARD NAVIGATION FLOWCHART
## Multi-Step Organization Form

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORM ENTRY POINT                            │
│                                                                 │
│  TAB → First Input Field (Organization Name)                   │
│  ↓                                                             │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: BASIC INFO                          │
│                                                                 │
│  TAB SEQUENCE:                                                  │
│  1. Organization Name Input                                     │
│  2. Priority Select Dropdown                                   │
│  3. Segment Selector (Complex Component)                       │
│  4. Status Select Dropdown                                     │
│  5. Next Button                                                │
│                                                                 │
│  SPECIAL KEYS:                                                  │
│  • ENTER on Next → Validate & Go to Step 2                    │
│  • ESC → Blur focused element                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│               SEGMENT SELECTOR NAVIGATION                       │
│                 (Complex Dropdown)                             │
│                                                                 │
│  FOCUSED STATE:                                                 │
│  • TAB IN → Input field focused                                │
│  • Type → Filter options, open dropdown                       │
│  • DOWN ARROW → Open dropdown, highlight first option         │
│  • UP ARROW → Highlight previous option                       │
│  • ENTER → Select highlighted option, close dropdown          │
│  • ESC → Close dropdown, blur input                           │
│  • TAB OUT → Close dropdown, move to next field               │
│                                                                 │
│  DROPDOWN NAVIGATION:                                           │
│  • Arrow Keys → Navigate options                              │
│  • HOME → First option                                        │
│  • END → Last option                                          │
│  • Type → Filter and highlight matches                        │
│  • ENTER → Select option                                      │
│  • ESC → Close dropdown                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 2: ORGANIZATION TYPE                   │
│                                                                 │
│  TAB SEQUENCE:                                                  │
│  1. Back Button                                                │
│  2. Principal Checkbox                                         │
│  3. Distributor Checkbox                                       │
│  4. Next Button                                                │
│                                                                 │
│  CHECKBOX NAVIGATION:                                           │
│  • SPACE → Toggle checkbox                                     │
│  • ENTER → Toggle checkbox                                     │
│                                                                 │
│  SPECIAL KEYS:                                                  │
│  • ENTER on Back → Go to Step 1                               │
│  • ENTER on Next → Go to Step 3                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 3: CONTACT DETAILS                     │
│                                                                 │
│  TAB SEQUENCE:                                                  │
│  1. Back Button                                                │
│  2. Address Line 1 Input                                       │
│  3. City Input                                                 │
│  4. State/Province Input                                       │
│  5. Postal Code Input                                          │
│  6. Phone Input                                                │
│  7. Website Input                                              │
│  8. Assigned User Select                                       │
│  9. Description Textarea                                       │
│  10. Create Organization Button                                │
│                                                                 │
│  SPECIAL KEYS:                                                  │
│  • ENTER on Create → Submit form                              │
│  • ENTER on Back → Go to Step 2                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL KEYBOARD HANDLERS                    │
│                                                                 │
│  ALWAYS ACTIVE:                                                 │
│  • ESC → Cancel form (emit cancel event)                      │
│  • F6 → Move between form regions                             │
│  • CTRL+S → Save draft (if supported)                         │
│                                                                 │
│  VALIDATION ERRORS:                                             │
│  • TAB to error → Focus moves to first invalid field          │
│  • Screen reader announces error with aria-live="assertive"   │
│                                                                 │
│  LOADING STATES:                                                │
│  • Form buttons disabled during submission                     │
│  • TAB navigation blocked on disabled elements                │
│  • Loading spinner announced to screen readers                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
                        FOCUS MANAGEMENT RULES
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                    STEP TRANSITIONS                            │
│                                                                 │
│  FORWARD NAVIGATION (Next Button):                             │
│  1. Validate current step                                      │
│  2. If invalid → Focus first error field                      │
│  3. If valid → Move to next step                              │
│  4. Focus first input of new step                             │
│  5. Announce step change to screen reader                     │
│                                                                 │
│  BACKWARD NAVIGATION (Back Button):                            │
│  1. Save current step data                                     │
│  2. Move to previous step                                      │
│  3. Focus first input of previous step                        │
│  4. Announce step change to screen reader                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                              │
│                                                                 │
│  VALIDATION ERRORS:                                             │
│  1. Error appears with role="alert"                           │
│  2. aria-describedby links input to error                     │
│  3. aria-invalid="true" set on input                          │
│  4. First error field receives focus                          │
│  5. Error announced with aria-live="assertive"                │
│                                                                 │
│  ERROR RECOVERY:                                                │
│  1. User corrects input                                        │
│  2. Error clears on blur/validation                           │
│  3. Success state announced if applicable                     │
│  4. aria-invalid="false" restored                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SCREEN READER ANNOUNCEMENTS                 │
│                                                                 │
│  STEP CHANGES:                                                  │
│  "Now on Step 2 of 3: Organization Type. Specify if this is   │
│   a principal or distributor organization."                    │
│                                                                 │
│  VALIDATION ERRORS:                                             │
│  "Error: Organization name is required"                        │
│                                                                 │
│  SUCCESS STATES:                                                │
│  "Draft saved" / "Organization created successfully"           │
│                                                                 │
│  LOADING STATES:                                                │
│  "Saving organization..." / "Validating input..."             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
                        IMPLEMENTATION NOTES
═══════════════════════════════════════════════════════════════════

1. FOCUS TRAP: Each step should maintain focus within its boundaries
2. SKIP LINKS: Add skip navigation for screen reader users
3. LIVE REGIONS: Use aria-live for dynamic content updates
4. FOCUS INDICATORS: Ensure visible focus rings meet 2px minimum
5. TIMEOUT HANDLING: Warn users before auto-save/session timeout
6. PROGRESSIVE ENHANCEMENT: All functionality works without JavaScript

TESTING CHECKLIST:
□ Tab through entire form without mouse
□ Test with screen reader (NVDA, JAWS, VoiceOver)
□ Verify arrow key navigation in dropdowns
□ Confirm error announcement timing
□ Test skip links functionality
□ Validate focus restoration after modals
□ Check keyboard shortcuts work globally
□ Verify loading state announcements
□ Test form submission with Enter key
□ Confirm escape key behavior throughout
```