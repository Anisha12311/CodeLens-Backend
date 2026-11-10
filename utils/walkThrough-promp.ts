/** The instructions sent to Claude for a pasted problem; the reply must be one JSON object. */
export function buildWalkthroughPrompt(problem: string, example: string) {
  return `You are making a step-by-step animated dry run of a coding problem for students.

PROBLEM:
"""
${problem}
"""
EXAMPLE TO TRACE: ${example || "choose a small, typical example"}

Write a clear, standard Python solution (at most 25 lines). Then trace that exact code on the example, one meaningful step at a time, and reply with ONLY this JSON object:

{
 "title": "the problem's name",
 "approach": "1 or 2 plain sentences on the key idea",
 "time": "O(n)", "space": "O(1)",
 "input": "the example on one line",
 "output": "the expected result",
 "code": ["each line of the Python solution as a string, indentation kept"],
 "steps": [
  {
   "line": 1-based line number of the code being run,
   "text": "1 or 2 plain sentences saying what happens and why, using the real values",
   "vars": {"name": "current value as a string"},
   "expr": optional short line shown under the animation, such as "«a:31» > «c:20» ?" or "«s:20» < «c:50» → left". Mark values with «a:…» current, «c:…» compared, «s:…» changed, «d:…» final, «m:…» ruled out,
   "panels": [ the full picture of the data structures at this step ],
   "ask": optional {"q": "a question a student can answer BEFORE seeing this step", "options": ["2 to 4 short strings"], "answer": "exactly one of the options"}
  }
 ]
}

The first two entries of "vars" are shown large above the animation, so put the most important variables first.

Panel kinds. Pick the ones that match the solution's data structures. Every step repeats every panel's full current state, with the same names in the same order.
{"kind":"array","name":"nums","cells":[2,7,11,15],"ptrs":{"i":1,"j":3},"hl":{"compare":[1,3]}}   arrays and strings (one character per cell)
{"kind":"list","name":"head","cells":[1,2,4],"ptrs":{"curr":0}}   linked list, drawn with arrows
{"kind":"map","name":"seen","entries":[["2",0],["7",1]],"hl":{"active":["7"]}}   dict; for a set give "" as each value
{"kind":"stack","name":"stack","items":["(","["],"hl":{"active":[1]}}   bottom first. "queue" works the same way, front first
{"kind":"grid","name":"dp","rows":[[1,1],[1,2]],"hl":{"compare":[[1,0]],"swap":[[1,1]]},"rowLabels":["0","1"],"colLabels":["0","1"]}   2-D table, matrix or DP table
{"kind":"tree","name":"root","root":"a","nodes":[{"id":"a","v":3,"l":"b","r":"c"},{"id":"b","v":9},{"id":"c","v":20}],"hl":{"active":["a"]}}   binary tree
{"kind":"text","name":"result","value":"[0, 1]"}   a single value such as the answer so far

Highlight states in "hl": "active" = the current element, "compare" = being checked, "swap" = just changed, "done" = final or part of the answer, "muted" = ruled out. Indices are 0-based.

Rules:
- The trace must match what the code really does on the example. Work it out carefully; the values in text, vars, expr and panels must agree with each other.
- 12 to 45 steps. Skip trivial lines, but show every decision.
- Keep the example small enough to fit: arrays and strings up to 12 items, grids up to 8 by 8, trees up to 15 nodes.
- Put "ask" on 3 to 8 of the most interesting decision steps.
- The last step states the final answer.
- Plain, friendly English for students. No markdown, except wrapping code names in backticks.
- If this is not a programming problem, reply with only {"error": "a short reason"}.`;
}
