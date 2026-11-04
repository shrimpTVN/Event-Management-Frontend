# Registration & Onboarding Flow Specification (TÃ i liá»‡u Quy trÃ¬nh ÄÄƒng kÃ½ & HoÃ n thiá»‡n Há»“ sÆ¡)

> **Má»¥c Ä‘Ã­ch tÃ i liá»‡u:**  
> Äáº·c táº£ chi tiáº¿t cho toÃ n bá»™ Ä‘á»™i ngÅ© phÃ¡t triá»ƒn (**Frontend React** vÃ  **Backend Spring Boot DDD**) vá» quy trÃ¬nh Ä‘Äƒng kÃ½ tÃ i khoáº£n, phÃ¢n nhÃ¡nh nghiá»‡p vá»¥ theo vai trÃ² ngÆ°á»i dÃ¹ng (**Sinh viÃªn** vs **CÃ¡n bá»™ / Quáº£n trá»‹ Fanpage**), luá»“ng hoÃ n thiá»‡n há»“ sÆ¡ sinh viÃªn theo ngá»¯ cáº£nh (Just-In-Time) vÃ  trung tÃ¢m quáº£n lÃ½ fanpage dÃ nh cho cÃ¡n bá»™.

---

## 1. Tá»•ng quan & So sÃ¡nh hai phÃ¢n há»‡ ngÆ°á»i dÃ¹ng

Há»‡ thá»‘ng phÃ¢n tÃ¡ch luá»“ng Ä‘Äƒng kÃ½ dá»±a trÃªn tiá»n tá»‘/háº­u tá»‘ email vÃ  vai trÃ² Ä‘á»‹nh danh:

| TiÃªu chÃ­ | PhÃ¢n há»‡ Sinh viÃªn (`ROLE_STUDENT`) | PhÃ¢n há»‡ CÃ¡n bá»™ (`ROLE_FANPAGE_ADMIN`) |
|:---|:---|:---|
| **Äá»‹nh dáº¡ng Email** | `*@student.ctu.edu.vn` (hoáº·c email cÃ¡ nhÃ¢n) | `*@ctu.edu.vn` (hoáº·c email cÃ¡n bá»™) |
| **Giai Ä‘oáº¡n 1: ÄÄƒng kÃ½** | Nháº­p `email` + `máº­t kháº©u` âž” Nháº­n mÃ£ OTP qua email | Nháº­p `email` + `máº­t kháº©u` âž” Nháº­n mÃ£ OTP qua email |
| **Sau khi xÃ¡c thá»±c OTP** | **VÃ o tháº³ng Trang chá»§ (`/`) ngay láº­p tá»©c** (chÆ°a cáº§n Ä‘iá»n thÃ´ng tin chi tiáº¿t) | **Báº¯t buá»™c Ä‘iá»n thÃ´ng tin Ä‘á»‹nh danh cÃ¡n bá»™ trÆ°á»›c** táº¡i `/onboarding/staff` |
| **Thá»i Ä‘iá»ƒm hoÃ n thiá»‡n há»“ sÆ¡** | **HoÃ£n láº¡i (Deferred / Lazy):** Chá»‰ yÃªu cáº§u khi báº¥m nÃºt "ÄÄƒng kÃ½ ngay" á»Ÿ sá»± kiá»‡n | **Ngay sau khi OTP:** HoÃ n thÃ nh trÆ°á»›c khi vÃ o há»‡ thá»‘ng quáº£n lÃ½ fanpage |
| **Trang chuyá»ƒn tiáº¿p sau há»“ sÆ¡** | Tá»± Ä‘á»™ng quay láº¡i sá»± kiá»‡n Ä‘ang chá»n vÃ  hoÃ n táº¥t Ä‘Äƒng kÃ½ | Chuyá»ƒn Ä‘áº¿n **Hub Fanpage CÃ¡n bá»™ (`/staff/fanpages`)** |
| **Tráº¡ng thÃ¡i tÃ i khoáº£n má»›i** | `isProfileComplete: false`, xem sá»± kiá»‡n bÃ¬nh thÆ°á»ng | ChÆ°a cÃ³ fanpage nÃ o âž” Hiá»ƒn thá»‹ **Empty State** hÆ°á»›ng dáº«n táº¡o fanpage |
| **ÄÄƒng xuáº¥t (Logout)** | NÃºt Ä‘Äƒng xuáº¥t táº¡i Navbar / Menu ngÆ°á»i dÃ¹ng | NÃºt Ä‘Äƒng xuáº¥t trá»±c tiáº¿p trÃªn Hub Fanpage & Menu tÃ i khoáº£n |

---

## 2. SÆ¡ Ä‘á»“ luá»“ng tá»•ng quan (Architecture Flowchart)

```mermaid
flowchart TD
    Start["NgÆ°á»i dÃ¹ng truy cáº­p trang ÄÄƒng kÃ½ (/register)"] --> InputCreds["Nháº­p Email & Máº­t kháº©u"]
    InputCreds --> SendOTP["Backend gá»­i mÃ£ OTP (6 chá»¯ sá»‘) qua email"]
    SendOTP --> VerifyOTP["Nháº­p mÃ£ OTP táº¡i /verify-otp"]
    VerifyOTP --> CheckRole{"PhÃ¢n loáº¡i vai trÃ² ngÆ°á»i dÃ¹ng"}

    %% NhÃ¡nh Sinh viÃªn
    CheckRole -- "Sinh viÃªn (@student.ctu.edu.vn)" --> HomeDirect["VÃ o tháº³ng Trang Chá»§ (/) ngay láº­p tá»©c"]
    HomeDirect --> BrowseEvents["KhÃ¡m phÃ¡ danh sÃ¡ch sá»± kiá»‡n, bÃ i viáº¿t, fanpage"]
    BrowseEvents --> ClickRegister{"Báº¥m 'ÄÄƒng kÃ½ ngay' má»™t sá»± kiá»‡n"}
    ClickRegister -- "Há»“ sÆ¡ sinh viÃªn Ä‘Ã£ hoÃ n thiá»‡n" --> CallRegisterApi["Gá»i POST /api/events/{id}/register âž” ÄÄƒng kÃ½ thÃ nh cÃ´ng"]
    ClickRegister -- "ChÆ°a cÃ³ thÃ´ng tin sinh viÃªn" --> PromptProfile["Hiá»‡n Modal: YÃªu cáº§u bá»• sung thÃ´ng tin sinh viÃªn"]
    PromptProfile --> FillStudentForm["Nháº­p MSSV, Lá»›p, NgÃ nh, KhÃ³a (/onboarding/student)"]
    FillStudentForm --> SaveStudentProfile["Gá»i POST /api/users/me/student-profile"]
    SaveStudentProfile --> ReturnAndRegister["Tá»± Ä‘á»™ng quay láº¡i sá»± kiá»‡n & HoÃ n táº¥t Ä‘Äƒng kÃ½"]

    %% NhÃ¡nh CÃ¡n bá»™
    CheckRole -- "CÃ¡n bá»™ (@ctu.edu.vn)" --> RequireStaffProfile["Báº¯t buá»™c vÃ o trang /onboarding/staff"]
    RequireStaffProfile --> FillStaffForm["Äiá»n: Há» tÃªn, Chá»©c vá»¥, ÄÆ¡n vá»‹/Khoa, SÄT"]
    FillStaffForm --> SaveStaffProfile["Gá»i POST /api/users/me/staff-profile"]
    SaveStaffProfile --> GoStaffHub["Chuyá»ƒn hÆ°á»›ng Ä‘áº¿n Hub Fanpage (/staff/fanpages)"]
    
    GoStaffHub --> QueryMyFanpages{"Kiá»ƒm tra sá»‘ lÆ°á»£ng Fanpage quáº£n lÃ½"}
    QueryMyFanpages -- "ChÆ°a cÃ³ Fanpage nÃ o (0 fanpage)" --> EmptyStateHub["Hiá»ƒn thá»‹ Empty State: 'Hiá»‡n táº¡i báº¡n chÆ°a cÃ³ fanpage nÃ o'"]
    EmptyStateHub --> BtnCreateFP["NÃºt: 'ÄÄƒng kÃ½ táº¡o fanpage ngay' (/register/fanpage)"]
    QueryMyFanpages -- "ÄÃ£ cÃ³ Fanpage (>= 1 fanpage)" --> ListFanpages["Hiá»ƒn thá»‹ danh sÃ¡ch Fanpage quáº£n trá»‹ âž” Chá»n fanpage Ä‘á»ƒ quáº£n lÃ½"]
    
    GoStaffHub --> LogoutOption["NÃºt 'ÄÄƒng xuáº¥t' táº¡i Header & Thanh tÃ i khoáº£n"]
    LogoutOption --> ExecLogout["Gá»i POST /api/auth/logout âž” Chuyá»ƒn vá» /login"]

    style HomeDirect fill:#f0fdf4,stroke:#16a34a
    style RequireStaffProfile fill:#e0f2fe,stroke:#0284c7
    style EmptyStateHub fill:#fffbeb,stroke:#d97706
```

---

## 3. Luá»“ng chi tiáº¿t: Sinh viÃªn (Frictionless Student Flow)

### 3.1. SÆ¡ Ä‘á»“ tuáº§n tá»± (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Student as Sinh viÃªn
    participant FE as Frontend (React)
    participant AuthCtrl as AuthController
    participant EventCtrl as EventController
    participant UserCtrl as UserController
    participant DB as PostgreSQL

    Student->>FE: Nháº­p Email trÆ°á»ng + Máº­t kháº©u
    FE->>AuthCtrl: POST /api/auth/register {email, password}
    AuthCtrl->>DB: INSERT INTO users (role='ROLE_STUDENT', is_active=true)
    AuthCtrl-->>FE: 200 OK + Gá»­i mÃ£ OTP qua mail
    FE->>FE: Chuyá»ƒn sang mÃ n hÃ¬nh /verify-otp

    Student->>FE: Nháº­p 6 chá»¯ sá»‘ OTP
    FE->>AuthCtrl: POST /api/auth/verify-otp {email, otp}
    AuthCtrl->>DB: XÃ¡c thá»±c mÃ£ OTP
    AuthCtrl-->>FE: 200 OK + Cáº¥p Session Cookie (ddd_jwt)
    FE->>FE: LÆ°u AuthState: isProfileComplete=false
    FE->>Student: Äiá»u hÆ°á»›ng tháº³ng vÃ o Trang Chá»§ (/)

    Note over Student,FE: Sinh viÃªn tá»± do lÆ°á»›t xem cÃ¡c sá»± kiá»‡n, khÃ´ng bá»‹ cháº·n

    Student->>FE: Báº¥m nÃºt "ÄÄƒng kÃ½ ngay" táº¡i Sá»± kiá»‡n #25
    FE->>FE: Kiá»ƒm tra user.isProfileComplete == false
    FE->>Student: Má»Ÿ Modal yÃªu cáº§u hoÃ n táº¥t thÃ´ng tin sinh viÃªn
    Student->>FE: Báº¥m "Bá»• sung ngay" âž” Äáº¿n /onboarding/student?redirect=/events/25
    Student->>FE: Nháº­p MSSV, Giá»›i tÃ­nh, Khoa, NgÃ nh há»c, KhÃ³a
    FE->>UserCtrl: POST /api/users/me/student-profile {studentId, majorId, ...}
    UserCtrl->>DB: INSERT INTO student_profiles ...
    UserCtrl-->>FE: 200 OK
    FE->>FE: Cáº­p nháº­t isProfileComplete=true
    FE->>FE: Tá»± Ä‘á»™ng Ä‘iá»u hÆ°á»›ng ngÆ°á»£c láº¡i /events/25
    FE->>EventCtrl: POST /api/events/25/register
    EventCtrl->>DB: INSERT INTO registrations ...
    EventCtrl-->>FE: 200 OK { message: "ÄÄƒng kÃ½ thÃ nh cÃ´ng" }
    FE->>Student: Äá»•i nÃºt sang tráº¡ng thÃ¡i "ÄÃ£ Ä‘Äƒng kÃ½" (MÃ u xanh)
```

---

## 4. Luá»“ng chi tiáº¿t: CÃ¡n bá»™ / Quáº£n trá»‹ Fanpage (Staff Flow)

### 4.1. SÆ¡ Ä‘á»“ tuáº§n tá»± (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Staff as CÃ¡n bá»™ CTU
    participant FE as Frontend (React)
    participant AuthCtrl as AuthController
    participant FanpageCtrl as FanpageController
    participant DB as PostgreSQL

    Staff->>FE: ÄÄƒng kÃ½ Email cÃ¡n bá»™ (*@ctu.edu.vn)
    FE->>AuthCtrl: POST /api/auth/register {email, password}
    AuthCtrl->>DB: INSERT INTO users (role='ROLE_FANPAGE_ADMIN', is_active=true)
    AuthCtrl-->>FE: 200 OK + Gá»­i mÃ£ OTP
    FE->>FE: Chuyá»ƒn sang /verify-otp

    Staff->>FE: Nháº­p mÃ£ OTP
    FE->>AuthCtrl: POST /api/auth/verify-otp {email, otp}
    AuthCtrl-->>FE: 200 OK + Session Cookie
    Note over FE: PhÃ¡t hiá»‡n email/vai trÃ² CÃ¡n bá»™ (Staff)
    FE->>Staff: Báº¯t buá»™c chuyá»ƒn Ä‘áº¿n /onboarding/staff (StaffProfileForm)

    Staff->>FE: Nháº­p Há» tÃªn, ÄÆ¡n vá»‹ cÃ´ng tÃ¡c, Chá»©c vá»¥, SÄT
    FE->>AuthCtrl: POST /api/users/me/staff-profile (hoáº·c /api/auth/staff-profile)
    AuthCtrl->>DB: INSERT INTO fanpage_admin_profiles ...
    AuthCtrl-->>FE: 200 OK { isProfileComplete: true }
    FE->>Staff: Chuyá»ƒn hÆ°á»›ng Ä‘áº¿n Hub Fanpage (/staff/fanpages)

    %% Táº£i Hub Fanpage
    FE->>FanpageCtrl: GET /api/fanpages/fanpage-admin/my-fanpages
    FanpageCtrl->>DB: Láº¥y fanpage liÃªn káº¿t vá»›i userId trong fanpage_members
    DB-->>FanpageCtrl: [] (Má»›i Ä‘Äƒng kÃ½ nÃªn chÆ°a cÃ³ fanpage nÃ o)
    FanpageCtrl-->>FE: 200 OK { data: [] }

    FE->>FanpageCtrl: GET /api/fanpages/fanpage-admin/invitations
    FanpageCtrl->>DB: Láº¥y lá»i má»i cá»§a userId trong fanpage_invitations
    DB-->>FanpageCtrl: []
    FanpageCtrl-->>FE: 200 OK { data: [] }

    FE->>Staff: Hiá»ƒn thá»‹ Empty State ("Hiá»‡n táº¡i báº¡n chÆ°a cÃ³ fanpage nÃ o") + NÃºt "ÄÄƒng kÃ½ táº¡o fanpage ngay"

    alt CÃ¡n bá»™ muá»‘n ÄÄƒng xuáº¥t
        Staff->>FE: Báº¥m nÃºt "ÄÄƒng xuáº¥t" (táº¡i Header hoáº·c Thanh tÃ i khoáº£n)
        FE->>AuthCtrl: POST /api/auth/logout
        AuthCtrl-->>FE: 200 OK (XÃ³a cookie)
        FE->>FE: clearAuth() + queryClient.clear()
        FE->>Staff: Chuyá»ƒn vá» mÃ n hÃ¬nh /login
    else CÃ¡n bá»™ Ä‘Äƒng kÃ½ táº¡o Fanpage má»›i
        Staff->>FE: Báº¥m "ÄÄƒng kÃ½ táº¡o fanpage ngay" âž” VÃ o /register/fanpage
        Staff->>FE: Äiá»n thÃ´ng tin CLB/ÄoÃ n Há»™i
        FE->>FanpageCtrl: POST /api/fanpages/fanpage-admin/register
        FanpageCtrl->>DB: Táº¡o Fanpage + GÃ¡n quyá»n ADMIN cho cÃ¡n bá»™
        FanpageCtrl-->>FE: 200 OK
        FE->>Staff: Fanpage xuáº¥t hiá»‡n trong danh sÃ¡ch quáº£n lÃ½
    end
```

---

## 5. Äáº·c táº£ Giao diá»‡n & Tráº¡ng thÃ¡i Hub Fanpage (`/staff/fanpages`)

### 5.1. Khi tÃ i khoáº£n cÃ¡n bá»™ má»›i Ä‘Äƒng kÃ½ (0 Fanpage)
- **Khu vá»±c Lá»i má»i (`pendingInvitations.length === 0`):** áº¨n hoÃ n toÃ n, khÃ´ng hiá»ƒn thá»‹ tháº» lá»i má»i thá»«a.
- **Khu vá»±c Fanpage (`fanpagesList.length === 0`):** Hiá»ƒn thá»‹ khá»‘i giao diá»‡n Empty State thÃ¢n thiá»‡n:
  - Icon tÃ²a nhÃ  `Building2`.
  - TiÃªu Ä‘á»: **"Hiá»‡n táº¡i báº¡n chÆ°a cÃ³ fanpage nÃ o"**.
  - MÃ´ táº£: *"TÃ i khoáº£n cÃ¡n bá»™ cá»§a báº¡n hiá»‡n chÆ°a tham gia hoáº·c sá»Ÿ há»¯u fanpage nÃ o. Vui lÃ²ng Ä‘Äƒng kÃ½ Ä‘á»ƒ táº¡o fanpage vÃ  báº¯t Ä‘áº§u tá»• chá»©c sá»± kiá»‡n nhÃ©!"*.
  - NÃºt hÃ nh Ä‘á»™ng chÃ­nh: **[+] ÄÄƒng kÃ½ táº¡o fanpage ngay** (dáº«n tá»›i `/register/fanpage`).

### 5.2. TÃ­nh nÄƒng ÄÄƒng xuáº¥t (Logout) trÃªn Hub Fanpage
CÃ¡n bá»™ cÃ³ thá»ƒ chá»§ Ä‘á»™ng Ä‘Äƒng xuáº¥t khá»i há»‡ thá»‘ng ngay táº¡i trang Hub thÃ´ng qua:
1. **NÃºt "ÄÄƒng xuáº¥t" á»Ÿ Card Header:** Náº±m song song vá»›i nÃºt *"ÄÄƒng kÃ½ fanpage má»›i"*, viá»n má»ng, icon `LogOut`, hover hiá»‡u á»©ng Ä‘á» nháº¡t.
2. **Thanh thÃ´ng tin tÃ i khoáº£n (Top bar):** Náº±m trÃªn cÃ¹ng cá»§a trang, hiá»ƒn thá»‹ há» tÃªn, email Ä‘ang Ä‘Äƒng nháº­p kÃ¨m liÃªn káº¿t Ä‘Äƒng xuáº¥t nhanh.
3. **Quy trÃ¬nh xá»­ lÃ½ khi nháº¥n ÄÄƒng xuáº¥t:**
   - Gá»­i yÃªu cáº§u `POST /api/auth/logout` Ä‘á»ƒ backend há»§y phiÃªn lÃ m viá»‡c.
   - XÃ³a toÃ n bá»™ bá»™ nhá»› Ä‘á»‡m TanStack Query (`queryClient.clear()`).
   - XÃ³a sáº¡ch state ngÆ°á»i dÃ¹ng vÃ  token trong bá»™ nhá»› cá»¥c bá»™ (`clearAuth()`).
   - Äiá»u hÆ°á»›ng ngÆ°á»i dÃ¹ng vá» trang Ä‘Äƒng nháº­p `/login`.

---

## 6. Äáº·c táº£ Ká»¹ thuáº­t API (API Contracts)

### 6.1. ÄÄƒng kÃ½ tÃ i khoáº£n nhanh
- **Endpoint:** `POST /api/auth/register`
- **Quyá»n háº¡n:** CÃ´ng khai (`PermitAll`)
- **Request Body:**
  ```json
  {
    "email": "canbo.cntt@ctu.edu.vn",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "data": {
      "success": true,
      "email": "canbo.cntt@ctu.edu.vn"
    },
    "message": "ÄÄƒng kÃ½ tÃ i khoáº£n thÃ nh cÃ´ng. MÃ£ OTP Ä‘Ã£ Ä‘Æ°á»£c gá»­i Ä‘áº¿n email.",
    "exceptionCode": null
  }
  ```

### 6.2. XÃ¡c thá»±c mÃ£ OTP
- **Endpoint:** `POST /api/auth/verify-otp`
- **Request Body:**
  ```json
  {
    "email": "canbo.cntt@ctu.edu.vn",
    "otp": "123456"
  }
  ```
- **Response (200 OK):** Thiáº¿t láº­p `Set-Cookie: ddd_jwt=...; HttpOnly; Path=/` vÃ  tráº£ vá» thÃ´ng tin ngÆ°á»i dÃ¹ng ban Ä‘áº§u.

### 6.3. HoÃ n thiá»‡n há»“ sÆ¡ sinh viÃªn (Chá»‰ gá»i khi sinh viÃªn Ä‘Äƒng kÃ½ sá»± kiá»‡n)
- **Endpoint:** `POST /api/users/me/student-profile` (hoáº·c `POST /api/auth/student-profile`)
- **Quyá»n háº¡n:** `ROLE_STUDENT` (YÃªu cáº§u Ä‘Äƒng nháº­p)
- **Request Body:**
  ```json
  {
    "firstName": "TÃ i Lá»™c",
    "lastName": "ÄoÃ n",
    "studentId": "B2101234",
    "gender": "MALE",
    "kNumber": 49,
    "majorId": 1,
    "associationId": 2
  }
  ```
- **Response (200 OK):** Cáº­p nháº­t `isProfileComplete: true`.

### 6.4. HoÃ n thiá»‡n há»“ sÆ¡ cÃ¡n bá»™ (Gá»i ngay sau khi cÃ¡n bá»™ xÃ¡c thá»±c OTP)
- **Endpoint:** `POST /api/users/me/staff-profile` (hoáº·c `POST /api/auth/staff-profile`)
- **Quyá»n háº¡n:** `ROLE_FANPAGE_ADMIN` (YÃªu cáº§u Ä‘Äƒng nháº­p)
- **Request Body:**
  ```json
  {
    "firstName": "HoÃ ng",
    "lastName": "LÃª VÄƒn",
    "phoneNumber": "02923832663",
    "gender": "MALE",
    "staffCode": "CB04921",
    "position": "PhÃ³ BÃ­ thÆ° ÄoÃ n TrÆ°á»ng",
    "department": "TrÆ°á»ng CNTT & TT"
  }
  ```
- **Response (200 OK):** Cáº­p nháº­t thÃ´ng tin cÃ¡n bá»™, tráº£ vá» `isProfileComplete: true`.

### 6.5. Láº¥y danh sÃ¡ch Fanpage Ä‘ang quáº£n lÃ½
- **Endpoint:** `GET /api/fanpages/fanpage-admin/my-fanpages`
- **Quyá»n háº¡n:** `ROLE_FANPAGE_ADMIN`
- **Xá»­ lÃ½ phÃ­a Backend:**
  - Láº¥y `email` hoáº·c `userId` tá»« token (`SecurityContextHolder`).
  - Truy váº¥n cÃ¡c fanpage mÃ  ngÆ°á»i dÃ¹ng cÃ³ quan há»‡ hoáº¡t Ä‘á»™ng (`isActive = true`) trong báº£ng `fanpage_members`.
  - **Vá»›i tÃ i khoáº£n cÃ¡n bá»™ má»›i:** Tráº£ vá» danh sÃ¡ch rá»—ng `[]` (Tuyá»‡t Ä‘á»‘i khÃ´ng tráº£ vá» toÃ n bá»™ fanpage há»‡ thá»‘ng).
- **Response (200 OK):**
  ```json
  {
    "data": [],
    "message": "Success",
    "exceptionCode": null
  }
  ```

### 6.6. ÄÄƒng xuáº¥t khá»i há»‡ thá»‘ng
- **Endpoint:** `POST /api/auth/logout`
- **Quyá»n háº¡n:** YÃªu cáº§u Ä‘Äƒng nháº­p
- **Response (200 OK):** XoÃ¡ cookie phiÃªn `ddd_jwt`, `ddd_refresh`.

---

## 7. Báº£ng mÃ£ lá»—i quy Æ°á»›c (Exception Codes)

| HTTP Status | Exception Code | TÃ¬nh huá»‘ng phÃ¡t sinh | CÃ¡ch xá»­ lÃ½ phÃ­a Frontend |
|:---|:---|:---|:---|
| **403 / 400** | `STUDENT_PROFILE_REQUIRED` | Sinh viÃªn chÆ°a cÃ³ há»“ sÆ¡ khi gá»­i `POST /api/events/{id}/register` | Má»Ÿ popup yÃªu cáº§u bá»• sung thÃ´ng tin sinh viÃªn |
| **401** | `UNAUTHORIZED` | PhiÃªn lÃ m viá»‡c háº¿t háº¡n hoáº·c chÆ°a Ä‘Äƒng nháº­p | Äiá»u hÆ°á»›ng vá» `/login?redirect=...` |
| **409** | `DUPLICATE_REGISTRATION` | ÄÃ£ Ä‘Äƒng kÃ½ sá»± kiá»‡n nÃ y trÆ°á»›c Ä‘Ã³ | Hiá»ƒn thá»‹ tráº¡ng thÃ¡i "ÄÃ£ Ä‘Äƒng kÃ½" |
| **400** | `EVENT_FULL` | Sá»± kiá»‡n Ä‘Ã£ Ä‘á»§ sá»‘ lÆ°á»£ng Ä‘Äƒng kÃ½ | VÃ´ hiá»‡u hÃ³a nÃºt Ä‘Äƒng kÃ½ |
| **404** | `FANPAGE_NOT_FOUND` | KhÃ´ng tÃ¬m tháº¥y fanpage yÃªu cáº§u | Hiá»ƒn thá»‹ thÃ´ng bÃ¡o khÃ´ng tÃ¬m tháº¥y fanpage |

---

## 8. TÃ³m táº¯t lá»£i Ã­ch Ä‘áº¡t Ä‘Æ°á»£c

1. **Sinh viÃªn:** Tráº£i nghiá»‡m tá»©c thÃ¬, khÃ´ng bá»‹ rÃ o cáº£n form biá»ƒu máº«u dÃ i dÃ²ng lÃ m náº£n lÃ²ng; chá»‰ nháº­p thÃ´ng tin khi cÃ³ nhu cáº§u tham gia nháº­n Ä‘iá»ƒm rÃ¨n luyá»‡n.
2. **CÃ¡n bá»™:** Quáº£n lÃ½ táº­p trung, quy trÃ¬nh cháº·t cháº½ vá»›i form Ä‘á»‹nh danh ban Ä‘áº§u, giao diá»‡n quáº£n lÃ½ fanpage rÃµ rÃ ng, cÃ³ tráº¡ng thÃ¡i khá»Ÿi táº¡o há»— trá»£ táº¡o fanpage má»›i vÃ  chá»©c nÄƒng Ä‘Äƒng xuáº¥t thuáº­n tiá»‡n.
3. **Há»‡ thá»‘ng & Dá»¯ liá»‡u:** Äáº£m báº£o toÃ n váº¹n dá»¯ liá»‡u cho tá»«ng fanpage, tÃ­nh riÃªng tÆ° vÃ  phÃ¢n quyá»n chÃ­nh xÃ¡c giá»¯a cÃ¡c tÃ i khoáº£n cÃ¡n bá»™.
