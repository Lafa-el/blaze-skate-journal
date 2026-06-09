技术路线建议沿用你现有体系：React + Vite + Firebase/Firestore + PWA。React 适合组件化页面，Vite 适合快速前端项目，Firebase 适合快速做 Auth、Firestore、Storage 和云端同步，Vite PWA 插件也支持把 React/Vite 项目做成可安装的 PWA。

Blaze Skate Journal 开发计划
一、产品定位

Blaze Skate Journal = 短道速滑运动员成长档案系统

不是简单训练日记，而是记录：

每日训练
冰上/陆地/小课
教练反馈
技术问题
身体状态
视频索引
成绩变化
每周总结
暑期集训专题
长期成长里程碑

未来并入：

SkatingX Platform
├── Training
├── Analysis
├── Journal
├── Academy
├── AI Coach
└── Athlete Profile
二、MVP 第一版目标

暑假前先做能用的版本，不追求复杂。

MVP 必须有
1. Dashboard
2. Daily Log
3. Training Sessions
4. Coach Notes
5. Body Status
6. Video References
7. Weekly Review
8. Summer Camp 2026
9. Export JSON / CSV
MVP 暂时不做
1. AI自动分析
2. 视频姿态识别
3. 多运动员商业化权限
4. 复杂社交分享
5. SkatingX统一平台整合
三、推荐项目名称

本地项目名：

blaze-skate-journal

GitHub repo：

blaze-skate-journal

App 显示名：

Blaze Skate Journal
四、技术栈

建议：

Frontend:
- React
- Vite
- Tailwind CSS
- React Router
- Lucide React Icons

Backend:
- Firebase Auth
- Firestore
- Firebase Storage
- Firebase Hosting

PWA:
- vite-plugin-pwa

Firestore 用来存结构化日志，Storage 用来放视频或图片文件；如果视频太大，也可以先只存 iPhone/Google Drive/iCloud 文件名和链接。

五、核心数据结构
1. athletes
athletes/{athleteId}

示例：

{
  "athleteId": "lindsay_lin",
  "displayName": "Lindsay Lin",
  "dob": "2015-01-14",
  "sport": "short_track_speed_skating",
  "currentLevel": "Junior D",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
2. journal_days
journal_days/{athleteId}_{date}

示例：

{
  "id": "lindsay_lin_2026-07-01",
  "athleteId": "lindsay_lin",
  "date": "2026-07-01",
  "location": "Shenyang Sport University",
  "campName": "Summer Camp 2026",
  "dayType": "training",
  "overallFeeling": 4,
  "parentNote": "First day training with faster group.",
  "lindsayReflection": {
    "bestThing": "Stayed with the group longer than expected.",
    "needsWork": "Corner entry still early.",
    "tomorrowFocus": "Deeper entry and lower hip."
  },
  "isCompleted": true,
  "sourceApp": "blaze-skate-journal",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
3. training_sessions
training_sessions/{sessionId}

示例：

{
  "sessionId": "lindsay_lin_2026-07-01_am_ice",
  "athleteId": "lindsay_lin",
  "date": "2026-07-01",
  "sessionType": "ice",
  "sessionLabel": "AM Ice",
  "durationMinutes": 90,
  "intensity": 4,
  "focusTags": [
    "start",
    "500m",
    "corner_entry",
    "follow_skating"
  ],
  "notes": "Worked with 44-47s group.",
  "coachName": "Song Weilong",
  "sourceApp": "blaze-skate-journal",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

sessionType 建议固定：

ice
dryland
private_lesson
competition
recovery
rest
4. performance_records
performance_records/{recordId}

示例：

{
  "recordId": "lindsay_lin_2026-07-01_500m_01",
  "athleteId": "lindsay_lin",
  "date": "2026-07-01",
  "event": "500m",
  "timeSeconds": 48.92,
  "context": "training_test",
  "isPB": false,
  "linkedSessionId": "lindsay_lin_2026-07-01_pm_ice",
  "notes": "Follow skating test.",
  "sourceApp": "blaze-skate-journal",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

event 固定：

single_lap
first_lap
500m
777m
1000m
1500m
relay
5. technical_tags

可以先不用单独 collection，直接做常量表。

第一版标签：

[
  "corner_entry_too_early",
  "corner_drift",
  "high_center_of_gravity",
  "right_leg_support_weak",
  "exit_angle_too_wide",
  "straightaway_bouncing",
  "incomplete_push",
  "too_many_steps",
  "start_first_step_short",
  "poor_pacing",
  "late_race_fatigue"
]

前端显示中文：

入弯过早
弯中漂
重心偏高
右腿支撑不足
出弯指向偏大
直道起伏
蹬冰不完整
换脚过快
起跑第一刀短
节奏控制弱
后程掉速
6. coach_notes
coach_notes/{noteId}

示例：

{
  "noteId": "note_2026-07-01_001",
  "athleteId": "lindsay_lin",
  "date": "2026-07-01",
  "coachName": "Song Weilong",
  "note": "Corner entry should go deeper before turning.",
  "priority": "high",
  "technicalTags": [
    "corner_entry_too_early",
    "high_center_of_gravity"
  ],
  "followUpTomorrow": true,
  "linkedSessionId": "lindsay_lin_2026-07-01_am_ice",
  "sourceApp": "blaze-skate-journal",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

priority：

low
medium
high
critical
7. body_status
body_status/{athleteId}_{date}

示例：

{
  "id": "lindsay_lin_2026-07-01",
  "athleteId": "lindsay_lin",
  "date": "2026-07-01",
  "sleepHours": 9,
  "fatigueLevel": 4,
  "sorenessAreas": [
    "quad",
    "glute",
    "calf"
  ],
  "bodyWeightLb": 82.8,
  "heightCm": 145.4,
  "injuryNote": "",
  "mood": 4,
  "sourceApp": "blaze-skate-journal",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
8. video_refs
video_refs/{videoId}

示例：

{
  "videoId": "video_2026-07-01_001",
  "athleteId": "lindsay_lin",
  "date": "2026-07-01",
  "title": "AM Ice - 500m follow skating",
  "sessionId": "lindsay_lin_2026-07-01_am_ice",
  "storagePath": "",
  "externalUrl": "",
  "fileName": "20260701_am_500_follow.mov",
  "technicalTags": [
    "corner_entry_too_early",
    "right_leg_support_weak"
  ],
  "analysisStatus": "not_analyzed",
  "sourceApp": "blaze-skate-journal",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

analysisStatus：

not_analyzed
needs_analysis
analyzed
exported_to_blaze_analysis
9. weekly_reviews
weekly_reviews/{athleteId}_{weekId}

示例：

{
  "id": "lindsay_lin_2026_w27",
  "athleteId": "lindsay_lin",
  "weekStart": "2026-06-29",
  "weekEnd": "2026-07-05",
  "campName": "Summer Camp 2026",
  "iceSessions": 10,
  "drylandSessions": 6,
  "privateLessons": 3,
  "totalTrainingMinutes": 1260,
  "topTechnicalIssues": [
    "corner_entry_too_early",
    "high_center_of_gravity",
    "right_leg_support_weak"
  ],
  "bestMoment": "First full session with 44-47s group.",
  "nextWeekFocus": [
    "Deep track entry",
    "Hip pressure",
    "Right leg support"
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
10. milestones
milestones/{milestoneId}

示例：

{
  "milestoneId": "milestone_2026-07-12_500_under_49",
  "athleteId": "lindsay_lin",
  "date": "2026-07-12",
  "type": "performance",
  "title": "First 500m under 49 seconds",
  "description": "Lindsay skated 48.92 during summer camp training.",
  "linkedRecordId": "lindsay_lin_2026-07-12_500m_01",
  "sourceApp": "blaze-skate-journal",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
六、页面设计
1. Dashboard

首页显示：

Today
- 今天是否完成记录
- 今日训练场次
- 今日教练反馈
- 今日身体状态

This Week
- 冰训次数
- 陆地次数
- 小课次数
- 总训练时间

Recent Notes
- 最近3条教练反馈

Summer Camp 2026
- 第几天
- 已训练天数
- 累计冰场数
2. Daily Log

核心每日记录页。

表单结构：

Date
Location
Camp / Regular Training
Day Type

Training Sessions
+ Add AM Ice
+ Add PM Ice
+ Add Dryland
+ Add Private Lesson

Coach Notes
+ Add Note

Body Status
Sleep
Fatigue
Soreness
Weight
Mood

Performance
+ Add 500m
+ Add 777m
+ Add 1000m
+ Add Single Lap

Videos
+ Add Video Reference

Reflection
- Today’s best thing
- Needs work
- Tomorrow focus

Parent Note
3. Calendar

按日历查看：

绿色：已完成记录
黄色：部分记录
灰色：休息日
红色：漏记

点击某一天进入 Daily Log。

4. Training Sessions

按训练场次查看。

筛选：

Ice
Dryland
Private Lesson
Competition
Recovery
Rest
5. Coach Notes

重点页面。

功能：

- 按教练筛选
- 按技术标签筛选
- 按优先级筛选
- 查看出现频率

例如：

过去14天最高频问题：
1. 入弯过早 12次
2. 重心偏高 8次
3. 右腿支撑不足 7次
6. Body Status

身体状态趋势：

睡眠
疲劳
酸痛
体重
身高
情绪
伤病备注

第一版可以先做列表，不一定做图表。

7. Performance

成绩记录页：

500m
777m
1000m
1500m
Single Lap
First Lap

显示：

PB
最近一次
最近30天最好
趋势
8. Videos

视频索引页。

第一版先做：

文件名
日期
训练场次
技术标签
备注
外部链接
是否已分析

不强制上传大视频，避免 Storage 成本和手机上传问题。

9. Weekly Review

系统自动聚合，也允许手动编辑。

每周输出：

本周训练量
本周成绩变化
本周最高频技术问题
本周教练重点
本周身体状态
下周重点
10. Summer Camp 2026

专题页。

显示：

Camp Overview
- Start: 2026-07-01
- End: 2026-08-28
- Location: Shenyang / Chaoyu
- Athlete: Lindsay Lin

Stats
- Camp Day
- Training Days
- Ice Sessions
- Dryland Sessions
- Private Lessons
- Total Minutes

Performance
- 500m best
- 777m best
- 1000m best
- Single lap best

Technical
- Top 5 issues
- Top 5 improvements

Timeline
- Milestones
七、开发里程碑
J0：项目初始化

目标：建立新项目。

任务：

npm create vite@latest blaze-skate-journal -- --template react
cd blaze-skate-journal
npm install
npm install firebase react-router-dom lucide-react
npm install -D tailwindcss postcss autoprefixer
npm install -D vite-plugin-pwa

建立目录：

src/
├── app/
├── components/
├── constants/
├── firebase/
├── hooks/
├── layouts/
├── pages/
├── services/
├── utils/
└── styles/

验收：

npm run dev 可启动
首页显示 Blaze Skate Journal
路由可运行
Tailwind 生效
J1：Firebase 基础层

目标：接入 Firebase。

文件：

src/firebase/firebaseConfig.js
src/firebase/firestore.js
src/firebase/auth.js
src/services/athleteService.js
src/services/journalService.js

功能：

- Firebase 初始化
- 匿名登录或邮箱登录
- Firestore 读写测试
- 创建默认 athlete: lindsay_lin

验收：

Firebase Console 可看到 athletes/lindsay_lin
前端可读取 Lindsay Profile
J2：App Layout + Navigation

目标：建立基础 UI。

页面：

Dashboard
Daily Log
Calendar
Sessions
Coach Notes
Performance
Body
Videos
Weekly Review
Summer Camp
Settings

移动端优先。

底部导航建议：

Today
Calendar
Stats
Videos
More

验收：

iPhone 浏览器可正常使用
页面切换无报错
J3：Daily Log MVP

目标：每天能完整记录。

功能：

- 选择日期
- 创建/编辑 journal_day
- 添加 parentNote
- 添加 Lindsay Reflection
- 标记 isCompleted

验收：

创建 2026-07-01 日志
刷新页面后数据仍存在
修改后 updatedAt 更新
J4：Training Sessions

目标：记录冰训、陆地、小课。

功能：

- Add Session
- sessionType
- sessionLabel
- durationMinutes
- intensity 1-5
- focusTags
- coachName
- notes

验收：

一天可添加多场训练
Dashboard 自动统计今日训练分钟数
Weekly Review 可统计本周训练量
J5：Coach Notes

目标：把教练反馈结构化。

功能：

- 添加教练反馈
- coachName
- note
- priority
- technicalTags
- followUpTomorrow
- linkedSessionId

验收：

Coach Notes 页面可按日期显示
可按 technicalTags 筛选
Dashboard 显示最近3条反馈
J6：Body Status

目标：每日身体状态。

字段：

sleepHours
fatigueLevel
sorenessAreas
bodyWeightLb
heightCm
injuryNote
mood

验收：

每日只能有一条 body_status
修改不会重复创建
J7：Performance Records

目标：成绩记录和 PB。

功能：

- 添加 500m / 777m / 1000m / single_lap
- 自动判断是否 PB
- Performance 页面展示最好成绩

验收：

输入 500m 48.92
系统显示当前500m PB
再次输入 49.30 不覆盖PB
再次输入 48.50 更新PB
J8：Video References

目标：先做视频索引，不强制上传。

功能：

- title
- fileName
- externalUrl
- sessionId
- technicalTags
- analysisStatus
- notes

验收：

可给某天添加多个视频
可按日期和技术标签搜索视频
J9：Weekly Review

目标：自动生成周报。

自动统计：

iceSessions
drylandSessions
privateLessons
totalTrainingMinutes
topTechnicalIssues
topCoachNotes
bestPerformance

允许手动补充：

bestMoment
nextWeekFocus
parentSummary

验收：

选择 weekStart 后可生成本周总结
可保存 weekly_review
J10：Summer Camp 2026

目标：暑期专题。

功能：

- Camp date range
- 已记录天数
- 已训练天数
- 冰场数
- 陆地数
- 小课数
- 总训练分钟
- PB变化
- 高频技术问题
- 里程碑列表

验收：

7月1日至8月28日数据能被自动聚合
无训练日不会误算为训练日
J11：Export

目标：未来整合 SkatingX 的关键。

导出格式：

JSON
CSV

导出范围：

All Data
Date Range
Summer Camp 2026
Single Week

验收：

可导出完整 JSON
JSON 中每条数据都有 athleteId/date/sourceApp/createdAt/updatedAt
J12：PWA

目标：手机上像 App 一样用。

功能：

- manifest
- app icon
- installable
- offline shell

Vite PWA 插件支持给 Vite 应用注入 Web App Manifest 和 Service Worker，是这个项目最省事的做法。

验收：

iPhone Safari 可添加到主屏幕
离线时至少能打开 App shell
网络恢复后继续使用
八、Cursor / Codex 开发提示词
Prompt 1：初始化项目
You are building a React + Vite + Firebase PWA named Blaze Skate Journal.

Create the project structure for a mobile-first athlete journal app for short track speed skating.

Use:
- React
- Vite
- Tailwind CSS
- React Router
- Firebase
- Lucide React

Create these routes:
- /dashboard
- /daily
- /calendar
- /sessions
- /coach-notes
- /performance
- /body
- /videos
- /weekly-review
- /summer-camp
- /settings

Create a clean mobile-first layout with bottom navigation.
Do not implement Firebase logic yet.
Use placeholder data.
Prompt 2：Firebase 数据层
Add Firebase support to Blaze Skate Journal.

Create:
- firebaseConfig.js
- auth.js
- firestore.js
- athleteService.js
- journalService.js
- sessionService.js
- coachNoteService.js
- bodyStatusService.js
- performanceService.js
- videoService.js
- weeklyReviewService.js

Use Firestore collections:
- athletes
- journal_days
- training_sessions
- coach_notes
- body_status
- performance_records
- video_refs
- weekly_reviews
- milestones

Every document must include:
athleteId, sourceApp, createdAt, updatedAt.

Default athleteId:
lindsay_lin

sourceApp:
blaze-skate-journal
Prompt 3：Daily Log 页面
Build the Daily Log page.

Requirements:
- Date picker
- Location field
- Camp name field
- Day type selector: training, competition, recovery, rest, travel
- Lindsay reflection:
  - bestThing
  - needsWork
  - tomorrowFocus
- Parent note
- isCompleted toggle
- Save button

Use Firestore collection journal_days.
Document ID format:
{athleteId}_{date}

Load existing data when date changes.
Create or update document on save.
Prompt 4：Training Sessions
Build Training Sessions inside Daily Log and the Sessions page.

Fields:
- sessionType: ice, dryland, private_lesson, competition, recovery, rest
- sessionLabel
- durationMinutes
- intensity 1-5
- focusTags
- coachName
- notes

Allow multiple sessions per day.
Use collection training_sessions.
Session ID format:
{athleteId}_{date}_{sessionLabelSlug}

Show today's sessions on Daily Log.
Show all sessions on Sessions page with filters.
Prompt 5：Coach Notes
Build Coach Notes feature.

Fields:
- date
- coachName
- note
- priority: low, medium, high, critical
- technicalTags
- followUpTomorrow
- linkedSessionId

Create technical tag constants with English IDs and Chinese display labels:
corner_entry_too_early = 入弯过早
corner_drift = 弯中漂
high_center_of_gravity = 重心偏高
right_leg_support_weak = 右腿支撑不足
exit_angle_too_wide = 出弯指向偏大
straightaway_bouncing = 直道起伏
incomplete_push = 蹬冰不完整
too_many_steps = 换脚过快
start_first_step_short = 起跑第一刀短
poor_pacing = 节奏控制弱
late_race_fatigue = 后程掉速

Coach Notes page should support filters by coachName, priority, and technicalTags.
Prompt 6：Body Status
Build Body Status feature.

Fields:
- date
- sleepHours
- fatigueLevel 1-10
- sorenessAreas multi-select
- bodyWeightLb
- heightCm
- injuryNote
- mood 1-5

Use collection body_status.
Document ID:
{athleteId}_{date}

Daily Log should show today's body status form.
Body page should show chronological history.
Prompt 7：Performance Records
Build Performance Records feature.

Fields:
- date
- event: single_lap, first_lap, 500m, 777m, 1000m, 1500m, relay
- timeSeconds
- context: training_test, competition, practice, follow_skating
- linkedSessionId
- notes
- isPB

When saving a record, compare with all previous records for the same athlete and event.
If timeSeconds is lower than previous best, mark isPB true.
Performance page should show:
- PB by event
- recent records
- records grouped by event
Prompt 8：Video References
Build Video References feature.

Do not require actual video upload in MVP.

Fields:
- date
- title
- fileName
- externalUrl
- sessionId
- technicalTags
- analysisStatus: not_analyzed, needs_analysis, analyzed, exported_to_blaze_analysis
- notes

Videos page should allow:
- add video reference
- filter by date
- filter by technicalTags
- filter by analysisStatus
Prompt 9：Weekly Review
Build Weekly Review feature.

User selects a weekStart date.

Auto calculate:
- iceSessions
- drylandSessions
- privateLessons
- totalTrainingMinutes
- topTechnicalIssues
- bestPerformanceRecords
- coachNotesCount

User can manually enter:
- bestMoment
- nextWeekFocus
- parentSummary

Save to weekly_reviews collection.
Document ID:
{athleteId}_{year}_w{weekNumber}
Prompt 10：Summer Camp 2026
Build Summer Camp 2026 page.

Date range:
2026-07-01 to 2026-08-28

Calculate:
- total recorded days
- training days
- rest days
- ice sessions
- dryland sessions
- private lessons
- total training minutes
- PBs during camp
- top technical issues
- top coach notes
- milestones

Show timeline by week.
Prompt 11：Export
Add Export page or Settings export section.

Allow export:
- all data
- date range
- Summer Camp 2026 only

Formats:
- JSON
- CSV

JSON should include:
athletes
journal_days
training_sessions
coach_notes
body_status
performance_records
video_refs
weekly_reviews
milestones

Make sure exported data can later be imported into SkatingX Platform.
九、推荐开发顺序

我建议你按这个顺序做：

Day 1:
J0 项目初始化
J1 Firebase基础层
J2 Layout + Navigation

Day 2:
J3 Daily Log
J4 Training Sessions
J5 Coach Notes

Day 3:
J6 Body Status
J7 Performance Records
J8 Video References

Day 4:
J9 Weekly Review
J10 Summer Camp 2026
J11 Export
J12 PWA

如果时间紧，最少要完成：

1. Daily Log
2. Training Sessions
3. Coach Notes
4. Body Status
5. Video References
6. Export

Summer Camp 页面可以后补，但数据结构必须一开始就正确。

十、未来整合 SkatingX Platform 的原则

以后不要“搬家式重做”，而是让 SkatingX Platform 直接读取这些 collection。

所以现在所有数据必须统一带：

{
  "athleteId": "lindsay_lin",
  "date": "2026-07-01",
  "sourceApp": "blaze-skate-journal",
  "createdAt": "...",
  "updatedAt": "..."
}

未来整合时：

Blaze Skate Training → Training module
Blaze Skate Analysis → Analysis module
Blaze Skate Journal → Journal module

Journal 的数据不废弃，直接变成 SkatingX 的正式数据层。

十一、最终验收清单

暑假出发前，你只要确认这些就够了：

1. iPhone 可以打开
2. 每天能新建记录
3. 能添加多场训练
4. 能记录教练反馈
5. 能记录睡眠、疲劳、体重
6. 能添加视频文件名或链接
7. 能记录500/777/1000成绩
8. 能查看本周训练量
9. 能导出 JSON
10. Firebase Console 能看到完整数据

结论：Blaze Skate Journal 现在单独做是对的。