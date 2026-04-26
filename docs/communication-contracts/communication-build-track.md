# Metis Communication Build Track

This document defines the four communication lanes and the order Metis should build them.

## Communication lanes

### 1. Extension UI ↔ Extension scanner

Used for:

- current page scan
- score updates
- issue list
- opening panel

This stays inside the extension.

### 2. Extension ↔ Website

Used for:

- sign-in start
- auth return
- upgrade prompts
- open dashboard and reports

This is the bridge layer.

### 3. Extension ↔ Backend API

Used for:

- analytics events
- summarized scan uploads
- premium requests
- account-linked features later

This is the data layer.

### 4. Website ↔ Backend

Used for:

- auth
- onboarding
- user account
- billing later
- saved reports later

This is normal app communication.

## Required build order

Build these in order. Do not skip ahead.

### Step 1: extension internal messaging first

Do first:

- content script gathers scan info
- popup and side panel request current scan state
- background coordinates current-tab actions
- UI renders the current result without backend dependence

Expected result:

- local scan communication works
- the panel can request and render a current score
- the extension feels useful without auth or backend

### Step 2: communication contract lock

Do after step 1:

- lock message names
- lock storage keys
- lock upload and access-state expectations
- keep all communication lanes in this folder instead of scattered notes

Expected result:

- later communication work uses one stable contract family
- auth, uploads, and access-state changes stop drifting

### Step 3: auth bridge

Do after step 2:

- extension opens website auth
- website returns authenticated state
- extension stores session locally

Expected result:

- extension can launch sign-in cleanly
- website can hand authenticated state back
- extension knows the user is connected without owning auth itself

### Step 4: API communication

Do after step 3:

- add analytics endpoint
- add summary upload endpoint
- add local queue and retry

Expected result:

- extension can send purposeful analytics events
- extension can send one summarized scan payload
- failed uploads do not disappear silently

### Step 5: gated features

Do after step 4:

- add free vs Plus state
- add premium request flow
- keep future saved reports behind the same contract model

Expected result:

- UI can derive gated behavior from validated access state
- premium actions stop depending on hardcoded UI guesses

## V1 milestone stack

### Milestone A

Work:

- local scan communication works

Expected result:

- Metis can scan locally and render results without the server

### Milestone B

Work:

- extension opens website auth

Expected result:

- user can move from extension to website auth cleanly

### Milestone C

Work:

- website returns authenticated state

Expected result:

- extension stores a connected session locally

### Milestone D

Work:

- extension uploads analytics and one summarized scan payload
- failed uploads queue locally

Expected result:

- backend communication is useful, event-based, and resilient

### Milestone E

Work:

- feature gating based on account state

Expected result:

- signed-out, free, and Plus behavior are derived from validated access state

## Locked communication principles

1. local first
2. web owns auth
3. backend receives summaries, not surveillance
4. communication is event-based, not constant streaming
5. every payload should answer: why does Metis need this?

## Build Status

Status at `0.14.9`:

- [x] Step 1: extension internal messaging first
- [x] Step 2: communication contract lock
- [x] Step 3: auth bridge
- [x] Step 4: API communication primitives
- [x] Step 5: validated free vs Plus access-state gating

Current stage:

- `Step 5 / Milestone E`
- result: the communication stack is built and in hardening/verification, not blocked on initial implementation

Current caveats:

- upload retry is activity-driven instead of scheduled
- backend and website lanes are contract-wired but still need live end-to-end verification
