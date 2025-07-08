import { CodingQuestion, FunctionSignature } from '../../../shared/models/codingQuestion.model';

export class TypescriptCodeGenerator {
  static generateTypescriptCode(
    codingQuestion: CodingQuestion,
    signature: FunctionSignature,
  ): string {
    const argsList = signature.arguments.map(arg => `${arg.name}: any`).join(', ');
    let code = `class Solution {\n`;
    code += `  ${codingQuestion.functionName}(${argsList}): any {\n`;
    code += `    // TODO: Implement this function\n`;
    code += `    return null;\n`;
    code += `  }\n`;
    code += `}\n\n`;

    code += `function main() {\n`;
    signature.arguments.forEach(arg => {
      code += `  // ${arg.name}: ${arg.type}\n`;
      code += `  const ${arg.name} = prompt('Enter ${arg.name}:');\n`;
    });
    code += `  const solution = new Solution();\n`;
    code += `  const result = solution.${codingQuestion.functionName}(${signature.arguments.map(arg => arg.name).join(', ')});\n`;
    code += `  console.log(result);\n`;
    code += `}\n\nmain();\n`;
    return code;
  }
}