export interface CodingQuestion {
  id?: string;
  title: string;
  description: string;
  testCases: TestCase[];
  functionSignatures: FunctionSignature[];
  functionName: string;
}

export interface FunctionSignature {
  language: string;
  arguments: FunctionArgument[];
  returnType: string;
}

export interface FunctionArgument {
  name: string;
  type: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface CodingSubmission {
  codingSubmissionId: string;
  questionId: string;
  userCode: string;
  language: string;
  userId: string;
  createdAt: string; // ISO 8601 formatted date
  score: number; // e.g., 90/100
}
export interface CodeExecution {
  code: string;
  input: string;
  language: string;
}

export interface Status {
  id: number;
  description: string;
}

export interface CodeExecutionResult {
  stdout?: string;
  time?: string;
  memory?: string;
  stderr?: string;
  compile_output?: string;
  message?: string;
  status?: Status;
}
