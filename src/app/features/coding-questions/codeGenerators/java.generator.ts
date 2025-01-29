import {
  CodingQuestion,
  FunctionSignature,
} from '../../../shared/models/codingQuestion.model';

export class JavaCodeGenerator {
  static generateJavaCode(
    codingQuestion: CodingQuestion,
    signature: FunctionSignature,
  ): string {
    let code = '';

    const { arguments: args, returnType } = signature;
    // Add imports for standard libraries
    code += 'import java.util.*;\n\n';
    const argsList = args.map((arg) => `${arg.type} ${arg.name}`).join(', ');
    code += `class Solution {
    public ${returnType} ${codingQuestion.functionName}(${argsList}) {
        // TODO: Implement this function
        return null; // Replace with appropriate return value
    }
}\n`;

    // Add the Main class that will handle input parsing and calling the solution
    code += 'public class Main {\n';
    code += '    public static void main(String[] args) {\n';
    code += '        Scanner scanner = new Scanner(System.in);\n';

    // Find the Java function signature
    const javaFunctionSignature = codingQuestion.functionSignatures.find(
      (fn) => fn.language === 'java',
    );

    if (!javaFunctionSignature) {
      throw new Error('No Java function signature found');
    }

    // Handle input parsing for each argument
    const functionArgs = javaFunctionSignature.arguments;
    let stdinParser = '';

    functionArgs.forEach((arg) => {
      const { type, name } = arg;

      switch (type) {
        case 'List<Integer>':
          stdinParser += `
        String listInput = scanner.nextLine().trim();
        List<Integer> ${name} = new ArrayList<>();
        listInput = listInput.substring(1, listInput.length() - 1); // Remove brackets
        if (!listInput.isEmpty()) {
            for (String num : listInput.split(",")) {
                ${name}.add(Integer.parseInt(num.trim()));
            }
        }
          `;
          break;
        case 'Integer':
        case 'int':
          stdinParser += `        int ${name} = Integer.parseInt(scanner.nextLine().trim());\n`;
          break;
        case 'boolean':
          stdinParser += `        boolean ${name} = Boolean.parseBoolean(scanner.nextLine().trim());\n`;
          break;
        case 'String':
          stdinParser += `        String ${name} = scanner.nextLine().trim();\n`;
          break;

        case 'List<String>':
          stdinParser += `
        String listInputStr = scanner.nextLine().trim();
        List<String> ${name} = new ArrayList<>();
        listInputStr = listInputStr.substring(1, listInputStr.length() - 1); // Remove brackets
        if (!listInputStr.isEmpty()) {
            for (String str : listInputStr.split(",")) {
                ${name}.eadd(str.trim());
            }
        }
          `;
          break;

        default:
          throw new Error(`Unsupported argument type: ${type}`);
      }
    });

    // Insert the input parsing logic
    code += stdinParser;

    // Create an instance of the Solution class and call the user-defined function
    code += '        Solution solution = new Solution();\n';
    code += `        ${this.generateFunctionCall(javaFunctionSignature, codingQuestion.functionName)}\n`;

    // End the main method
    code += '    }\n';
    code += '}\n';

    return code;
  }

  private static generateFunctionCall(
    functionSignature: FunctionSignature,
    functionName: string,
  ): string {
    let call = `${functionSignature.returnType} result = solution.${functionName}(`;

    // Add arguments to the function call
    functionSignature.arguments.forEach((arg, index) => {
      call += arg.name;
      if (index < functionSignature.arguments.length - 1) {
        call += ', ';
      }
    });

    call += ');\n';
    call += '        System.out.println(result);';

    return call;
  }
}
