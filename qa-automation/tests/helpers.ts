import { QA_PREFIX } from '../constants';

/**
 * A unique, human-readable name for a record a test creates.
 *
 *   uniqueName('Blue Mug')  ->  "Blue Mug QA test 15 Oct 14:46:03"
 *
 * Same rule as UAPP: a date, never a random code, so a person can tell when the record
 * appeared and that it is test data. Seconds keep two records in one minute apart.
 */
export function uniqueName(label: string): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  const when = `${p(d.getDate())} ${month} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  return `${label} ${QA_PREFIX} test ${when}`;
}
