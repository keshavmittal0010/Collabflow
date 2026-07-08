import { describe, test, expect } from 'vitest'
import { slugify, getInitials, formatFileSize } from './utils'

describe('Utils utility helpers tests', () => {
  test('slugify normalizes workspace names', () => {
    expect(slugify('My Workspace')).toBe('my-workspace')
    expect(slugify('  workspace WITH spaces  ')).toBe('workspace-with-spaces')
    expect(slugify('CollabFlow v0.1.0 !!!')).toBe('collabflow-v010')
    expect(slugify('project_key-name')).toBe('project-key-name')
  })

  test('getInitials extracts name initials', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Alice')).toBe('A')
    expect(getInitials('Multi word team name')).toBe('MW')
  })

  test('formatFileSize formats byte values', () => {
    expect(formatFileSize(500)).toBe('500 B')
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1572864)).toBe('1.5 MB')
  })
})
