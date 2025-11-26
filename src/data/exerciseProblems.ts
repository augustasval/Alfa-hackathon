import { Problem } from "@/types/exerciseTypes";

// Expanded topic-specific problem pools
export const problemsByTopic: Record<string, Problem[]> = {
  "9-polynomials": [
    // Easy problems
    {
      id: "poly1",
      question: "Simplify by combining like terms: $5x^2 + 3x - 2x^2 + 7x - 4$",
      answer: "3x^2 + 10x - 4",
      hint: "Group terms with the same power of x together.",
      difficulty: "easy",
      detailedSolution: [
        { step: "$5x^2 + 3x - 2x^2 + 7x - 4$", explanation: "Original expression with mixed terms" },
        { step: "$(5x^2 - 2x^2) + (3x + 7x) - 4$", explanation: "Group like terms: $x^2$ terms together, $x$ terms together" },
        { step: "$3x^2 + 10x - 4$", explanation: "Combine coefficients: $5-2=3$ for $x^2$, $3+7=10$ for $x$" },
      ],
    },
    {
      id: "poly2",
      question: "Expand: $(x + 4)(x + 3)$",
      answer: "x^2 + 7x + 12",
      hint: "Use FOIL: First, Outer, Inner, Last.",
      difficulty: "easy",
      detailedSolution: [
        { step: "$(x + 4)(x + 3)$", explanation: "Two binomials to multiply together" },
        { step: "$x \\cdot x + x \\cdot 3 + 4 \\cdot x + 4 \\cdot 3$", explanation: "Apply FOIL method" },
        { step: "$x^2 + 3x + 4x + 12$", explanation: "Perform each multiplication" },
        { step: "$x^2 + 7x + 12$", explanation: "Combine like terms: $3x + 4x = 7x$" },
      ],
    },
    {
      id: "poly3",
      question: "Simplify: $4x + 2x - 3x$",
      answer: "3x",
      hint: "All terms have the same variable, just add/subtract the coefficients.",
      difficulty: "easy",
      detailedSolution: [
        { step: "$4x + 2x - 3x$", explanation: "All terms are like terms (all have $x$)" },
        { step: "$(4 + 2 - 3)x$", explanation: "Factor out $x$ and combine coefficients" },
        { step: "$3x$", explanation: "$4 + 2 - 3 = 3$" },
      ],
    },
    // Medium problems
    {
      id: "poly4",
      question: "Calculate $(x - 2)^2$ using the special product formula",
      answer: "x^2 - 4x + 4",
      hint: "Use the pattern $(a - b)^2 = a^2 - 2ab + b^2$",
      difficulty: "medium",
      detailedSolution: [
        { step: "$(x - 2)^2$", explanation: "Square of a binomial" },
        { step: "Apply: $(a - b)^2 = a^2 - 2ab + b^2$ where $a=x, b=2$", explanation: "Use the special product formula" },
        { step: "$x^2 - 2(x)(2) + 2^2$", explanation: "Substitute values" },
        { step: "$x^2 - 4x + 4$", explanation: "Simplify to get final expanded form" },
      ],
    },
    {
      id: "poly5",
      question: "Add the polynomials: $(3x^2 - 2x + 1) + (x^2 + 5x - 3)$",
      answer: "4x^2 + 3x - 2",
      hint: "Combine terms with the same degree.",
      difficulty: "medium",
      detailedSolution: [
        { step: "$(3x^2 - 2x + 1) + (x^2 + 5x - 3)$", explanation: "Two polynomials to add" },
        { step: "$3x^2 + x^2 - 2x + 5x + 1 - 3$", explanation: "Remove parentheses and rearrange" },
        { step: "$(3x^2 + x^2) + (-2x + 5x) + (1 - 3)$", explanation: "Group terms by degree" },
        { step: "$4x^2 + 3x - 2$", explanation: "Add coefficients" },
      ],
    },
    {
      id: "poly6",
      question: "Multiply: $2x(3x^2 - x + 4)$",
      answer: "6x^3 - 2x^2 + 8x",
      hint: "Distribute 2x to each term inside the parentheses.",
      difficulty: "medium",
      detailedSolution: [
        { step: "$2x(3x^2 - x + 4)$", explanation: "Monomial times polynomial" },
        { step: "$2x \\cdot 3x^2 + 2x \\cdot (-x) + 2x \\cdot 4$", explanation: "Distribute $2x$ to each term" },
        { step: "$6x^3 - 2x^2 + 8x$", explanation: "Multiply coefficients and add exponents" },
      ],
    },
    // Hard problems
    {
      id: "poly7",
      question: "Expand and simplify: $(2x + 3)(x^2 - x + 2)$",
      answer: "2x^3 + x^2 + x + 6",
      hint: "Distribute each term of the binomial to every term of the trinomial.",
      difficulty: "hard",
      detailedSolution: [
        { step: "$(2x + 3)(x^2 - x + 2)$", explanation: "Binomial times trinomial" },
        { step: "$2x(x^2 - x + 2) + 3(x^2 - x + 2)$", explanation: "Distribute each term of the first factor" },
        { step: "$2x^3 - 2x^2 + 4x + 3x^2 - 3x + 6$", explanation: "Expand each distribution" },
        { step: "$2x^3 + (-2x^2 + 3x^2) + (4x - 3x) + 6$", explanation: "Group like terms" },
        { step: "$2x^3 + x^2 + x + 6$", explanation: "Combine like terms" },
      ],
    },
    {
      id: "poly8",
      question: "Factor completely: $x^3 - 8$",
      answer: "(x - 2)(x^2 + 2x + 4)",
      hint: "This is a difference of cubes: $a^3 - b^3 = (a-b)(a^2 + ab + b^2)$",
      difficulty: "hard",
      detailedSolution: [
        { step: "$x^3 - 8$", explanation: "Recognize as difference of cubes: $x^3 - 2^3$" },
        { step: "Use formula: $a^3 - b^3 = (a-b)(a^2 + ab + b^2)$", explanation: "With $a = x$ and $b = 2$" },
        { step: "$(x - 2)(x^2 + 2x + 4)$", explanation: "Apply the formula" },
      ],
    },
  ],
  "9-quadratics": [
    // Easy problems
    {
      id: "quad1",
      question: "Solve by factoring: $x^2 + 5x + 6 = 0$",
      answer: "-2,-3",
      hint: "Find two numbers that multiply to 6 and add to 5.",
      difficulty: "easy",
      detailedSolution: [
        { step: "$x^2 + 5x + 6 = 0$", explanation: "Quadratic equation in standard form" },
        { step: "$(x + 2)(x + 3) = 0$", explanation: "Factor: 2 and 3 multiply to 6 and add to 5" },
        { step: "$x + 2 = 0$ or $x + 3 = 0$", explanation: "Zero product property" },
        { step: "$x = -2$ or $x = -3$", explanation: "Solve each equation" },
      ],
    },
    {
      id: "quad2",
      question: "Solve: $x^2 - 9 = 0$",
      answer: "3,-3",
      hint: "This is a difference of squares: $x^2 - 9 = (x+3)(x-3)$",
      difficulty: "easy",
      detailedSolution: [
        { step: "$x^2 - 9 = 0$", explanation: "Difference of squares" },
        { step: "$x^2 = 9$", explanation: "Add 9 to both sides" },
        { step: "$x = \\pm 3$", explanation: "Take square root of both sides" },
      ],
    },
    {
      id: "quad3",
      question: "Solve: $x^2 = 16$",
      answer: "4,-4",
      hint: "Take the square root of both sides. Don't forget the negative solution!",
      difficulty: "easy",
      detailedSolution: [
        { step: "$x^2 = 16$", explanation: "Equation already isolated" },
        { step: "$x = \\pm\\sqrt{16}$", explanation: "Take square root (both positive and negative)" },
        { step: "$x = \\pm 4$", explanation: "Simplify: $x = 4$ or $x = -4$" },
      ],
    },
    // Medium problems
    {
      id: "quad4",
      question: "Solve using the quadratic formula: $x^2 - 4x + 3 = 0$",
      answer: "1,3",
      hint: "Use $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$ with $a=1, b=-4, c=3$",
      difficulty: "medium",
      detailedSolution: [
        { step: "Identify: $a=1, b=-4, c=3$", explanation: "Coefficients from standard form" },
        { step: "$\\Delta = (-4)^2 - 4(1)(3) = 16 - 12 = 4$", explanation: "Calculate discriminant" },
        { step: "$x = \\frac{-(-4) \\pm \\sqrt{4}}{2(1)} = \\frac{4 \\pm 2}{2}$", explanation: "Substitute into formula" },
        { step: "$x = 3$ or $x = 1$", explanation: "Evaluate both solutions" },
      ],
    },
    {
      id: "quad5",
      question: "Factor completely: $2x^2 + 7x + 3$",
      answer: "(2x + 1)(x + 3)",
      hint: "Look for factors of $2 \\times 3 = 6$ that add to 7.",
      difficulty: "medium",
      detailedSolution: [
        { step: "$2x^2 + 7x + 3$", explanation: "Quadratic with leading coefficient ≠ 1" },
        { step: "Find factors of $6$ that add to $7$: $6$ and $1$", explanation: "AC method" },
        { step: "$2x^2 + 6x + x + 3$", explanation: "Split middle term" },
        { step: "$(2x + 1)(x + 3)$", explanation: "Factor by grouping" },
      ],
    },
    {
      id: "quad6",
      question: "Complete the square: $x^2 + 6x = 7$",
      answer: "1,-7",
      hint: "Add $(\\frac{6}{2})^2 = 9$ to both sides.",
      difficulty: "medium",
      detailedSolution: [
        { step: "$x^2 + 6x = 7$", explanation: "Start with equation" },
        { step: "$x^2 + 6x + 9 = 7 + 9$", explanation: "Add $(\\frac{6}{2})^2 = 9$ to both sides" },
        { step: "$(x + 3)^2 = 16$", explanation: "Left side is perfect square" },
        { step: "$x + 3 = \\pm 4$", explanation: "Take square root" },
        { step: "$x = 1$ or $x = -7$", explanation: "Subtract 3 from both sides" },
      ],
    },
    // Hard problems
    {
      id: "quad7",
      question: "Solve: $x^4 - 5x^2 + 4 = 0$",
      answer: "1,-1,2,-2",
      hint: "Let $u = x^2$, then solve the quadratic in $u$, then find $x$.",
      difficulty: "hard",
      detailedSolution: [
        { step: "$x^4 - 5x^2 + 4 = 0$", explanation: "Quadratic in disguise" },
        { step: "Let $u = x^2$: $u^2 - 5u + 4 = 0$", explanation: "Substitution" },
        { step: "$(u - 1)(u - 4) = 0$", explanation: "Factor" },
        { step: "$u = 1$ or $u = 4$", explanation: "Solve for $u$" },
        { step: "$x^2 = 1$ gives $x = \\pm 1$; $x^2 = 4$ gives $x = \\pm 2$", explanation: "Back-substitute" },
      ],
    },
    {
      id: "quad8",
      question: "The sum of a number and its square is 72. Find the number.",
      answer: "8,-9",
      hint: "Set up equation: $x + x^2 = 72$, then solve.",
      difficulty: "hard",
      detailedSolution: [
        { step: "Let the number be $x$", explanation: "Define variable" },
        { step: "$x + x^2 = 72$", explanation: "Set up equation" },
        { step: "$x^2 + x - 72 = 0$", explanation: "Rearrange to standard form" },
        { step: "$(x + 9)(x - 8) = 0$", explanation: "Factor: -9 × 8 = -72, -9 + 8 = -1... wait, try (x-8)(x+9)" },
        { step: "$x = 8$ or $x = -9$", explanation: "Both are valid solutions" },
      ],
    },
  ],
  "9-linear": [
    // Easy
    {
      id: "lin1",
      question: "Solve for x: $2x + 5 = 11$",
      answer: "3",
      hint: "Subtract 5 from both sides, then divide by 2.",
      difficulty: "easy",
      detailedSolution: [
        { step: "$2x + 5 = 11$", explanation: "Original equation" },
        { step: "$2x = 6$", explanation: "Subtract 5 from both sides" },
        { step: "$x = 3$", explanation: "Divide both sides by 2" },
      ],
    },
    {
      id: "lin2",
      question: "Solve: $3x - 7 = 8$",
      answer: "5",
      hint: "Add 7 to both sides first.",
      difficulty: "easy",
      detailedSolution: [
        { step: "$3x - 7 = 8$", explanation: "Original equation" },
        { step: "$3x = 15$", explanation: "Add 7 to both sides" },
        { step: "$x = 5$", explanation: "Divide both sides by 3" },
      ],
    },
    // Medium
    {
      id: "lin3",
      question: "Solve: $5x - 3 = 2x + 9$",
      answer: "4",
      hint: "Get all x terms on one side and constants on the other.",
      difficulty: "medium",
      detailedSolution: [
        { step: "$5x - 3 = 2x + 9$", explanation: "Variables on both sides" },
        { step: "$5x - 2x = 9 + 3$", explanation: "Move x terms left, constants right" },
        { step: "$3x = 12$", explanation: "Simplify both sides" },
        { step: "$x = 4$", explanation: "Divide by 3" },
      ],
    },
    {
      id: "lin4",
      question: "Solve: $\\frac{x}{3} + 2 = 5$",
      answer: "9",
      hint: "Subtract 2 first, then multiply by 3.",
      difficulty: "medium",
      detailedSolution: [
        { step: "$\\frac{x}{3} + 2 = 5$", explanation: "Equation with fraction" },
        { step: "$\\frac{x}{3} = 3$", explanation: "Subtract 2 from both sides" },
        { step: "$x = 9$", explanation: "Multiply both sides by 3" },
      ],
    },
    // Hard
    {
      id: "lin5",
      question: "Solve: $\\frac{2x + 1}{3} = \\frac{x - 2}{2}$",
      answer: "-7",
      hint: "Cross multiply to eliminate fractions.",
      difficulty: "hard",
      detailedSolution: [
        { step: "$\\frac{2x + 1}{3} = \\frac{x - 2}{2}$", explanation: "Proportion with variables" },
        { step: "$2(2x + 1) = 3(x - 2)$", explanation: "Cross multiply" },
        { step: "$4x + 2 = 3x - 6$", explanation: "Distribute" },
        { step: "$x = -8$", explanation: "Subtract 3x and 2 from both sides" },
      ],
    },
  ],
  "9-trigonometry": [
    // Easy
    {
      id: "trig1",
      question: "Find $\\sin(30°)$",
      answer: "1/2",
      hint: "This is a special angle. Remember: 30-60-90 triangle.",
      difficulty: "easy",
      detailedSolution: [
        { step: "$\\sin(30°)$", explanation: "Special angle" },
        { step: "$\\sin(30°) = \\frac{1}{2}$", explanation: "From the 30-60-90 triangle ratio" },
      ],
    },
    {
      id: "trig2",
      question: "Find $\\cos(60°)$",
      answer: "1/2",
      hint: "Another special angle from the 30-60-90 triangle.",
      difficulty: "easy",
      detailedSolution: [
        { step: "$\\cos(60°)$", explanation: "Special angle" },
        { step: "$\\cos(60°) = \\frac{1}{2}$", explanation: "From the 30-60-90 triangle ratio" },
      ],
    },
    // Medium
    {
      id: "trig3",
      question: "If $\\sin(\\theta) = \\frac{3}{5}$ and $\\theta$ is acute, find $\\cos(\\theta)$",
      answer: "4/5",
      hint: "Use the Pythagorean identity: $\\sin^2(\\theta) + \\cos^2(\\theta) = 1$",
      difficulty: "medium",
      detailedSolution: [
        { step: "$\\sin^2(\\theta) + \\cos^2(\\theta) = 1$", explanation: "Pythagorean identity" },
        { step: "$(\\frac{3}{5})^2 + \\cos^2(\\theta) = 1$", explanation: "Substitute sin value" },
        { step: "$\\frac{9}{25} + \\cos^2(\\theta) = 1$", explanation: "Square the fraction" },
        { step: "$\\cos^2(\\theta) = \\frac{16}{25}$", explanation: "Subtract 9/25 from both sides" },
        { step: "$\\cos(\\theta) = \\frac{4}{5}$", explanation: "Take positive root (acute angle)" },
      ],
    },
    // Hard
    {
      id: "trig4",
      question: "Solve for $x$ in $[0°, 360°]$: $2\\sin(x) - 1 = 0$",
      answer: "30,150",
      hint: "First solve for sin(x), then find all angles in the given range.",
      difficulty: "hard",
      detailedSolution: [
        { step: "$2\\sin(x) - 1 = 0$", explanation: "Original equation" },
        { step: "$\\sin(x) = \\frac{1}{2}$", explanation: "Solve for sin(x)" },
        { step: "$x = 30°$ (Quadrant I)", explanation: "Reference angle where sin = 1/2" },
        { step: "$x = 180° - 30° = 150°$ (Quadrant II)", explanation: "Sin is also positive in Q2" },
      ],
    },
  ],
};

// Default problems for topics not in the list
export const defaultProblems: Problem[] = [
  {
    id: "def1",
    question: "Solve: $x + 5 = 12$",
    answer: "7",
    hint: "Subtract 5 from both sides.",
    difficulty: "easy",
    detailedSolution: [
      { step: "$x + 5 = 12$", explanation: "Original equation" },
      { step: "$x = 7$", explanation: "Subtract 5 from both sides" },
    ],
  },
  {
    id: "def2",
    question: "Simplify: $3 \\times 4 + 2$",
    answer: "14",
    hint: "Remember order of operations: multiply first, then add.",
    difficulty: "easy",
    detailedSolution: [
      { step: "$3 \\times 4 + 2$", explanation: "Original expression" },
      { step: "$12 + 2$", explanation: "Multiply first" },
      { step: "$14$", explanation: "Then add" },
    ],
  },
];
