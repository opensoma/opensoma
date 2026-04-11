import { z } from 'zod/v4'

const DateRangeSchema = z.object({ start: z.string(), end: z.string() })
const TimeRangeSchema = z.object({ start: z.string(), end: z.string() })
const RoomTimeSlotSchema = z.object({ time: z.string(), available: z.boolean() })
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

export const MentoringDetailSchema = MentoringListItemSchema.extend({
  content: z.string(),
  venue: z.string(),
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
  loggedInAt: z.string().optional(),
})
export type Credentials = z.infer<typeof CredentialsSchema>
