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
  source: 'stored-sample' | 'claude' | 'rules'
  /** Why a rules kit was used instead of Claude, shown beside the kit. */
  note?: string
}

export type Answers = { errors: string[]; note: string; ai: string }

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
  /** Seeded rows are labelled in the UI as sample data. */
  sample?: boolean
}
