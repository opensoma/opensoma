import { z } from 'zod/v4'

const DateRangeSchema = z.object({ start: z.string(), end: z.string() })
const TimeRangeSchema = z.object({ start: z.string(), end: z.string() })
const RoomTimeSlotReservationSchema = z.object({ title: z.string(), bookedBy: z.string() })
const RoomTimeSlotSchema = z.object({
  time: z.string(),
  available: z.boolean(),
  reservation: RoomTimeSlotReservationSchema.optional(),
})
const DashboardStatusItemSchema = z.object({
  title: z.string(),
  url: z.string(),
  status: z.string(),
  date: z.string().optional(),
  time: z.string().optional(),
  timeEnd: z.string().optional(),
  venue: z.string().optional(),
  type: z.enum(['자유 멘토링', '멘토 특강']).optional(),
})
const TeamListItemSchema = z.object({
  name: z.string(),
  memberCount: z.number(),
  joinStatus: z.string(),
})

export const MentoringListItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  type: z.enum(['자유 멘토링', '멘토 특강']),
  registrationPeriod: DateRangeSchema,
  sessionDate: z.string(),
  sessionTime: TimeRangeSchema,
  attendees: z.object({ current: z.number(), max: z.number() }),
  approved: z.boolean(),
  status: z.enum(['접수중', '마감']),
  author: z.string(),
  createdAt: z.string(),
})
export type MentoringListItem = z.infer<typeof MentoringListItemSchema>

export const MentoringApplicantSchema = z.object({
  name: z.string(),
  appliedAt: z.string(),
  cancelledAt: z.string(),
  status: z.string(),
})
export type MentoringApplicant = z.infer<typeof MentoringApplicantSchema>

export const MentoringDetailSchema = MentoringListItemSchema.extend({
  content: z.string(),
  venue: z.string(),
  applicants: z.array(MentoringApplicantSchema),
})
export type MentoringDetail = z.infer<typeof MentoringDetailSchema>

export const RoomCardSchema = z.object({
  itemId: z.number(),
  name: z.string(),
  capacity: z.number(),
  availablePeriod: DateRangeSchema,
  description: z.string(),
  timeSlots: z.array(RoomTimeSlotSchema),
})
export type RoomCard = z.infer<typeof RoomCardSchema>

export const RoomReservationStatusSchema = z.enum(['confirmed', 'cancelled', 'unknown'])
export type RoomReservationStatus = z.infer<typeof RoomReservationStatusSchema>

export const RoomReservationDetailSchema = z.object({
  rentId: z.number(),
  itemId: z.number(),
  title: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  attendees: z.number(),
  notes: z.string(),
  status: RoomReservationStatusSchema,
  statusCode: z.string(),
})
export type RoomReservationDetail = z.infer<typeof RoomReservationDetailSchema>

export const RoomUpdateOptionsSchema = z.object({
  title: z.string().optional(),
  roomId: z.number().optional(),
  date: z.string().optional(),
  slots: z.array(z.string()).optional(),
  attendees: z.number().optional(),
  notes: z.string().optional(),
})
export type RoomUpdateOptions = z.infer<typeof RoomUpdateOptionsSchema>

export const DashboardSchema = z.object({
  name: z.string(),
  role: z.string(),
  organization: z.string(),
  position: z.string(),
  team: z
    .object({
      name: z.string(),
      members: z.string(),
      mentor: z.string(),
    })
    .optional(),
  mentoringSessions: z.array(DashboardStatusItemSchema),
  roomReservations: z.array(DashboardStatusItemSchema),
})
export type Dashboard = z.infer<typeof DashboardSchema>

export const NoticeListItemSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  createdAt: z.string(),
})
export type NoticeListItem = z.infer<typeof NoticeListItemSchema>

export const NoticeDetailSchema = NoticeListItemSchema.extend({
  content: z.string(),
})
export type NoticeDetail = z.infer<typeof NoticeDetailSchema>

export const TeamInfoSchema = z.object({
  teams: z.array(TeamListItemSchema),
  currentTeams: z.number(),
  maxTeams: z.number(),
})
export type TeamInfo = z.infer<typeof TeamInfoSchema>

export const MemberInfoSchema = z.object({
  email: z.string(),
  name: z.string(),
  gender: z.string(),
  birthDate: z.string(),
  phone: z.string(),
  organization: z.string(),
  position: z.string(),
})
export type MemberInfo = z.infer<typeof MemberInfoSchema>

export const EventListItemSchema = z.object({
  id: z.number(),
  category: z.string(),
  title: z.string(),
  registrationPeriod: DateRangeSchema,
  eventPeriod: DateRangeSchema,
  status: z.string(),
  createdAt: z.string(),
})
export type EventListItem = z.infer<typeof EventListItemSchema>

export const ScheduleListItemSchema = z.object({
  id: z.number(),
  category: z.string(),
  title: z.string(),
  period: DateRangeSchema,
})
export type ScheduleListItem = z.infer<typeof ScheduleListItemSchema>

export const ApplicationHistoryItemSchema = z.object({
  id: z.number(),
  category: z.string(),
  title: z.string(),
  author: z.string(),
  sessionDate: z.string(),
  appliedAt: z.string(),
  applicationStatus: z.string(),
  approvalStatus: z.string(),
  applicationDetail: z.string(),
  note: z.string(),
})
export type ApplicationHistoryItem = z.infer<typeof ApplicationHistoryItemSchema>

export const PaginationSchema = z.object({
  total: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
})
export type Pagination = z.infer<typeof PaginationSchema>

export const CredentialsSchema = z.object({
  sessionCookie: z.string(),
  cookies: z.string().optional(),
  csrfToken: z.string(),
  username: z.string().optional(),
  password: z.string().optional(),
  loggedInAt: z.string().optional(),
  tozName: z.string().optional(),
  tozPhone: z.string().optional(),
})
export type Credentials = z.infer<typeof CredentialsSchema>

export const TozBranchSchema = z.object({
  id: z.number(),
  name: z.string(),
})
export type TozBranch = z.infer<typeof TozBranchSchema>

export const TozMeetingSchema = z.object({
  id: z.number(),
  name: z.string(),
})
export type TozMeeting = z.infer<typeof TozMeetingSchema>

export const TozDurationSchema = z.object({
  key: z.string(),
  value: z.string(),
  minutes: z.number(),
})
export type TozDuration = z.infer<typeof TozDurationSchema>

export const TozBoothSchema = z.object({
  id: z.number(),
  name: z.string(),
  branchName: z.string(),
  branchTel: z.string(),
  minUseUserCount: z.number(),
  enableMaxUserCount: z.number(),
  boothGroupName: z.string(),
  boothGroupUrl: z.string().nullable(),
  boothMemoForUser: z.string(),
  isLargeBooth: z.boolean(),
})
export type TozBooth = z.infer<typeof TozBoothSchema>

export const TozReservedSchema = z.object({
  reservationId: z.string(),
  branchName: z.string(),
  branchTel: z.string(),
  boothGroupName: z.string(),
  isLargeBooth: z.boolean(),
})
export type TozReserved = z.infer<typeof TozReservedSchema>

export const TozReservationSchema = z.object({
  no: z.number(),
  reservationId: z.number().nullable(),
  meetingName: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  branchName: z.string(),
  boothName: z.string(),
  reservedAt: z.string(),
  status: z.string(),
})
export type TozReservation = z.infer<typeof TozReservationSchema>

export const ReportListItemSchema = z.object({
  id: z.number(),
  category: z.string(),
  title: z.string(),
  progressDate: z.string(),
  status: z.string(),
  author: z.string(),
  createdAt: z.string(),
  acceptedTime: z.string(),
  payAmount: z.string(),
})
export type ReportListItem = z.infer<typeof ReportListItemSchema>

export const ReportDetailSchema = ReportListItemSchema.extend({
  content: z.string(),
  subject: z.string(),
  menteeRegion: z.string(),
  reportType: z.string(),
  teamNames: z.string(),
  venue: z.string(),
  attendanceCount: z.number(),
  attendanceNames: z.string(),
  progressStartTime: z.string(),
  progressEndTime: z.string(),
  exceptStartTime: z.string(),
  exceptEndTime: z.string(),
  exceptReason: z.string(),
  mentorOpinion: z.string(),
  nonAttendanceNames: z.string(),
  etc: z.string(),
  files: z.array(z.string()),
})
export type ReportDetail = z.infer<typeof ReportDetailSchema>

export const ApprovalListItemSchema = z.object({
  id: z.number(),
  category: z.string(),
  title: z.string(),
  progressDate: z.string(),
  status: z.string(),
  author: z.string(),
  createdAt: z.string(),
  acceptedTime: z.string(),
  travelExpense: z.string(),
  mentoringAllowance: z.string(),
})
export type ApprovalListItem = z.infer<typeof ApprovalListItemSchema>

export const ReportCreateOptionsSchema = z.object({
  menteeRegion: z.enum(['S', 'B']),
  reportType: z.enum(['MRC010', 'MRC020']),
  progressDate: z.string(),
  teamNames: z.string().optional(),
  venue: z.string(),
  attendanceCount: z.number(),
  attendanceNames: z.string(),
  progressStartTime: z.string(),
  progressEndTime: z.string(),
  exceptStartTime: z.string().optional(),
  exceptEndTime: z.string().optional(),
  exceptReason: z.string().optional(),
  subject: z.string().min(10),
  content: z.string().min(100),
  mentorOpinion: z.string().optional(),
  nonAttendanceNames: z.string().optional(),
  etc: z.string().optional(),
})
export type ReportCreateOptions = z.infer<typeof ReportCreateOptionsSchema>

export const ReportUpdateOptionsSchema = ReportCreateOptionsSchema.partial().extend({
  id: z.number(),
})
export type ReportUpdateOptions = z.infer<typeof ReportUpdateOptionsSchema>

export const MentoringCreateOptionsSchema = z.object({
  title: z.string(),
  type: z.enum(['public', 'lecture']),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  venue: z.string(),
  maxAttendees: z.number().optional(),
  regStart: z.string().optional(),
  regEnd: z.string().optional(),
  content: z.string().optional(),
})
export type MentoringCreateOptions = z.infer<typeof MentoringCreateOptionsSchema>

export const MentoringUpdateOptionsSchema = MentoringCreateOptionsSchema.partial()
export type MentoringUpdateOptions = z.infer<typeof MentoringUpdateOptionsSchema>
