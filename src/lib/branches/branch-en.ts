// Aggregated zh → en map for ALL extended-branch levels.
//
// This module imports ONLY the per-language string maps (pure `Record<string,
// string>`), never the heavy level data, so pulling it into the app-wide
// `@/lib/i18n` stays cheap.
import { C_BRANCH_EN } from './c-en'
import { CPP_BRANCH_EN } from './cpp-en'
import { JAVA_BRANCH_EN } from './java-en'
import { CSHARP_BRANCH_EN } from './csharp-en'
import { JAVASCRIPT_BRANCH_EN } from './javascript-en'
import { VISUAL_BASIC_BRANCH_EN } from './visual-basic-en'
import { PYTHON_BRANCH_EN } from './python-en'

export const BRANCH_EN: Record<string, string> = {
  ...C_BRANCH_EN,
  ...CPP_BRANCH_EN,
  ...JAVA_BRANCH_EN,
  ...CSHARP_BRANCH_EN,
  ...JAVASCRIPT_BRANCH_EN,
  ...VISUAL_BASIC_BRANCH_EN,
  ...PYTHON_BRANCH_EN,
}
