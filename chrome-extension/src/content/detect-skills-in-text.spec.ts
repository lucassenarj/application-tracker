import { detectSkillsInText } from './detect-skills-in-text'

describe('detectSkillsInText', () => {
  it('detects known skills mentioned in the text', () => {
    const text = 'Looking for a developer with React and Java Spring Boot experience, plus AWS and Docker.'

    const result = detectSkillsInText(text)

    expect(result).toEqual(['React', 'Java', 'Spring Boot', 'AWS', 'Docker'])
  })

  it('does not match a skill as a substring of an unrelated word', () => {
    const text = 'Strong JavaScript skills required.'

    const result = detectSkillsInText(text)

    expect(result).toEqual(['JavaScript'])
    expect(result).not.toContain('Java')
  })

  it('matches case-insensitively', () => {
    const text = 'experience with react and TYPESCRIPT'

    const result = detectSkillsInText(text)

    expect(result).toEqual(['TypeScript', 'React'])
  })

  it('returns an empty array when no known skills are mentioned', () => {
    const result = detectSkillsInText('We are a great company to work for.')

    expect(result).toEqual([])
  })
})
