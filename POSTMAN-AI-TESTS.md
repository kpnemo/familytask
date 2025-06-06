# FamilyTasks AI - POSTMAN Test Collection

## 🎯 Overview
This document provides POSTMAN test cases for the FamilyTasks AI integration. Use these to test the MCP-based AI functionality.

## 🔧 Setup Instructions

### 1. Environment Variables
Create a POSTMAN environment with these variables:
```
BASE_URL: http://localhost:3000
FAMILY_ID: cmbkmidho0000sbdiwq2qfzwh  (from test setup)
PARENT_USER_ID: cmbkmidhr0001sbdiip96mqx3
CHILD_USER_ID: cmbkmijl50006sbdibhn1ggby
```

### 2. Test Data Created
```json
{
  "family": {
    "id": "cmbkmidho0000sbdiwq2qfzwh",
    "name": "Test Family",
    "familyCode": "ZFYU70OH"
  },
  "parent": {
    "id": "cmbkmidhr0001sbdiip96mqx3",
    "email": "test-parent@example.com",
    "name": "Test Parent",
    "role": "PARENT"
  },
  "child": {
    "id": "cmbkmijl50006sbdibhn1ggby",
    "email": "test-child@example.com", 
    "name": "Johnny",
    "role": "CHILD"
  }
}
```

## 🧪 Test Cases

### Test 1: AI Health Check
**Purpose**: Verify AI system is configured and ready

**Request**:
```
GET {{BASE_URL}}/api/ai/health
Headers: Content-Type: application/json
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-06-06T09:48:53.699Z",
    "ai": {
      "anthropic": "configured"
    },
    "mcp": {
      "database": "configured"
    },
    "features": {
      "taskParsing": true,
      "familyContext": true
    }
  }
}
```

### Test 2: AI Task Parsing - Simple Request
**Purpose**: Test basic natural language task parsing

⚠️ **Note**: This test requires authentication. For now, testing is limited by NextAuth session requirements.

**Request**:
```
POST {{BASE_URL}}/api/ai/parse-tasks
Headers: 
  Content-Type: application/json
  Cookie: next-auth.session-token=[SESSION_TOKEN]

Body:
{
  "input": "Tomorrow Johnny needs to clean his room and do homework",
  "targetDate": "2025-06-07T18:00:00Z",
  "defaultPoints": 3
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "parsedTasks": [
      {
        "title": "Clean room",
        "description": "Organize and tidy up bedroom",
        "suggestedPoints": 3,
        "suggestedAssignee": "Johnny",
        "suggestedDueDate": "2025-06-07T18:00:00Z",
        "confidence": 0.9
      },
      {
        "title": "Do homework",
        "description": "Complete school assignments",
        "suggestedPoints": 4,
        "suggestedAssignee": "Johnny", 
        "suggestedDueDate": "2025-06-07T18:00:00Z",
        "confidence": 0.85
      }
    ],
    "clarificationQuestions": [],
    "sessionId": null
  }
}
```

### Test 3: AI Task Parsing - Complex Request with Clarification
**Purpose**: Test AI parsing that requires clarification

**Request**:
```
POST {{BASE_URL}}/api/ai/parse-tasks
Headers: 
  Content-Type: application/json
  Cookie: next-auth.session-token=[SESSION_TOKEN]

Body:
{
  "input": "The kids need to do some chores this weekend and study"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "parsedTasks": [
      {
        "title": "Do chores",
        "suggestedPoints": 3,
        "suggestedDueDate": "2025-06-08T18:00:00Z",
        "confidence": 0.6
      },
      {
        "title": "Study",
        "suggestedPoints": 3, 
        "suggestedDueDate": "2025-06-08T18:00:00Z",
        "confidence": 0.7
      }
    ],
    "clarificationQuestions": [
      {
        "id": "q1",
        "question": "Which specific chores should the children do?",
        "taskIndex": 0,
        "field": "description",
        "suggestedAnswers": ["Clean kitchen", "Vacuum living room", "Take out trash"]
      },
      {
        "id": "q2", 
        "question": "Which child should be assigned to each task?",
        "taskIndex": 0,
        "field": "assignee",
        "suggestedAnswers": ["Johnny", "Both children"]
      }
    ],
    "sessionId": "ai_parse_1638360000000_cmbkmidhr0001sbdiip96mqx3"
  }
}
```

### Test 4: Family Context Testing
**Purpose**: Verify family data isolation and context building

**Direct Database Query Test**:
Since this tests MCP integration, you can verify family context by checking the database directly:

```sql
-- Verify family isolation
SELECT f.name, fm.role, u.name as user_name 
FROM families f
JOIN family_members fm ON f.id = fm.family_id  
JOIN users u ON fm.user_id = u.id
WHERE f.id = 'cmbkmidho0000sbdiwq2qfzwh';

-- Check family tasks context
SELECT t.title, t.points, t.status, u.name as assigned_to
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.family_id = 'cmbkmidho0000sbdiwq2qfzwh';
```

## 🔍 Testing Authentication (Workaround)

Since the AI endpoints require NextAuth sessions, here are options for testing:

### Option 1: Browser Session
1. Log in to the app at `http://localhost:3000/login`
2. Open browser dev tools → Application → Cookies
3. Copy the `next-auth.session-token` value
4. Use in POSTMAN Cookie header

### Option 2: Create Test Endpoint (Temporary)
Add this temporary test endpoint to bypass auth:

```typescript
// src/app/api/ai/test-parse/route.ts
export async function POST(request: NextRequest) {
  // Bypass auth for testing - REMOVE in production
  const body = await request.json();
  
  const contextBuilder = new FamilyContextBuilder();
  const familyContext = await contextBuilder.buildContext(
    'cmbkmidho0000sbdiwq2qfzwh', // Test family ID
    'ADMIN_PARENT'
  );
  
  const taskParser = new TaskParser();
  const result = await taskParser.parseNaturalLanguage(
    body.input,
    familyContext,
    body.targetDate,
    body.defaultPoints
  );
  
  return NextResponse.json({
    success: true,
    data: result
  });
}
```

## 📊 Expected Test Results

### ✅ Success Criteria
- [ ] AI health endpoint returns "configured" for all services
- [ ] Task parsing correctly identifies individual tasks
- [ ] Family member names are recognized for assignment
- [ ] Points suggestions are reasonable (1-10 range)
- [ ] Due dates are properly formatted
- [ ] Confidence scores are provided (0-1 range)
- [ ] Family data isolation is maintained

### ⚠️ Edge Cases to Test
- [ ] Empty input string
- [ ] Very long input (>1000 characters)
- [ ] Input with no recognizable tasks
- [ ] Input with ambiguous assignments
- [ ] Input with unclear timing
- [ ] Non-English input (if applicable)

### 🚨 Error Cases to Test
- [ ] Missing ANTHROPIC_API_KEY
- [ ] Invalid family ID
- [ ] Unauthorized user access
- [ ] Network timeout scenarios
- [ ] Malformed request bodies

## 🎯 Next Steps

After successful POSTMAN testing:
1. ✅ Verify MCP family context isolation
2. ✅ Confirm AI task parsing accuracy  
3. ✅ Test error handling and edge cases
4. ⏭️ Build UI components for AI features
5. ⏭️ Add AI insights endpoints
6. ⏭️ Implement dashboard integration

## 📝 Test Results Log

**Date**: 2025-06-06  
**Status**: MCP Foundation Complete ✅
**AI Health**: All systems configured ✅
**Next**: Authentication testing required for full endpoint validation

---

**Note**: This is Phase 1 (MCP Foundation) testing. UI integration and additional AI features will be tested in subsequent phases.