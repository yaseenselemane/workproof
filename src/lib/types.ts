export type LineKind = 'proxy' | 'trainable' | 'task' | 'review'

export type AdLine = {
  text: string
  section: 'requirements' | 'duties' | 'other'
  kind: LineKind
  /** Short reason shown on the tag, e.g. "years, not ability". */
  why: string
}

export type Level = 'Junior' | 'Intermediate' | 'Senior'

export type Xray = {
  title: string
  employer: string
  lines: AdLine[]
  /** Set when the title claims an entry-level role the requirements contradict. */
  labelMismatch: { titled: string; reads: Level; reason: string } | null
  fairness: string[]
  /** The most years of experience any requirement asks for; 0 when the ad asks for none. */
  requiredYears: number
}

export type AbilityId = 'A' | 'B' | 'C'

export type Ability = { id: AbilityId; name: string; fromDuty: string }

export type Kit = {
  role: string
  abilities: Ability[]
  test: { minutes: number; gets: string[]; task: string }
  /** levels[0] is score 1, levels[3] is score 4. */
  rubric: { ability: AbilityId; levels: [string, string, string, string] }[]
  /** Where the kit came from, shown to the user so a stored result is never passed off as live. */
  source: 'stored-sample' | 'ai' | 'rules'
  /** Why a rules kit was used instead of the AI draft, shown beside the kit. */
  note?: string
  /** Set once the employer has changed anything, so the label stops claiming it's an untouched draft. */
  edited?: boolean
}

/**
 * yearsExperience is asked at the end of the test and kept from the scorer until every answer is
 * scored; it exists only to show what the ad's experience filter would have done.
 */
export type Answers = { errors: string[]; note: string; ai: string; yearsExperience?: number }

/** What the employer records about a hire after 90 days, to see whether the test predicted the job. */
export type Checkin = { outcome: 'strong' | 'expected' | 'struggling'; note: string; at: number }

export type Scores = Partial<Record<AbilityId, 1 | 2 | 3 | 4>>

export type Decision = 'interview' | 'hold' | 'decline'

export type Submission = {
  id: string
  candidateNo: number
  /** Hidden while scoring; revealed only once every submission is scored. */
  name: string
  answers: Answers
  minutes: number
  submittedAt: number
  scores: Scores
  followUp: string
  decision: Decision | null
  checkin?: Checkin | null
  /** Seeded rows are labelled in the UI as sample data. */
  sample?: boolean
}
