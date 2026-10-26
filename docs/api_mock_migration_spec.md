# Mock API & Data Generation Specification for Hardcode Migration

> **Specification & Data Contract**  
> Documenting newly defined endpoints, database tables, and mock generators to eliminate hardcoded static data across `src/features/`.

---

## 1. Newly Defined Endpoints (`mock/server.cjs`)

All endpoints adhere to the project standard `BaseResponse<T>` envelope (`successEnvelope` / `errorEnvelope`) and standard HTTP status codes.

### 1.1 Fanpage Admin Activity Statistics
* **Route**: `GET /fanpages/:fanpageId/activity-stats`
* **Access**: `ROLE_FANPAGE_ADMIN`
* **Purpose**: Replaces static `MOCK_ACTIVITY_STATS` in `fanpageAdminService.ts`.
* **Response Envelope**:
```json
{
  "data": {
    "periodLabel": "7 ngày gần nhất",
    "eventsCount": 8,
    "interactionsCount": 426,
    "newFollowersCount": 36,
    "responseRatePercent": 92,
    "pendingCommentsCount": 3
  },
  "message": "Success",
  "exceptionCode": null
}
```

### 1.2 Fanpage Upcoming Event Reminder
* **Route**: `GET /fanpages/:fanpageId/upcoming-reminder`
* **Access**: `ROLE_FANPAGE_ADMIN`
* **Purpose**: Replaces static `MOCK_UPCOMING_REMINDER` in `fanpageAdminService.ts`.
* **Logic**: Queries `db.events` for the nearest future event with status `APPROVED`/`PUBLISHED` organized by `fanpageId`, returning formatted dates and registration count.
* **Response Envelope**:
```json
{
  "data": {
    "id": "5",
    "title": "Ngày hội việc làm CNTT 2026",
    "monthText": "TH10",
    "dayText": "12",
    "registrationsCount": 186,
    "dateText": "12/10/2026"
  },
  "message": "Success",
  "exceptionCode": null
}
```

### 1.3 Staff Fanpage Invitations
* **Route**: `GET /fanpages/fanpage-admin/invitations`
* **Access**: `ROLE_FANPAGE_ADMIN`
* **Purpose**: Replaces `INITIAL_INVITATIONS` in `StaffFanpageHub.tsx`.
* **Response Envelope**:
```json
{
  "data": [
    {
      "id": "inv-1",
      "fanpageId": 4,
      "code": "KHTN",
      "name": "Fanpage Khoa Khoa học Tự nhiên",
      "inviter": "Ban Truyền thông CTU",
      "role": "Quản trị viên sự kiện",
      "status": "PENDING",
      "createdAt": "2026-10-20T08:00:00Z"
    },
    {
      "id": "inv-2",
      "fanpageId": 5,
      "code": "CTSV",
      "name": "Fanpage Trung tâm Hỗ trợ Sinh viên",
      "inviter": "Phòng Công tác Sinh viên",
      "role": "Biên tập viên nội dung",
      "status": "PENDING",
      "createdAt": "2026-10-21T09:30:00Z"
    }
  ],
  "message": "Success",
  "exceptionCode": null
}
```

* **Route**: `PATCH /fanpages/fanpage-admin/invitations/:id`
* **Purpose**: Accept or reject invitation.
* **Request Body**: `{ "status": "ACCEPTED" | "REJECTED" }`
* **Response Envelope**: `BaseResponse<{ success: boolean; id: string; status: string }>`

---

## 2. Seed Data to Generate (`mock/generate-data.cjs` & `mock/db.json`)

To support dynamic querying, the following collections and attributes will be generated:

### 2.1 Collection: `fanpage_statistics`
Mock records tied to existing fanpages (`fanpageId: 1, 2, 3`):
```javascript
db.fanpage_statistics = [
  {
    id: 1,
    fanpageId: 1, // Đoàn Trường CNTT & TT
    periodLabel: '7 ngày gần nhất',
    eventsCount: 8,
    interactionsCount: 426,
    newFollowersCount: 36,
    responseRatePercent: 92,
    pendingCommentsCount: 3
  },
  {
    id: 2,
    fanpageId: 2, // Trường Đại học Cần Thơ
    periodLabel: '7 ngày gần nhất',
    eventsCount: 24,
    interactionsCount: 1580,
    newFollowersCount: 120,
    responseRatePercent: 98,
    pendingCommentsCount: 5
  },
  {
    id: 3,
    fanpageId: 3, // CLB Công nghệ phần mềm CTU
    periodLabel: '7 ngày gần nhất',
    eventsCount: 3,
    interactionsCount: 95,
    newFollowersCount: 12,
    responseRatePercent: 88,
    pendingCommentsCount: 1
  }
]
```

### 2.2 Collection: `fanpage_invitations`
Mock records for staff invitations:
```javascript
db.fanpage_invitations = [
  {
    id: 'inv-1',
    userId: 2,
    fanpageId: 4,
    code: 'KHTN',
    name: 'Fanpage Khoa Khoa học Tự nhiên',
    inviter: 'Ban Truyền thông CTU',
    role: 'Quản trị viên sự kiện',
    status: 'PENDING',
    createdAt: '2026-10-20T08:00:00Z'
  },
  {
    id: 'inv-2',
    userId: 2,
    fanpageId: 5,
    code: 'CTSV',
    name: 'Fanpage Trung tâm Hỗ trợ Sinh viên',
    inviter: 'Phòng Công tác Sinh viên',
    role: 'Biên tập viên nội dung',
    status: 'PENDING',
    createdAt: '2026-10-21T09:30:00Z'
  }
]
```

### 2.3 Comprehensive SV5T Criteria Seed in `db.criterias`
Ensure all 28 canonical criteria from `docs/materials/seed_criterias_sv5t.sql` exist in `db.criterias` with valid `parentId`, `requiredChildren`, and `level` (1, 2, 3), allowing `GET /student/criteria-progress` to construct the entire tree dynamically without hardcoded frontend constants.

---

## 3. Migration Mapping Summary

| Hardcoded Static Asset | Proposed API / Endpoint | Target Client Service / Component |
| :--- | :--- | :--- |
| `MOCK_ACTIVITY_STATS` | `GET /fanpages/:fanpageId/activity-stats` | `fanpageAdminService.getActivityStats(fanpageId)` |
| `MOCK_UPCOMING_REMINDER` | `GET /fanpages/:fanpageId/upcoming-reminder` | `fanpageAdminService.getUpcomingReminder(fanpageId)` |
| `MOCK_FEED_POSTS` | `GET /fanpages/:fanpageId/events` | `fanpageAdminService.getFeedPosts(fanpageId)` |
| `MOCK_CURRENT_FANPAGE` / `MOCK_AVAILABLE_FANPAGES` | `GET /fanpages/fanpage-admin/my-fanpages` | `fanpageAdminService.getAvailableFanpages()` |
| `INITIAL_INVITATIONS` | `GET /fanpages/fanpage-admin/invitations` | `StaffFanpageHub.tsx` via `fanpageAdminService` |
| Fallback users `usr-staff-1` / `usr-student-1` | `POST /auth/login`, `POST /auth/verify-otp` | `authService.ts` |
| `CATEGORY_MAX_MAP` & Semester `1` | `GET /point-categories` & `GET /semesters` | `StudentRightSidebar.tsx` via `trainingPointsService` |
| `CANONICAL_SV5T_STANDARDS` (360 lines) | `GET /student/criteria-progress` | `sv5tTreeBuilder.ts` (build from server payload) |
