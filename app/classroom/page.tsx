"use client";

import { useState, useRef, useEffect } from "react";
import { quizHistoryStorage } from "@/lib/storage/quiz-history-storage";
import { storage } from "@/lib/storage";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message { role: "user" | "assistant"; content: string; }

interface TestCase { input: string; expectedOutput: string; description: string; }

interface Exercise {
  title: string;
  concept: string;
  description: string;
  starterCode: string;
  hints: string[];
  testCases: TestCase[];
  // For retention linking — set when user picks from their topics
  topicId?: string;
  topicName?: string;
  conceptId?: string;
}

interface Concept { name: string; emoji: string; difficulty: "Beginner" | "Intermediate" | "Advanced"; }

interface Language { id: string; name: string; emoji: string; color: string; concepts: Concept[]; }

interface TestResult { description: string; passed: boolean; expected: string; got: string; }

interface CheckResult { passed: number; total: number; score: number; results: TestResult[]; }

// ─── Languages + Concepts ─────────────────────────────────────────────────────
const LANGUAGES: Language[] = [
  {
    id: "python", name: "Python", emoji: "🐍", color: "#3b82f6",
    concepts: [
      { name: "Variables & Data Types", emoji: "📦", difficulty: "Beginner" },
      { name: "Loops", emoji: "🔄", difficulty: "Beginner" },
      { name: "Functions", emoji: "⚙️", difficulty: "Beginner" },
      { name: "Lists & Arrays", emoji: "📋", difficulty: "Beginner" },
      { name: "Dictionaries", emoji: "📖", difficulty: "Intermediate" },
      { name: "Enumerators (Enum)", emoji: "🏷️", difficulty: "Intermediate" },
      { name: "Classes & OOP", emoji: "🏗️", difficulty: "Intermediate" },
      { name: "File Handling", emoji: "📁", difficulty: "Intermediate" },
      { name: "Error Handling", emoji: "🚨", difficulty: "Advanced" },
      { name: "Decorators", emoji: "🎨", difficulty: "Advanced" },
    ],
  },
  {
    id: "javascript", name: "JavaScript", emoji: "⚡", color: "#f59e0b",
    concepts: [
      { name: "Variables & let/const", emoji: "📦", difficulty: "Beginner" },
      { name: "Functions & Arrow Functions", emoji: "⚙️", difficulty: "Beginner" },
      { name: "Arrays & Methods", emoji: "📋", difficulty: "Beginner" },
      { name: "Objects", emoji: "📖", difficulty: "Intermediate" },
      { name: "Promises & Async/Await", emoji: "⏳", difficulty: "Intermediate" },
      { name: "Classes & OOP", emoji: "🏗️", difficulty: "Advanced" },
      { name: "Closures", emoji: "🔒", difficulty: "Advanced" },
    ],
  },
  {
    id: "java", name: "Java", emoji: "☕", color: "#ef4444",
    concepts: [
      { name: "Variables & Types", emoji: "📦", difficulty: "Beginner" },
      { name: "Loops & Conditions", emoji: "🔄", difficulty: "Beginner" },
      { name: "Methods", emoji: "⚙️", difficulty: "Beginner" },
      { name: "Classes & Objects", emoji: "🏗️", difficulty: "Intermediate" },
      { name: "Enums", emoji: "🏷️", difficulty: "Intermediate" },
      { name: "Inheritance", emoji: "🧬", difficulty: "Intermediate" },
      { name: "Interfaces", emoji: "🔌", difficulty: "Advanced" },
    ],
  },
  {
    id: "html-css", name: "HTML/CSS", emoji: "🎨", color: "#8b5cf6",
    concepts: [
      { name: "HTML Structure", emoji: "🏗️", difficulty: "Beginner" },
      { name: "CSS Selectors", emoji: "🎯", difficulty: "Beginner" },
      { name: "Flexbox", emoji: "📐", difficulty: "Intermediate" },
      { name: "CSS Grid", emoji: "⬛", difficulty: "Intermediate" },
      { name: "Responsive Design", emoji: "📱", difficulty: "Intermediate" },
      { name: "CSS Animations", emoji: "✨", difficulty: "Advanced" },
    ],
  },
  {
    id: "cpp", name: "C++", emoji: "⚙️", color: "#06b6d4",
    concepts: [
      { name: "Variables & Types", emoji: "📦", difficulty: "Beginner" },
      { name: "Loops & Conditions", emoji: "🔄", difficulty: "Beginner" },
      { name: "Functions", emoji: "⚙️", difficulty: "Beginner" },
      { name: "Pointers", emoji: "👉", difficulty: "Intermediate" },
      { name: "Classes & OOP", emoji: "🏗️", difficulty: "Intermediate" },
      { name: "Templates", emoji: "📋", difficulty: "Advanced" },
    ],
  },
];


// ─── Multi-question bank ──────────────────────────────────────────────────────
// Each concept has 3 questions — picked randomly each time so it feels fresh.
// 🔌 When GitHub Models API is connected, replace pickExercise() with:
//
//   const res = await fetch("https://models.inference.ai.azure.com/chat/completions", {
//     headers: { Authorization: `Bearer ${githubToken}` },
//     body: JSON.stringify({
//       model: "gpt-4o",
//       messages: [{ role: "user", content:
//         `Generate a ${concept.difficulty} Python coding challenge about "${concept.name}".
//          Return ONLY JSON: { title, description, starterCode, hints[], testCases[{input,expectedOutput,description}] }` }]
//     })
//   });
//   const data = await res.json();
//   return JSON.parse(data.choices[0].message.content);
//
const QUESTION_BANK: Record<string, Omit<Exercise, "concept" | "topicId" | "topicName" | "conceptId">[]> = {

  // ── PYTHON: Enumerators ────────────────────────────────────────────────────
  "python::Enumerators (Enum)": [
    {
      title: "Q1 — Season Enum",
      description: "Create an Enum called `Season` with SPRING=1, SUMMER=2, FALL=3, WINTER=4. Then write `next_season(s)` that returns the next season, wrapping WINTER → SPRING.",
      starterCode: `from enum import Enum

class Season(Enum):
    # TODO: SPRING=1, SUMMER=2, FALL=3, WINTER=4
    pass

def next_season(s: Season) -> Season:
    # TODO: return the next season (wraps WINTER → SPRING)
    pass

print(next_season(Season.SPRING))   # Expected: Season.SUMMER
print(next_season(Season.WINTER))   # Expected: Season.SPRING
print(Season.FALL.value)            # Expected: 3`,
      hints: ["Enum syntax: SPRING = 1, SUMMER = 2 inside the class body.", "Use list(Season) to get all, find index, add 1, wrap with %."],
      testCases: [
        { input: "next_season(Season.SPRING)", expectedOutput: "Season.SUMMER", description: "SPRING → SUMMER" },
        { input: "next_season(Season.WINTER)", expectedOutput: "Season.SPRING", description: "WINTER wraps to SPRING" },
        { input: "Season.FALL.value", expectedOutput: "3", description: "FALL has value 3" },
      ],
    },
    {
      title: "Q2 — Traffic Light Enum",
      description: "Create a `TrafficLight` enum with RED, YELLOW, GREEN. Write `next_light(light)` returning the next light in cycle (GREEN → RED), and `is_safe(light)` returning True only for GREEN.",
      starterCode: `from enum import Enum

class TrafficLight(Enum):
    # TODO: RED=1, YELLOW=2, GREEN=3
    pass

def next_light(light: TrafficLight) -> TrafficLight:
    # TODO: RED→YELLOW, YELLOW→GREEN, GREEN→RED
    pass

def is_safe(light: TrafficLight) -> bool:
    # TODO: return True only if GREEN
    pass

print(next_light(TrafficLight.RED))     # Expected: TrafficLight.YELLOW
print(next_light(TrafficLight.GREEN))   # Expected: TrafficLight.RED
print(is_safe(TrafficLight.GREEN))      # Expected: True
print(is_safe(TrafficLight.RED))        # Expected: False`,
      hints: ["Same wrap pattern as Season: use list() and modulo.", "is_safe: return light == TrafficLight.GREEN"],
      testCases: [
        { input: "next_light(TrafficLight.RED)", expectedOutput: "TrafficLight.YELLOW", description: "RED → YELLOW" },
        { input: "next_light(TrafficLight.GREEN)", expectedOutput: "TrafficLight.RED", description: "GREEN wraps to RED" },
        { input: "is_safe(TrafficLight.GREEN)", expectedOutput: "True", description: "GREEN is safe" },
      ],
    },
    {
      title: "Q3 — Planet Enum",
      description: "Create a `Planet` enum for the 4 inner planets (MERCURY=1, VENUS=2, EARTH=3, MARS=4). Write `distance_from_sun(p)` returning the planet's value × 57.9 million km (MERCURY = 57.9).",
      starterCode: `from enum import Enum

class Planet(Enum):
    # TODO: MERCURY=1, VENUS=2, EARTH=3, MARS=4
    pass

def distance_from_sun(p: Planet) -> float:
    # TODO: return p.value * 57.9
    pass

print(distance_from_sun(Planet.MERCURY))  # Expected: 57.9
print(distance_from_sun(Planet.EARTH))    # Expected: 173.7
print(Planet.MARS.name)                   # Expected: MARS`,
      hints: ["Access the numeric value with p.value.", "173.7 = 3 × 57.9 (Earth is 3rd planet)."],
      testCases: [
        { input: "distance_from_sun(Planet.MERCURY)", expectedOutput: "57.9", description: "Mercury distance" },
        { input: "distance_from_sun(Planet.EARTH)", expectedOutput: "173.7", description: "Earth = 3 × 57.9" },
        { input: "Planet.MARS.name", expectedOutput: "MARS", description: "Enum name attribute" },
      ],
    },
  ],

  // ── PYTHON: Loops ──────────────────────────────────────────────────────────
  "python::Loops": [
    {
      title: "Q1 — Sum & Countdown",
      description: "Write `sum_list(numbers)` using a for loop (no built-in sum()), and `countdown(n)` using a while loop returning a list counting down from n to 1.",
      starterCode: `def sum_list(numbers: list) -> int:
    total = 0
    # TODO: for loop — add each number to total
    pass

def countdown(n: int) -> list:
    result = []
    # TODO: while loop — count down from n to 1
    pass

print(sum_list([1, 2, 3, 4, 5]))  # Expected: 15
print(sum_list([]))               # Expected: 0
print(countdown(5))               # Expected: [5, 4, 3, 2, 1]`,
      hints: ["for num in numbers: total += num", "while n > 0: result.append(n); n -= 1"],
      testCases: [
        { input: "sum_list([1,2,3,4,5])", expectedOutput: "15", description: "Sum = 15" },
        { input: "sum_list([])", expectedOutput: "0", description: "Empty list = 0" },
        { input: "countdown(5)", expectedOutput: "[5, 4, 3, 2, 1]", description: "Countdown from 5" },
      ],
    },
    {
      title: "Q2 — FizzBuzz",
      description: "Write `fizzbuzz(n)` returning a list from 1 to n. For multiples of 3: 'Fizz'. Multiples of 5: 'Buzz'. Both: 'FizzBuzz'. Otherwise: the number as a string.",
      starterCode: `def fizzbuzz(n: int) -> list:
    result = []
    # TODO: loop 1 to n, apply FizzBuzz rules
    pass

print(fizzbuzz(5))    # Expected: ['1', '2', 'Fizz', '4', 'Buzz']
print(fizzbuzz(15)[-1])  # Expected: FizzBuzz`,
      hints: ["Check divisibility by BOTH 3 and 5 first (order matters!).", "Use str(i) for regular numbers.", "range(1, n+1) gives 1 to n inclusive."],
      testCases: [
        { input: "fizzbuzz(5)", expectedOutput: "['1', '2', 'Fizz', '4', 'Buzz']", description: "First 5 values" },
        { input: "fizzbuzz(15)[-1]", expectedOutput: "FizzBuzz", description: "15 = FizzBuzz" },
        { input: "fizzbuzz(3)[-1]", expectedOutput: "Fizz", description: "3 = Fizz" },
      ],
    },
    {
      title: "Q3 — Multiplication Table",
      description: "Write `multiplication_table(n)` that returns a 2D list (list of lists) representing an n×n multiplication table. table[i][j] = (i+1) × (j+1).",
      starterCode: `def multiplication_table(n: int) -> list:
    table = []
    # TODO: nested for loops to build n×n table
    pass

t = multiplication_table(3)
print(t[0])  # Expected: [1, 2, 3]
print(t[1])  # Expected: [2, 4, 6]
print(t[2])  # Expected: [3, 6, 9]`,
      hints: ["Outer loop for rows (i), inner loop for columns (j).", "Each cell = (i+1) * (j+1).", "Use a row = [] inside the outer loop, then append to table."],
      testCases: [
        { input: "multiplication_table(3)[0]", expectedOutput: "[1, 2, 3]", description: "First row" },
        { input: "multiplication_table(3)[2]", expectedOutput: "[3, 6, 9]", description: "Third row" },
        { input: "multiplication_table(2)[1][1]", expectedOutput: "4", description: "2×2 bottom-right" },
      ],
    },
  ],

  // ── PYTHON: Functions ──────────────────────────────────────────────────────
  "python::Functions": [
    {
      title: "Q1 — Rectangle Stats",
      description: "Write `rectangle_stats(w, h)` returning (area, perimeter) as a tuple, and `greet(name, greeting='Hello')` returning a formatted string.",
      starterCode: `def rectangle_stats(width: float, height: float):
    # TODO: return (area, perimeter) as a tuple
    pass

def greet(name: str, greeting: str = "Hello") -> str:
    # TODO: return "{greeting}, {name}!"
    pass

print(rectangle_stats(4, 5))  # Expected: (20, 18)
print(greet("Alice"))          # Expected: Hello, Alice!
print(greet("Bob", "Hi"))      # Expected: Hi, Bob!`,
      hints: ["Return two values: return (w*h, 2*(w+h))", "f-string: return f'{greeting}, {name}!'"],
      testCases: [
        { input: "rectangle_stats(4, 5)", expectedOutput: "(20, 18)", description: "Area=20, Perimeter=18" },
        { input: 'greet("Alice")', expectedOutput: "Hello, Alice!", description: "Default greeting" },
        { input: 'greet("Bob", "Hi")', expectedOutput: "Hi, Bob!", description: "Custom greeting" },
      ],
    },
    {
      title: "Q2 — Min, Max & Range",
      description: "Without using Python's built-in min()/max(), write `find_min(lst)`, `find_max(lst)`, and `value_range(lst)` that returns max - min.",
      starterCode: `def find_min(lst: list) -> float:
    # TODO: find smallest value without min()
    pass

def find_max(lst: list) -> float:
    # TODO: find largest value without max()
    pass

def value_range(lst: list) -> float:
    # TODO: return find_max - find_min
    pass

print(find_min([3, 1, 4, 1, 5]))  # Expected: 1
print(find_max([3, 1, 4, 1, 5]))  # Expected: 5
print(value_range([3, 1, 4, 1, 5])) # Expected: 4`,
      hints: ["Start with smallest = lst[0], then loop and update if smaller.", "Call your own find_min and find_max inside value_range."],
      testCases: [
        { input: "find_min([3,1,4,1,5])", expectedOutput: "1", description: "Min of list" },
        { input: "find_max([3,1,4,1,5])", expectedOutput: "5", description: "Max of list" },
        { input: "value_range([3,1,4,1,5])", expectedOutput: "4", description: "Range = 5-1 = 4" },
      ],
    },
    {
      title: "Q3 — Celsius ↔ Fahrenheit",
      description: "Write `to_fahrenheit(c)` and `to_celsius(f)` converters. Also write `temperature_label(c)` returning 'Cold' (<10), 'Warm' (10-25), or 'Hot' (>25).",
      starterCode: `def to_fahrenheit(celsius: float) -> float:
    # TODO: formula: (c × 9/5) + 32
    pass

def to_celsius(fahrenheit: float) -> float:
    # TODO: formula: (f - 32) × 5/9
    pass

def temperature_label(celsius: float) -> str:
    # TODO: Cold / Warm / Hot
    pass

print(to_fahrenheit(0))      # Expected: 32.0
print(to_celsius(212))       # Expected: 100.0
print(temperature_label(5))  # Expected: Cold
print(temperature_label(20)) # Expected: Warm
print(temperature_label(35)) # Expected: Hot`,
      hints: ["to_fahrenheit: return (celsius * 9/5) + 32", "to_celsius: return (fahrenheit - 32) * 5/9", "Use if/elif/else for Cold/Warm/Hot"],
      testCases: [
        { input: "to_fahrenheit(0)", expectedOutput: "32.0", description: "0°C = 32°F" },
        { input: "to_celsius(212)", expectedOutput: "100.0", description: "212°F = 100°C" },
        { input: 'temperature_label(35)', expectedOutput: "Hot", description: "35°C = Hot" },
      ],
    },
  ],

  // ── PYTHON: Lists ──────────────────────────────────────────────────────────
  "python::Lists & Arrays": [
    {
      title: "Q1 — Slice, Filter & Sort",
      description: "Write `every_second(lst)` using slicing, `filter_evens(numbers)` using a list comprehension, and `sort_descending(lst)` without modifying the original.",
      starterCode: `def every_second(lst: list) -> list:
    # TODO: return every second element (slicing)
    pass

def filter_evens(numbers: list) -> list:
    # TODO: list comprehension — only even numbers
    pass

def sort_descending(lst: list) -> list:
    # TODO: sorted descending, don't modify original
    pass

print(every_second([1,2,3,4,5,6]))  # Expected: [1, 3, 5]
print(filter_evens([1,2,3,4,5,6]))  # Expected: [2, 4, 6]
print(sort_descending([3,1,4,1,5])) # Expected: [5, 4, 3, 1, 1]`,
      hints: ["Slice: lst[::2]", "Comprehension: [x for x in numbers if x % 2 == 0]", "sorted(lst, reverse=True)"],
      testCases: [
        { input: "every_second([1,2,3,4,5,6])", expectedOutput: "[1, 3, 5]", description: "Every second element" },
        { input: "filter_evens([1,2,3,4,5,6])", expectedOutput: "[2, 4, 6]", description: "Even numbers only" },
        { input: "sort_descending([3,1,4,1,5])", expectedOutput: "[5, 4, 3, 1, 1]", description: "Descending sort" },
      ],
    },
    {
      title: "Q2 — Flatten & Unique",
      description: "Write `flatten(nested)` that turns [[1,2],[3,4]] into [1,2,3,4], and `unique(lst)` that removes duplicates while preserving order.",
      starterCode: `def flatten(nested: list) -> list:
    result = []
    # TODO: loop through sublists and add each element
    pass

def unique(lst: list) -> list:
    result = []
    # TODO: add item only if not already in result
    pass

print(flatten([[1,2],[3,4],[5]]))       # Expected: [1, 2, 3, 4, 5]
print(unique([1, 2, 2, 3, 1, 4]))      # Expected: [1, 2, 3, 4]
print(unique(["a","b","a","c"]))        # Expected: ['a', 'b', 'c']`,
      hints: ["flatten: for sublist in nested: for item in sublist: result.append(item)", "unique: if item not in result: result.append(item)"],
      testCases: [
        { input: "flatten([[1,2],[3,4],[5]])", expectedOutput: "[1, 2, 3, 4, 5]", description: "Flatten nested list" },
        { input: "unique([1,2,2,3,1,4])", expectedOutput: "[1, 2, 3, 4]", description: "Remove duplicates" },
        { input: 'unique(["a","b","a"])', expectedOutput: "['a', 'b']", description: "Unique strings" },
      ],
    },
    {
      title: "Q3 — Rotate & Chunk",
      description: "Write `rotate_left(lst, n)` that rotates a list n positions to the left, and `chunk(lst, size)` that splits a list into sublists of given size.",
      starterCode: `def rotate_left(lst: list, n: int) -> list:
    # TODO: rotate list n positions to the left
    # [1,2,3,4,5] rotated 2 → [3,4,5,1,2]
    pass

def chunk(lst: list, size: int) -> list:
    # TODO: split into sublists of given size
    # [1,2,3,4,5] chunk 2 → [[1,2],[3,4],[5]]
    pass

print(rotate_left([1,2,3,4,5], 2))  # Expected: [3, 4, 5, 1, 2]
print(chunk([1,2,3,4,5], 2))        # Expected: [[1, 2], [3, 4], [5]]`,
      hints: ["rotate_left: use slicing — lst[n:] + lst[:n]", "chunk: use range(0, len(lst), size) and lst[i:i+size]"],
      testCases: [
        { input: "rotate_left([1,2,3,4,5], 2)", expectedOutput: "[3, 4, 5, 1, 2]", description: "Rotate 2 left" },
        { input: "chunk([1,2,3,4,5], 2)", expectedOutput: "[[1, 2], [3, 4], [5]]", description: "Chunk by 2" },
        { input: "rotate_left([1,2,3], 1)", expectedOutput: "[2, 3, 1]", description: "Rotate 1 left" },
      ],
    },
  ],

  // ── PYTHON: Dictionaries ───────────────────────────────────────────────────
  "python::Dictionaries": [
    {
      title: "Q1 — Word Counter & Score Merger",
      description: "Write `word_count(text)` counting word occurrences, and `merge_scores(d1, d2)` merging two dicts — adding values for shared keys.",
      starterCode: `def word_count(text: str) -> dict:
    counts = {}
    # TODO: split and count each word
    pass

def merge_scores(dict1: dict, dict2: dict) -> dict:
    result = dict1.copy()
    # TODO: add dict2 values (sum if key exists)
    pass

print(word_count("the cat sat on the mat"))
# Expected: {'the': 2, 'cat': 1, 'sat': 1, 'on': 1, 'mat': 1}
print(merge_scores({"alice": 10, "bob": 5}, {"bob": 3, "carol": 8}))
# Expected: {'alice': 10, 'bob': 8, 'carol': 8}`,
      hints: ["word_count: if word in counts: counts[word] += 1 else: counts[word] = 1", "merge_scores: result[k] = result.get(k, 0) + v"],
      testCases: [
        { input: 'word_count("the cat the")', expectedOutput: "{'the': 2, 'cat': 1}", description: "Count occurrences" },
        { input: 'merge_scores({"a":10},{"a":5,"b":3})', expectedOutput: "{'a': 15, 'b': 3}", description: "Shared keys add up" },
        { input: 'merge_scores({},{"x":1})', expectedOutput: "{'x': 1}", description: "Merge with empty" },
      ],
    },
    {
      title: "Q2 — Invert & Group",
      description: "Write `invert_dict(d)` that swaps keys and values, and `group_by_length(words)` that groups a list of words by their length.",
      starterCode: `def invert_dict(d: dict) -> dict:
    # TODO: swap keys and values
    pass

def group_by_length(words: list) -> dict:
    groups = {}
    # TODO: group words by len(word)
    pass

print(invert_dict({"a": 1, "b": 2, "c": 3}))
# Expected: {1: 'a', 2: 'b', 3: 'c'}
print(group_by_length(["hi", "hey", "hello", "ok", "bye"]))
# Expected: {2: ['hi', 'ok'], 3: ['hey', 'bye'], 5: ['hello']}`,
      hints: ["invert: {v: k for k, v in d.items()}", "group_by_length: if len(w) not in groups: groups[len(w)] = []  then append"],
      testCases: [
        { input: 'invert_dict({"a":1,"b":2})', expectedOutput: "{1: 'a', 2: 'b'}", description: "Keys become values" },
        { input: 'group_by_length(["hi","ok","hey"])', expectedOutput: "{2: ['hi', 'ok'], 3: ['hey']}", description: "Group by length" },
        { input: 'len(group_by_length(["a","bb","ccc"]))', expectedOutput: "3", description: "Three different lengths" },
      ],
    },
    {
      title: "Q3 — Most Frequent & Top N",
      description: "Write `most_frequent(lst)` returning the most common item, and `top_n(scores, n)` returning the top N keys from a scores dictionary.",
      starterCode: `def most_frequent(lst: list):
    # TODO: return the item that appears most often
    pass

def top_n(scores: dict, n: int) -> list:
    # TODO: return list of top n keys by value (highest first)
    pass

print(most_frequent([1,2,2,3,2,1,2]))   # Expected: 2
print(most_frequent(["a","b","a","c","a"]))  # Expected: a
print(top_n({"alice":95,"bob":72,"carol":88,"dave":65}, 2))
# Expected: ['alice', 'carol']`,
      hints: ["most_frequent: count occurrences in a dict, then find max by value.", "top_n: sorted(scores, key=lambda k: scores[k], reverse=True)[:n]"],
      testCases: [
        { input: "most_frequent([1,2,2,3,2])", expectedOutput: "2", description: "2 appears most" },
        { input: 'top_n({"a":95,"b":72,"c":88}, 2)', expectedOutput: "['a', 'c']", description: "Top 2 scorers" },
        { input: 'len(top_n({"a":1,"b":2,"c":3,"d":4}, 3))', expectedOutput: "3", description: "Returns exactly n items" },
      ],
    },
  ],

  // ── PYTHON: Classes ────────────────────────────────────────────────────────
  "python::Classes & OOP": [
    {
      title: "Q1 — Bank Account",
      description: "Build a `BankAccount` class with `deposit(amount)`, `withdraw(amount)` (raises ValueError if insufficient), and `__str__` returning 'Owner: $balance'.",
      starterCode: `class BankAccount:
    def __init__(self, owner: str, balance: float = 0):
        # TODO: store owner and balance
        pass

    def deposit(self, amount: float):
        # TODO: add to balance
        pass

    def withdraw(self, amount: float):
        # TODO: subtract, raise ValueError if insufficient
        pass

    def __str__(self):
        # TODO: "Alice: $150.00"
        pass

acc = BankAccount("Alice", 100)
acc.deposit(50)
print(acc)          # Expected: Alice: $150.00
acc.withdraw(30)
print(acc)          # Expected: Alice: $120.00`,
      hints: ["self.owner = owner, self.balance = balance", "raise ValueError('Insufficient funds') if amount > self.balance", "__str__: return f'{self.owner}: ${self.balance:.2f}'"],
      testCases: [
        { input: "BankAccount('A',100); acc.deposit(50); str(acc)", expectedOutput: "A: $150.00", description: "Deposit works" },
        { input: "BankAccount('B',200); acc.withdraw(50); str(acc)", expectedOutput: "B: $150.00", description: "Withdraw works" },
        { input: "BankAccount('C',10); acc.withdraw(100)", expectedOutput: "ValueError", description: "Overdraft raises error" },
      ],
    },
    {
      title: "Q2 — Student Grade Tracker",
      description: "Build a `Student` class that stores a name and a list of grades. Add methods `add_grade(g)`, `average()` returning the mean, and `highest()` returning the best grade.",
      starterCode: `class Student:
    def __init__(self, name: str):
        # TODO: store name, start with empty grades list
        pass

    def add_grade(self, grade: float):
        # TODO: append to grades list
        pass

    def average(self) -> float:
        # TODO: return mean of grades (0 if no grades)
        pass

    def highest(self) -> float:
        # TODO: return the highest grade
        pass

s = Student("Alice")
s.add_grade(85)
s.add_grade(92)
s.add_grade(78)
print(s.average())   # Expected: 85.0
print(s.highest())   # Expected: 92`,
      hints: ["self.grades = [] in __init__", "average: sum(self.grades) / len(self.grades)", "highest: max(self.grades)"],
      testCases: [
        { input: "s=Student('A'); s.add_grade(85); s.add_grade(95); s.average()", expectedOutput: "90.0", description: "Average of 85 and 95" },
        { input: "s=Student('A'); s.add_grade(70); s.add_grade(90); s.highest()", expectedOutput: "90", description: "Highest grade" },
        { input: "s=Student('A'); s.average()", expectedOutput: "0", description: "Empty grades = 0" },
      ],
    },
    {
      title: "Q3 — Shape Area Calculator",
      description: "Create a base `Shape` class and two subclasses: `Circle(radius)` with `area()` = π×r², and `Rectangle(w,h)` with `area()` = w×h. Both should have a `describe()` method.",
      starterCode: `import math

class Shape:
    def area(self) -> float:
        # TODO: return 0 (base implementation)
        pass

    def describe(self) -> str:
        # TODO: return "Shape with area X.XX"
        pass

class Circle(Shape):
    def __init__(self, radius: float):
        # TODO: store radius
        pass

    def area(self) -> float:
        # TODO: π × r²
        pass

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        # TODO: store width and height
        pass

    def area(self) -> float:
        # TODO: width × height
        pass

c = Circle(5)
r = Rectangle(4, 6)
print(round(c.area(), 2))   # Expected: 78.54
print(r.area())              # Expected: 24`,
      hints: ["Circle area: math.pi * self.radius ** 2", "describe: return f'Shape with area {self.area():.2f}'", "Circle and Rectangle inherit from Shape"],
      testCases: [
        { input: "round(Circle(5).area(), 2)", expectedOutput: "78.54", description: "Circle area" },
        { input: "Rectangle(4,6).area()", expectedOutput: "24", description: "Rectangle area" },
        { input: "Rectangle(3,3).area()", expectedOutput: "9", description: "Square area" },
      ],
    },
  ],

  // ── PYTHON: Error Handling ─────────────────────────────────────────────────
  "python::Error Handling": [
    {
      title: "Q1 — Safe Division & Parser",
      description: "Write `safe_divide(a, b)` returning None on division by zero, and `parse_int(s)` returning None if string isn't a valid integer.",
      starterCode: `def safe_divide(a: float, b: float):
    # TODO: return a/b or None if b == 0
    pass

def parse_int(s: str):
    # TODO: return int(s) or None if invalid
    pass

print(safe_divide(10, 2))   # Expected: 5.0
print(safe_divide(10, 0))   # Expected: None
print(parse_int("42"))      # Expected: 42
print(parse_int("abc"))     # Expected: None`,
      hints: ["try/except ZeroDivisionError for safe_divide", "try/except ValueError for parse_int"],
      testCases: [
        { input: "safe_divide(10, 2)", expectedOutput: "5.0", description: "Normal division" },
        { input: "safe_divide(10, 0)", expectedOutput: "None", description: "Zero returns None" },
        { input: 'parse_int("abc")', expectedOutput: "None", description: "Invalid string = None" },
      ],
    },
    {
      title: "Q2 — File Reader & Validator",
      description: "Write `read_first_line(filename)` returning the first line or an error message string, and `validate_age(age)` raising ValueError for ages outside 0-150.",
      starterCode: `def read_first_line(filename: str) -> str:
    # TODO: try to open and read first line
    # If FileNotFoundError: return "File not found"
    pass

def validate_age(age: int) -> int:
    # TODO: raise ValueError if age < 0 or age > 150
    # Otherwise return the age
    pass

print(read_first_line("nonexistent.txt"))  # Expected: File not found
print(validate_age(25))                    # Expected: 25
try:
    validate_age(200)
except ValueError as e:
    print(e)                               # Expected: Invalid age`,
      hints: ["try: with open(filename) as f: return f.readline().strip()", "except FileNotFoundError: return 'File not found'", "if age < 0 or age > 150: raise ValueError('Invalid age')"],
      testCases: [
        { input: 'read_first_line("missing.txt")', expectedOutput: "File not found", description: "Missing file handled" },
        { input: "validate_age(25)", expectedOutput: "25", description: "Valid age returned" },
        { input: "validate_age(-1)", expectedOutput: "ValueError", description: "Negative age raises error" },
      ],
    },
    {
      title: "Q3 — JSON Parser & Type Checker",
      description: "Write `safe_json_parse(text)` returning parsed JSON or None on failure, and `safe_get(d, key, default)` returning a dict value safely or the default.",
      starterCode: `import json

def safe_json_parse(text: str):
    # TODO: parse JSON string, return None if invalid
    pass

def safe_get(d: dict, key: str, default=None):
    # TODO: return d[key] if exists, else default
    # Should NOT raise KeyError
    pass

print(safe_json_parse('{"name": "Alice"}'))  # Expected: {'name': 'Alice'}
print(safe_json_parse("invalid json"))        # Expected: None
print(safe_get({"a": 1}, "a", 0))            # Expected: 1
print(safe_get({"a": 1}, "b", 99))           # Expected: 99`,
      hints: ["try: return json.loads(text) except json.JSONDecodeError: return None", "safe_get: return d.get(key, default)"],
      testCases: [
        { input: 'safe_json_parse(\'{"x":1}\')', expectedOutput: "{'x': 1}", description: "Valid JSON parsed" },
        { input: 'safe_json_parse("bad")', expectedOutput: "None", description: "Invalid JSON = None" },
        { input: 'safe_get({"a":1},"b",99)', expectedOutput: "99", description: "Missing key = default" },
      ],
    },
  ],

  // ── JAVASCRIPT: Functions ──────────────────────────────────────────────────
  "javascript::Functions & Arrow Functions": [
    {
      title: "Q1 — Square & Higher-Order",
      description: "Write regular `square(n)`, arrow function `isEven`, and `applyToAll(arr, fn)` applying a function to every element (no .map()).",
      starterCode: `function square(n) {
  // TODO: return n squared
}

const isEven = (n) => {
  // TODO: return true if n is even
}

function applyToAll(arr, fn) {
  // TODO: apply fn to each element, return new array
}

console.log(square(5));                    // Expected: 25
console.log(isEven(4));                    // Expected: true
console.log(applyToAll([1,2,3], square));  // Expected: [1, 4, 9]`,
      hints: ["return n * n", "return n % 2 === 0", "for loop + push fn(element)"],
      testCases: [
        { input: "square(5)", expectedOutput: "25", description: "5² = 25" },
        { input: "isEven(4)", expectedOutput: "true", description: "4 is even" },
        { input: "JSON.stringify(applyToAll([1,2,3],square))", expectedOutput: "[1,4,9]", description: "Apply square to all" },
      ],
    },
    {
      title: "Q2 — Memoization",
      description: "Write a `memoize(fn)` function that takes any function and returns a cached version — if called with the same argument again, it returns the stored result instead of recalculating.",
      starterCode: `function memoize(fn) {
  const cache = {};
  // TODO: return a new function that:
  // - checks if result is in cache
  // - if yes, return cached result
  // - if no, calculate, store in cache, return result
}

const slowSquare = (n) => n * n;
const fastSquare = memoize(slowSquare);

console.log(fastSquare(5));   // Expected: 25
console.log(fastSquare(5));   // Expected: 25 (from cache)
console.log(fastSquare(10));  // Expected: 100`,
      hints: ["return function(arg) { ... }", "if (arg in cache) return cache[arg]", "cache[arg] = fn(arg); return cache[arg]"],
      testCases: [
        { input: "memoize(x=>x*x)(5)", expectedOutput: "25", description: "Returns correct result" },
        { input: "memoize(x=>x*2)(7)", expectedOutput: "14", description: "Works for any function" },
        { input: "const m=memoize(x=>x+1); m(3); m(3); m(3); m(3)", expectedOutput: "4", description: "Cache returns same value" },
      ],
    },
    {
      title: "Q3 — Curry Function",
      description: "Write `add(a)` that returns a function taking `b`, which returns a function taking `c`, returning a+b+c. This is called currying.",
      starterCode: `function add(a) {
  // TODO: return a function that takes b
  // which returns a function that takes c
  // which returns a + b + c
}

console.log(add(1)(2)(3));    // Expected: 6
console.log(add(10)(20)(30)); // Expected: 60
const add5 = add(5);
const add5and3 = add5(3);
console.log(add5and3(2));     // Expected: 10`,
      hints: ["return (b) => (c) => a + b + c", "Arrow functions can be chained like this!", "add5 is a partially applied function"],
      testCases: [
        { input: "add(1)(2)(3)", expectedOutput: "6", description: "1+2+3 = 6" },
        { input: "add(10)(20)(30)", expectedOutput: "60", description: "10+20+30 = 60" },
        { input: "add(5)(3)(2)", expectedOutput: "10", description: "5+3+2 = 10" },
      ],
    },
  ],

  // ── JAVASCRIPT: Arrays ────────────────────────────────────────────────────
  "javascript::Arrays & Methods": [
    {
      title: "Q1 — Filter, Map & Find",
      description: "Use filter, map, reduce and find on a students array to answer data questions.",
      starterCode: `const students = [
  { name: "Alice", grade: 88 },
  { name: "Bob",   grade: 72 },
  { name: "Carol", grade: 95 },
  { name: "Dave",  grade: 65 },
];

const topStudents = students.filter(/* grade >= 80 */);
const names = students.map(/* just names */);
const avgGrade = students.reduce(/* sum grades */, 0) / students.length;
const topStudent = students.find(/* grade > 90 */);

console.log(topStudents.length);  // Expected: 2
console.log(names.length);        // Expected: 4
console.log(avgGrade);            // Expected: 80
console.log(topStudent.name);     // Expected: Carol`,
      hints: ["filter: s => s.grade >= 80", "map: s => s.name", "reduce: (total, s) => total + s.grade"],
      testCases: [
        { input: "topStudents.length", expectedOutput: "2", description: "2 students above 80" },
        { input: "avgGrade", expectedOutput: "80", description: "Average = 80" },
        { input: "topStudent.name", expectedOutput: "Carol", description: "Carol > 90" },
      ],
    },
    {
      title: "Q2 — Group & Count",
      description: "Write `groupBy(arr, key)` that groups an array of objects by a given property, and `countBy(arr, key)` that counts how many items share each value.",
      starterCode: `function groupBy(arr, key) {
  // TODO: group objects by arr[key] value
  // Return { value: [items...], ... }
}

function countBy(arr, key) {
  // TODO: count how many items have each key value
  // Return { value: count, ... }
}

const people = [
  {name:"Alice", dept:"Engineering"},
  {name:"Bob",   dept:"Marketing"},
  {name:"Carol", dept:"Engineering"},
  {name:"Dave",  dept:"Marketing"},
  {name:"Eve",   dept:"Engineering"},
];

console.log(countBy(people, "dept"));
// Expected: { Engineering: 3, Marketing: 2 }`,
      hints: ["groupBy: if (!result[item[key]]) result[item[key]] = []; result[item[key]].push(item)", "countBy: result[item[key]] = (result[item[key]] || 0) + 1"],
      testCases: [
        { input: 'countBy(people,"dept").Engineering', expectedOutput: "3", description: "3 in Engineering" },
        { input: 'countBy(people,"dept").Marketing', expectedOutput: "2", description: "2 in Marketing" },
        { input: 'Object.keys(groupBy(people,"dept")).length', expectedOutput: "2", description: "2 departments" },
      ],
    },
    {
      title: "Q3 — Flatten & Zip",
      description: "Write `flatDeep(arr)` that fully flattens a nested array, and `zip(a, b)` that pairs elements from two arrays like Python's zip().",
      starterCode: `function flatDeep(arr) {
  // TODO: flatten any depth of nesting
  // [[1,[2]],3] → [1, 2, 3]
}

function zip(a, b) {
  // TODO: pair elements: zip([1,2],[3,4]) → [[1,3],[2,4]]
  // Stop at shorter array length
}

console.log(flatDeep([1,[2,[3,[4]]],5]));  // Expected: [1,2,3,4,5]
console.log(zip([1,2,3],["a","b","c"]));   // Expected: [[1,'a'],[2,'b'],[3,'c']]`,
      hints: ["flatDeep: arr.flat(Infinity) or use reduce with concat and recursive call", "zip: use Array.from({length: Math.min(a.length,b.length)}, (_,i) => [a[i],b[i]])"],
      testCases: [
        { input: "JSON.stringify(flatDeep([1,[2,[3]]]))", expectedOutput: "[1,2,3]", description: "Deep flatten" },
        { input: "JSON.stringify(zip([1,2],['a','b']))", expectedOutput: '[[1,"a"],[2,"b"]]', description: "Zip two arrays" },
        { input: "JSON.stringify(zip([1,2,3],[4,5]))", expectedOutput: "[[1,4],[2,5]]", description: "Stops at shorter" },
      ],
    },
  ],

  // ── JAVA: Enums ────────────────────────────────────────────────────────────
  "java::Enums": [
    {
      title: "Q1 — Day Type",
      description: "Create a `Day` enum with all 7 days and `dayType(Day d)` returning 'Weekday' or 'Weekend'.",
      starterCode: `enum Day {
    // TODO: MONDAY through SUNDAY
}

public class Main {
    public static String dayType(Day day) {
        // TODO: SATURDAY/SUNDAY = Weekend, rest = Weekday
        return "";
    }

    public static void main(String[] args) {
        System.out.println(dayType(Day.MONDAY));    // Weekday
        System.out.println(dayType(Day.SATURDAY));  // Weekend
        System.out.println(Day.FRIDAY.name());      // FRIDAY
    }
}`,
      hints: ["enum Day { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }", "switch statement or if day == Day.SATURDAY || day == Day.SUNDAY"],
      testCases: [
        { input: "dayType(Day.MONDAY)", expectedOutput: "Weekday", description: "Monday is weekday" },
        { input: "dayType(Day.SATURDAY)", expectedOutput: "Weekend", description: "Saturday is weekend" },
        { input: "Day.FRIDAY.name()", expectedOutput: "FRIDAY", description: "Enum name()" },
      ],
    },
    {
      title: "Q2 — Season Temperatures",
      description: "Create a `Season` enum with SPRING, SUMMER, FALL, WINTER. Add a method `typicalTemp()` returning typical Celsius temperatures (Spring:15, Summer:30, Fall:10, Winter:-5).",
      starterCode: `enum Season {
    // TODO: SPRING, SUMMER, FALL, WINTER with typicalTemp() method
    ;
    public int typicalTemp() {
        // TODO: return typical temperature for each season
        return 0;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(Season.SUMMER.typicalTemp());  // 30
        System.out.println(Season.WINTER.typicalTemp());  // -5
        System.out.println(Season.SPRING.name());         // SPRING
    }
}`,
      hints: ["Each enum constant can have different behavior: SPRING { public int typicalTemp() { return 15; } }", "Or use a switch statement inside typicalTemp()"],
      testCases: [
        { input: "Season.SUMMER.typicalTemp()", expectedOutput: "30", description: "Summer = 30°C" },
        { input: "Season.WINTER.typicalTemp()", expectedOutput: "-5", description: "Winter = -5°C" },
        { input: "Season.SPRING.name()", expectedOutput: "SPRING", description: "Enum name" },
      ],
    },
    {
      title: "Q3 — Planet Gravity",
      description: "Create a `Planet` enum with MERCURY, VENUS, EARTH, MARS. Each has a gravity field (MERCURY=3.7, VENUS=8.87, EARTH=9.81, MARS=3.72). Add `weight(mass)` returning mass × gravity.",
      starterCode: `enum Planet {
    // TODO: MERCURY(3.7), VENUS(8.87), EARTH(9.81), MARS(3.72)
    ;
    private final double gravity;

    Planet(double gravity) {
        this.gravity = gravity;
    }

    public double weight(double mass) {
        // TODO: return mass * gravity
        return 0;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(Planet.EARTH.weight(70));   // 686.7
        System.out.println(Planet.MARS.weight(70));    // 260.4
    }
}`,
      hints: ["Enum with fields: EARTH(9.81) { ... } then constructor Planet(double gravity)", "weight: return mass * this.gravity"],
      testCases: [
        { input: "Planet.EARTH.weight(70)", expectedOutput: "686.7", description: "Weight on Earth" },
        { input: "Planet.MARS.weight(70)", expectedOutput: "260.4", description: "Weight on Mars" },
        { input: "Planet.MERCURY.gravity", expectedOutput: "3.7", description: "Mercury gravity field" },
      ],
    },
  ],

  // ── HTML/CSS ───────────────────────────────────────────────────────────────
  "html-css::Flexbox": [
    {
      title: "Q1 — Navbar",
      description: "Style .navbar: logo left, links right, vertically centered. Use display:flex, justify-content:space-between, align-items:center.",
      starterCode: `<!DOCTYPE html>
<html><head><style>
  .navbar {
    /* TODO: flexbox — logo left, links right, centered */
    background: #1a7a5e;
    padding: 16px 24px;
  }
  .logo { color: white; font-weight: bold; font-size: 20px; }
  .nav-links a { color: white; text-decoration: none; margin-left: 20px; }
</style></head>
<body>
  <nav class="navbar">
    <div class="logo">Memora</div>
    <div class="nav-links">
      <a href="#">Home</a><a href="#">Learn</a>
    </div>
  </nav>
</body></html>`,
      hints: ["display: flex", "justify-content: space-between", "align-items: center"],
      testCases: [
        { input: ".navbar has display:flex", expectedOutput: "true", description: "Uses flexbox" },
        { input: ".navbar has justify-content:space-between", expectedOutput: "true", description: "Logo left, links right" },
        { input: ".navbar has align-items:center", expectedOutput: "true", description: "Vertically centered" },
      ],
    },
    {
      title: "Q2 — Card Grid",
      description: "Make .card-grid display 3 cards per row with equal spacing. Use flexbox with flex-wrap and give each .card a width of ~30%.",
      starterCode: `<!DOCTYPE html>
<html><head><style>
  .card-grid {
    /* TODO: flex, wrap, gap between cards */
  }
  .card {
    /* TODO: ~30% width, some padding and border */
    background: white;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #eee;
  }
</style></head>
<body>
  <div class="card-grid">
    <div class="card">Card 1</div>
    <div class="card">Card 2</div>
    <div class="card">Card 3</div>
    <div class="card">Card 4</div>
  </div>
</body></html>`,
      hints: ["display: flex; flex-wrap: wrap; gap: 16px", "Each card: width: calc(33.33% - 16px) or just width: 30%"],
      testCases: [
        { input: ".card-grid has display:flex", expectedOutput: "true", description: "Uses flexbox" },
        { input: ".card-grid has flex-wrap:wrap", expectedOutput: "true", description: "Cards wrap to next row" },
        { input: ".card has a width set", expectedOutput: "true", description: "Cards have defined width" },
      ],
    },
    {
      title: "Q3 — Centered Hero",
      description: "Make .hero a full viewport height section with its content perfectly centered both horizontally and vertically using flexbox.",
      starterCode: `<!DOCTYPE html>
<html><head><style>
  body { margin: 0; }
  .hero {
    /* TODO: full height, center content both ways */
    background: #1a7a5e;
    color: white;
  }
  .hero-content {
    text-align: center;
  }
</style></head>
<body>
  <div class="hero">
    <div class="hero-content">
      <h1>Welcome to Memora</h1>
      <p>Learn smarter, not harder</p>
    </div>
  </div>
</body></html>`,
      hints: ["display: flex; height: 100vh", "justify-content: center (horizontal)", "align-items: center (vertical)"],
      testCases: [
        { input: ".hero has height:100vh", expectedOutput: "true", description: "Full viewport height" },
        { input: ".hero has display:flex", expectedOutput: "true", description: "Uses flexbox" },
        { input: ".hero has justify-content:center", expectedOutput: "true", description: "Horizontally centered" },
      ],
    },
  ],
};

function pickExercise(langId: string, concept: Concept): Exercise {
  const key = `${langId}::${concept.name}`;
  const questions = QUESTION_BANK[key];

  if (questions && questions.length > 0) {
    // Pick a random question from the bank
    const random = questions[Math.floor(Math.random() * questions.length)];
    return { ...random, concept: concept.name };
  }

  // Generic fallback for concepts without specific questions
  return {
    title: `${concept.name} Challenge`,
    concept: concept.name,
    description: `Practice your understanding of ${concept.name}. Implement the function(s) and make all test cases pass.`,
    starterCode: langId === "python"
      ? `# ${concept.name}\n\ndef solve(value):\n    # TODO: implement\n    pass\n\nprint(solve(1))   # Test 1\nprint(solve(5))   # Test 2\nprint(solve(10))  # Test 3`
      : `// ${concept.name}\n\nfunction solve(value) {\n  // TODO: implement\n}\n\nconsole.log(solve(1));\nconsole.log(solve(5));`,
    hints: [`Think about the core idea of ${concept.name}.`, "Break it into smaller steps first."],
    testCases: [
      { input: "solve(1)", expectedOutput: "1", description: "Basic test" },
      { input: "solve(5)", expectedOutput: "5", description: "Another test" },
      { input: "solve(10)", expectedOutput: "10", description: "Larger input" },
    ],
  };
}
// 🔌 PISTON API — Real Code Execution
// Replace simulateCheck() body with:
//
//   const testRunner = challenge.testCases.map((tc, i) =>
//     `\nresult_${i} = ${tc.input}\nprint(f"TEST_${i}:{result_${i}}")`
//   ).join("");
//   const res = await fetch("https://emkc.org/api/v2/piston/execute", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ language: "python", version: "3.10",
//       files: [{ content: code + testRunner }] })
//   });
//   const data = await res.json();
//   // parse data.run.output lines for TEST_0, TEST_1 etc
//
// ─────────────────────────────────────────────────────────────────────────────
async function simulateCheck(code: string, exercise: Exercise): Promise<CheckResult> {
  await new Promise((r) => setTimeout(r, 1000));

  const hasTodo = code.includes("# TODO") || code.includes("// TODO");
  const hasPass = /^\s*pass\s*$/m.test(code);
  const hasReturn = code.includes("return") || code.includes("console.log");

  const results: TestResult[] = exercise.testCases.map((tc, i) => {
    let passed = false;
    let got = "None (not implemented)";

    if (!hasTodo && !hasPass && hasReturn) {
      const lines = code.split("\n").length;
      const hasLogic = code.includes("+") || code.includes("*") || code.includes("if") ||
        code.includes("for") || code.includes("while") || code.includes("Enum") ||
        code.includes("filter") || code.includes("map") || code.includes("self.");

      if (hasLogic) {
        passed = i === 0 ? true : lines > 8 ? Math.random() > 0.25 : Math.random() > 0.55;
        got = passed ? tc.expectedOutput : `Wrong output`;
      } else {
        got = "Function runs but returns wrong value";
      }
    }
    return { description: tc.description, passed, expected: tc.expectedOutput, got };
  });

  const passedCount = results.filter((r) => r.passed).length;
  return { passed: passedCount, total: exercise.testCases.length, score: Math.round((passedCount / exercise.testCases.length) * 100), results };
}

// ─── Save result → quiz history + update topic memory score ──────────────────
function saveToRetention(exercise: Exercise, result: CheckResult): void {
  if (!exercise.topicId || !exercise.conceptId) return;
  try {
    quizHistoryStorage.saveAttempt({
      id: `classroom_${Date.now()}`,
      topicId: exercise.topicId,
      type: "concept",
      targetConceptId: exercise.conceptId,
      score: result.score,
      correctCount: result.passed,
      totalCount: result.total,
      completedAt: new Date().toISOString(),
      questions: exercise.testCases.map((tc, i) => ({
        questionId: `tc_${i}`,
        conceptId: exercise.conceptId!,
        conceptName: exercise.concept,
        isCorrect: result.results[i]?.passed ?? false,
        userAnswer: result.results[i]?.got ?? "",
        correctAnswer: tc.expectedOutput,
      })),
      conceptBreakdown: [{
        conceptId: exercise.conceptId,
        conceptName: exercise.concept,
        correctCount: result.passed,
        totalCount: result.total,
        score: result.score,
      }],
    });

    const topics = storage.getTopics();
    const topic = topics.find((t) => t.id === exercise.topicId);
    if (topic) {
      const newMemory = Math.round(topic.memoryScore * 0.7 + result.score * 0.3);
      storage.updateTopic({ ...topic, memoryScore: newMemory, lastPracticed: new Date(), totalAttempts: topic.totalAttempts + 1 });
    }
  } catch (e) {
    console.error("Failed to save retention result:", e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔌 GITHUB MODELS API — AI Tutor
// Replace getMockResponse() body with real fetch to:
//   POST https://models.inference.ai.azure.com/chat/completions
//   Authorization: Bearer ${githubToken}
//   model: "gpt-4o"
// ─────────────────────────────────────────────────────────────────────────────
async function getMockResponse(messages: Message[], exercise: Exercise, code: string, result: CheckResult | null): Promise<string> {
  await new Promise((r) => setTimeout(r, 1100));
  const last = messages[messages.length - 1]?.content?.toLowerCase() ?? "";
  const hasTodo = code.includes("# TODO") || code.includes("// TODO");

  if (result) {
    if (result.score === 100) return `🎉 Perfect! All ${result.total}/${result.total} test cases passed!\n\n${exercise.topicId ? "Your result has been saved to the Cockpit — your memory score just went up! 📈" : "Great understanding of " + exercise.concept + "!"}\n\nWant to try the next concept?`;
    if (result.score >= 66) return `Good work — ${result.passed}/${result.total} tests passing!\n\nLook at the failing tests. What's different about those inputs? Usually it's one edge case you haven't handled.\n\n${exercise.topicId ? "Partial result saved to Cockpit." : ""}`;
    return `${result.passed}/${result.total} tests passed. Let's fix the failing ones.\n\nFocus on the FIRST failing test only — what does it expect vs what you're returning? Fix that one, then re-run. 🔧`;
  }
  if (last.includes("hint")) return `Here's a nudge:\n\nStart with the simplest possible solution — even if it only passes test 1. Then generalize it for the other cases.\n\n💡 ${exercise.hints[0]}`;
  if (last.includes("explain") || last.includes("concept")) return `**${exercise.concept}** — here's how to think about it:\n\nRead the description and identify:\n1. What goes INTO the function (inputs)\n2. What should come OUT (return value)\n\nThe test cases give you exact examples. Start with test case 1 only.`;
  if (hasTodo) return `I see there's still a \`# TODO\` — that's your starting point!\n\nTry replacing \`pass\` with just a return statement first, even if it's hardcoded. Then make it dynamic to pass all tests.`;
  return `Click **▶ Check** to run the test cases and I'll give you specific feedback on what's passing!\n\nThe results panel shows expected vs actual output for each test. 🎯`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diffColor: Record<string, string> = {
  Beginner: "bg-green-100 text-green-700",
  Intermediate: "bg-yellow-100 text-yellow-700",
  Advanced: "bg-red-100 text-red-700",
};
const scoreColor = (s: number) => s === 100 ? "text-green-500" : s >= 66 ? "text-yellow-500" : "text-red-500";
const scoreBorderBg = (s: number) => s === 100 ? "border-green-500/20 bg-green-900/10" : s >= 66 ? "border-yellow-500/20 bg-yellow-900/10" : "border-red-500/20 bg-red-900/10";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ClassroomPage() {
  const [step, setStep] = useState<"pick-language" | "pick-concept" | "exercise">("pick-language");
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [code, setCode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [savedToRetention, setSavedToRetention] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSelectLanguage = (lang: Language) => { setSelectedLanguage(lang); setStep("pick-concept"); };

  const handleSelectConcept = (concept: Concept) => {
    if (!selectedLanguage) return;
    const ex = pickExercise(selectedLanguage.id, concept);

    // Try to link to a matching user topic for retention saving
    try {
      const topics = storage.getTopics();
      const langName = selectedLanguage.name.toLowerCase();
      const matchingTopic = topics.find(t => t.name.toLowerCase().includes(langName));
      if (matchingTopic) {
        const matchingConcept = matchingTopic.concepts.find(c =>
          c.text.toLowerCase().includes(concept.name.toLowerCase().split(" ")[0])
        );
        ex.topicId = matchingTopic.id;
        ex.topicName = matchingTopic.name;
        ex.conceptId = matchingConcept?.id ?? matchingTopic.concepts[0]?.id;
      }
    } catch {}

    setSelectedConcept(concept);
    setExercise(ex);
    setCode(ex.starterCode);
    setMessages([]);
    setResult(null);
    setSavedToRetention(false);
    setShowHint(false);
    setHintIndex(0);
    setStep("exercise");
  };

  const handleCheck = async () => {
    if (!exercise || isChecking) return;
    setIsChecking(true);
    setResult(null);
    const res = await simulateCheck(code, exercise);
    setResult(res);

    // Save to retention if linked to a topic
    if (exercise.topicId) {
      saveToRetention(exercise, res);
      setSavedToRetention(true);
    }

    // Auto message tutor with results
    const newMsgs: Message[] = [...messages, { role: "user", content: `I ran my code — got ${res.passed}/${res.total} tests passing (${res.score}%).` }];
    setMessages(newMsgs);
    setIsLoading(true);
    const reply = await getMockResponse(newMsgs, exercise, code, res);
    setMessages([...newMsgs, { role: "assistant", content: reply }]);
    setIsLoading(false);
    setIsChecking(false);
  };

  const handleSend = async (override?: string) => {
    const msg = override || input.trim();
    if (!msg || isLoading || !exercise) return;
    const newMsgs: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMsgs);
    setInput("");
    setIsLoading(true);
    const reply = await getMockResponse(newMsgs, exercise, code, result);
    setMessages([...newMsgs, { role: "assistant", content: reply }]);
    setIsLoading(false);
  };

  // ── Step 1: Language picker ────────────────────────────────────────────────
  if (step === "pick-language") return (
    <div className="min-h-screen bg-background">
      <div className="bg-background border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🎓</span>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-none">Classroom</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Practice coding concepts hands-on</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-2">What do you want to practice?</h2>
        <p className="text-muted-foreground text-sm mb-10">Pick a programming language to get started</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {LANGUAGES.map((lang) => (
            <button key={lang.id} onClick={() => handleSelectLanguage(lang)}
              className="bg-card border-2 border-border hover:border-primary rounded-2xl p-6 flex flex-col items-center gap-3 transition-all hover:shadow-md group">
              <span className="text-4xl">{lang.emoji}</span>
              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{lang.name}</span>
              <span className="text-xs text-muted-foreground">{lang.concepts.length} concepts</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Step 2: Concept picker ─────────────────────────────────────────────────
  if (step === "pick-concept" && selectedLanguage) {
    const grouped = {
      Beginner: selectedLanguage.concepts.filter(c => c.difficulty === "Beginner"),
      Intermediate: selectedLanguage.concepts.filter(c => c.difficulty === "Intermediate"),
      Advanced: selectedLanguage.concepts.filter(c => c.difficulty === "Advanced"),
    };
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-background border-b px-6 py-4 flex items-center gap-4">
          <button onClick={() => setStep("pick-language")} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedLanguage.emoji}</span>
            <h1 className="font-bold text-foreground text-lg">{selectedLanguage.name}</h1>
          </div>
        </div>
        <div className="flex-1 px-6 py-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-1">Pick a concept to practice</h2>
          <p className="text-muted-foreground text-sm mb-8">Write real code, check against test cases, earn retention score</p>
          {(["Beginner", "Intermediate", "Advanced"] as const).map((level) =>
            grouped[level].length > 0 ? (
              <div key={level} className="mb-6">
                <span className={`text-xs font-bold uppercase tracking-widest mb-3 px-2 py-1 rounded-full inline-block ${diffColor[level]}`}>{level}</span>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {grouped[level].map((concept) => (
                    <button key={concept.name} onClick={() => handleSelectConcept(concept)}
                      className="bg-card border border-border hover:border-primary rounded-xl px-5 py-4 flex items-center gap-4 text-left transition-all hover:shadow-sm group">
                      <span className="text-2xl">{concept.emoji}</span>
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors flex-1">{concept.name}</span>
                      <span className="text-muted-foreground group-hover:text-primary">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      </div>
    );
  }

  // ── Step 3: Exercise (Canvas layout) ──────────────────────────────────────
  if (step === "exercise" && exercise && selectedLanguage && selectedConcept) return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b px-6 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => { setStep("pick-concept"); setResult(null); }} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
        <span>{selectedLanguage.emoji}</span>
        <span className="text-muted-foreground text-sm">{selectedLanguage.name}</span>
        <span className="text-muted-foreground">›</span>
        <span className="font-semibold text-foreground text-sm">{selectedConcept.emoji} {selectedConcept.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor[selectedConcept.difficulty]}`}>{selectedConcept.difficulty}</span>

        <div className="ml-auto flex items-center gap-2">
          {savedToRetention ? (
            <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
              ✅ Saved to Cockpit retention score
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              ⚡ Demo — GitHub Models API pending
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Code Editor ── */}
        <div className="flex flex-col w-1/2 border-r border-border bg-[#1e1e2e]">
          {/* Description */}
          <div className="px-4 py-3 bg-primary/20 border-b border-white/10 shrink-0">
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Challenge</p>
            <p className="text-white/80 text-xs leading-relaxed">{exercise.description}</p>
          </div>

          {/* Code textarea */}
          <div className="flex-1 overflow-auto">
            <textarea value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false}
              className="w-full h-full min-h-full bg-transparent text-[#cdd6f4] font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed"
              style={{ fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }} />
          </div>

          {/* Test results */}
          {result && (
            <div className={`border-t px-4 py-3 max-h-48 overflow-y-auto shrink-0 ${scoreBorderBg(result.score)}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Test Results</p>
                <span className={`text-sm font-bold ${scoreColor(result.score)}`}>{result.passed}/{result.total} passed · {result.score}%</span>
              </div>
              <div className="space-y-1.5">
                {result.results.map((r, i) => (
                  <div key={i} className={`rounded-lg px-3 py-2 text-xs ${r.passed ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                    <div className="flex items-center gap-2">
                      <span>{r.passed ? "✅" : "❌"}</span>
                      <span className="font-medium text-white/80">{r.description}</span>
                    </div>
                    {!r.passed && (
                      <div className="mt-1 pl-6 font-mono space-y-0.5">
                        <p className="text-green-400">Expected: {r.expected}</p>
                        <p className="text-red-400">Got: {r.got}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-[#181825] shrink-0">
            <button onClick={handleCheck} disabled={isChecking}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white text-xs font-semibold px-5 py-2 rounded-lg transition-colors">
              {isChecking ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Checking...</> : "▶ Check"}
            </button>
            <button onClick={() => { setShowHint(true); setHintIndex(p => Math.min(p + 1, exercise.hints.length - 1)); }}
              className="bg-white/10 hover:bg-white/20 text-white/70 text-xs px-3 py-2 rounded-lg transition-colors">
              💡 Hint {hintIndex + 1}/{exercise.hints.length}
            </button>
            <button onClick={() => { setCode(exercise.starterCode); setResult(null); setShowHint(false); setHintIndex(0); }}
              className="ml-auto text-white/30 hover:text-white/60 text-xs">Reset</button>
            {result !== null && result.score < 100 && (
              <button onClick={() => { if (selectedLanguage && selectedConcept) handleSelectConcept(selectedConcept); }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                🔄 New Question
              </button>
            )}
            {result?.score === 100 && (
              <button onClick={() => setStep("pick-concept")}
                className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                Next →
              </button>
            )}
          </div>

          {showHint && (
            <div className="px-4 py-2.5 bg-yellow-500/10 border-t border-yellow-500/20 shrink-0">
              <p className="text-yellow-300 text-xs">💡 <strong>Hint:</strong> {exercise.hints[hintIndex]}</p>
            </div>
          )}
        </div>

        {/* ── Right: AI Tutor ── */}
        <div className="flex flex-col w-1/2 bg-background">
          <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-base">🧠</div>
            <div>
              <p className="font-semibold text-foreground text-sm">Memora Tutor</p>
              <p className="text-xs text-muted-foreground">{savedToRetention ? "Result saved → Cockpit updated" : "Mock mode — GitHub Models API pending"}</p>
            </div>
            <div className={`ml-auto w-2 h-2 rounded-full ${savedToRetention ? "bg-green-500" : "bg-yellow-400"}`} />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">👋</div>
                <p className="text-foreground text-sm font-medium">Ready to code?</p>
                <p className="text-muted-foreground text-xs mt-1 max-w-xs mx-auto">
                  Write your solution, click <strong className="text-primary">▶ Check</strong> to test against real test cases, and I'll give you feedback.
                </p>
                <div className="mt-5 flex flex-col gap-2 items-center">
                  {["What does this challenge want?", "Explain this concept", "Give me a hint"].map((q) => (
                    <button key={q} onClick={() => handleSend(q)}
                      className="text-xs text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/5 transition-colors">{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${msg.role === "user" ? "bg-primary text-white" : "bg-muted"}`}>
                  {msg.role === "user" ? "U" : "🧠"}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-white rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}
                  style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs">🧠</div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-4 py-4 border-t border-border shrink-0">
            <div className="flex gap-2 items-end bg-muted rounded-2xl border border-border px-4 py-3">
              <textarea value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask your tutor anything..." rows={1}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
                style={{ maxHeight: "120px" }} />
              <button onClick={() => handleSend()} disabled={!input.trim() || isLoading}
                className="bg-primary text-white rounded-xl w-8 h-8 flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}