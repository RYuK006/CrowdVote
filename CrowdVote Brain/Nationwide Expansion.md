# Nationwide Expansion Strategy

## Goal
Transition CrowdVote from a Kerala-specific tool to a full Indian election prediction platform.

## Implementation Details
- **States & UTs**: Full list of 28 states and 8 UTs added to the frontend data.
- **State Selection UI**: A dedicated view for selecting a state before showing constituencies.
- **State Selection Flow**:
  1. User picks a state (e.g., Kerala).
  2. If state is **Kerala**: Show the constituency grid for prediction.
  3. If state is other: Show **Under Development** popup.
- **Restricted Access**: Currently, only Kerala is enabled for active voting to focus accuracy for upcoming elections.

## User Experience Updates
- **Simplified Terminology**:
  - "Node" -> "Area"
  - "Arena" -> "Prediction Center"
  - "Swarm Sync" -> "Confirm Vote"
- **Clear Feedback**: Using simple, bold headings and descriptive icons.

## Connected Notes
- [[Project Overview]]
- [[Architecture]]
- [[Roadmap]]
