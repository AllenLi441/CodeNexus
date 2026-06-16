// Wires authored branch levels into a language module.
//
// A `CourseNode` becomes playable once it has a `levelId` that resolves to a
// real `Level` in the module's `levels[]`. This assembler:
//   1. appends every authored branch sub-level to `levels[]` with fresh,
//      contiguous ids continuing after the base (foundation) levels, and
//   2. sets each branch node's `levelId` to the id of its FIRST sub-level —
//      the runner's linear "next level" (`levelId + 1`) then walks the node's
//      remaining sub-lessons in order.
//
// Nodes with no authored content are left untouched (no `levelId`) and keep
// rendering as "课程即将上线", so content can be filled in incrementally.
import type { Level } from '@/lib/levels'
import { FOUNDATION_MAP_ID, type CourseMap } from '@/lib/course-maps'

/** node.id → its ordered sub-levels (length = node.lessonCount). */
export type BranchLevelsByNode = Record<string, Level[]>

export function attachBranchLevels(
  baseLevels: Level[],
  courseMaps: CourseMap[],
  branchLevelsByNode: BranchLevelsByNode
): { levels: Level[]; courseMaps: CourseMap[] } {
  const branchLevels: Level[] = []
  // Continue ids strictly after the highest base id, so appended levels never
  // collide with foundation-node levelIds and the last branch level's id equals
  // levels.length (the runner clamps deep-links to that length).
  let nextId = baseLevels.reduce((max, level) => Math.max(max, level.id), 0) + 1

  const newCourseMaps = courseMaps.map((map) => {
    if (map.id === FOUNDATION_MAP_ID) return map // foundation already wired
    const nodes = map.nodes.map((node) => {
      const specs = branchLevelsByNode[node.id]
      if (!specs || specs.length === 0) return node
      const firstId = nextId
      for (const spec of specs) {
        branchLevels.push({ ...spec, id: nextId })
        nextId += 1
      }
      return { ...node, levelId: firstId }
    })
    return { ...map, nodes }
  })

  return { levels: [...baseLevels, ...branchLevels], courseMaps: newCourseMaps }
}
