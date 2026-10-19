import assert from 'node:assert/strict';
import test from 'node:test';
import { parseStudent, filterStudents, defaultFilters, levelLabel } from '../lib/admin/students.ts';
const students = [
  parseStudent('a', { studentName: 'Anya', guardianEmail: 'anya@example.com', grade: 4, board: 'CBSE', currentLevel: 2, pretestCompleted: true, createdAt: { toMillis: () => 1000 } }),
  parseStudent('b', { studentName: 'Ben', guardianEmail: 'ben@example.com', grade: 5, board: 'IB', currentLevel: 0, pretestCompleted: false, createdAt: { toMillis: () => 2000 } }),
  parseStudent('c', { studentName: 'Charu', guardianEmail: 'parent@example.com', grade: 4, board: 'CBSE', currentLevel: 3, pretestCompleted: true }),
];
test('combines name/email search with grade, board, level and pre-test filters', () => {
  assert.deepEqual(filterStudents(students, { ...defaultFilters, search: ' ANYA@EXAMPLE ', grade: '4', board: 'CBSE', level: '2', pretest: 'completed' }).map(s => s.id), ['a']);
  assert.equal(filterStudents(students, { ...defaultFilters, grade: '5', board: 'CBSE' }).length, 0);
});
test('unassigned level and pending status remain filterable', () => {
  assert.deepEqual(filterStudents(students, { ...defaultFilters, level: '0', pretest: 'pending' }).map(s => s.id), ['b']);
  assert.equal(levelLabel(0), 'Not assigned');
});
test('sorts missing registration dates last, without mutating input', () => {
  assert.deepEqual(filterStudents(students, defaultFilters).map(s => s.id), ['b', 'a', 'c']);
  assert.deepEqual(filterStudents(students, { ...defaultFilters, sort: 'level' }).map(s => s.id), ['c', 'a', 'b']);
  assert.deepEqual(filterStudents(students, { ...defaultFilters, sort: 'name' }).map(s => s.id), ['a', 'b', 'c']);
  assert.deepEqual(students.map(s => s.id), ['a', 'b', 'c']);
});
test('handles incomplete legacy profiles without fabricating learning results', () => {
  const student = parseStudent('old', { grade: '4', currentLevel: -1, pretestCompleted: 'true', createdAt: {} });
  assert.equal(student.grade, null);
  assert.equal(student.currentLevel, 0);
  assert.equal(student.pretestCompleted, false);
  assert.equal(student.createdAt, null);
  assert.equal(student.studentName, 'Unnamed student');
});
