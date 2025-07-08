import { CodingQuestion, FunctionSignature } from '../../../shared/models/codingQuestion.model';

export class PythonCodeGenerator {
  static generatePythonCode(
    codingQuestion: CodingQuestion,
    signature: FunctionSignature,
  ): string {
    const argsList = signature.arguments.map(arg => arg.name).join(', ');
    let code = `class Solution:\n`;
    code += `    def ${codingQuestion.functionName}(self, ${argsList}):\n`;
    code += `        # TODO: Implement this function\n`;
    code += `        pass\n\n`;

    code += `if __name__ == "__main__":\n`;
    signature.arguments.forEach(arg => {
      code += `    # ${arg.name}: ${arg.type}\n`;
      code += `    ${arg.name} = input()\n`;
    });
    code += `    solution = Solution()\n`;
    code += `    result = solution.${codingQuestion.functionName}(${argsList})\n`;
    code += `    print(result)\n`;
    return code;
  }
}